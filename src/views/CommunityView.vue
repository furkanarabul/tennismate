<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCommunityStore } from '@/stores/community'
import FeedPost from '@/components/community/FeedPost.vue'
import CreatePostWidget from '@/components/community/CreatePostWidget.vue'
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { t } = useI18n()
const store = useCommunityStore()

// Initialize
onMounted(() => {
  store.page = 0 // Reset page to 0 on mount
  store.fetchPosts()
})

const posts = computed(() => store.posts)

// Pagination Logic
const totalPages = computed(() => Math.ceil(store.totalPosts / store.limit))
const currentPage = computed(() => store.page + 1)
const showPagination = computed(() => totalPages.value > 1)

// Generate page numbers to show (e.g. 1, 2, 3, 4, 5)
const visiblePages = computed(() => {
  const delta = 2
  const range = []
  const max = totalPages.value
  const current = currentPage.value

  for (let i = 1; i <= max; i++) {
    if (i === 1 || i === max || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== '...') {
      range.push('...')
    }
  }
  return range
})

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  store.page = page - 1
  store.fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleLimitChange = (event: Event) => {
  const val = parseInt((event.target as HTMLSelectElement).value)
  store.limit = val
  store.page = 0 // Reset to first page
  store.fetchPosts()
}
</script>

<template>
  <div class="min-h-screen bg-muted/30 pb-20">
    <div class="max-w-xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('community.title') }}</h1>
          <p class="text-muted-foreground text-sm">{{ t('community.subtitle') }}</p>
        </div>
      </div>

      <!-- Create Post -->
      <CreatePostWidget />

      <!-- Feed -->
      <div v-if="store.loading && posts.length === 0" class="flex justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      
      <div v-else-if="posts.length === 0" class="text-center py-12 text-muted-foreground">
        <p>{{ t('community.no_posts') }}</p>
      </div>

      <div v-else class="space-y-4">
        <FeedPost 
          v-for="post in posts" 
          :key="post.id" 
          :post="post" 
        />
      </div>

      <!-- Pagination Footer -->
      <div v-if="!store.loading && posts.length > 0" class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <!-- Limit Selector -->
        <div class="flex items-center gap-2 text-sm text-muted-foreground bg-background border px-3 py-1.5 rounded-md shadow-sm order-2 sm:order-1">
          <span>{{ t('community.pagination.posts_per_page') }}:</span>
          <select 
            :value="store.limit" 
            @change="handleLimitChange"
            class="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>

        <!-- Numbered Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 order-1 sm:order-2">
            <Button 
            variant="outline" 
            size="icon" 
            @click="handlePageChange(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="h-8 w-8"
            >
            <ChevronLeft class="h-4 w-4" />
            </Button>

            <div class="flex items-center gap-1">
            <template v-for="(p, index) in visiblePages" :key="index">
                <Button
                v-if="p !== '...'"
                :variant="p === currentPage ? 'default' : 'ghost'"
                size="sm"
                class="h-8 w-8 p-0 font-medium"
                @click="handlePageChange(p as number)"
                >
                {{ p }}
                </Button>
                <span v-else class="text-muted-foreground px-1 text-xs">...</span>
            </template>
            </div>

            <Button 
            variant="outline" 
            size="icon" 
            @click="handlePageChange(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="h-8 w-8"
            >
            <ChevronRight class="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      <!-- Loading indicator for pagination -->
      <div v-if="store.loading && posts.length > 0" class="mt-4 flex justify-center">
         <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

    </div>
  </div>
</template>
