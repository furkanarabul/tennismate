<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import FeedPost from '@/components/community/FeedPost.vue'
import { useCommunityStore, type Post } from '@/stores/community'

const route = useRoute()
const router = useRouter()
const store = useCommunityStore()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const fetchPost = async () => {
  const postId = route.params.id as string
  if (!postId) return

  loading.value = true
  try {
    // Use store to fetch post so it's reactive with global state (likes, comments)
    const fetchedPost = await store.fetchPost(postId)
    post.value = fetchedPost

    // Handle deep linking to comment
    if (route.query.commentId) {
        await nextTick()
        // Wait for comments to likely be rendered
        scrollToComment(route.query.commentId as string)
    }

  } catch (err: any) {
    error.value = 'Failed to load post'
  } finally {
    loading.value = false
  }
}

const scrollToComment = (commentId: string) => {
    // Retry finding the element a few times since comments might load asynchronously
    let attempts = 0
    const tryScroll = () => {
        const el = document.getElementById(`comment-${commentId}`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Add a temporary flash effect if needed, but the prop should handle persistent highlight
        } else if (attempts < 10) {
            attempts++
            setTimeout(tryScroll, 300)
        }
    }
    tryScroll()
}

onMounted(() => {
  fetchPost()
})

import { watch } from 'vue'
watch(() => route.query, () => {
})
</script>

<template>
  <div class="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
    <div class="mb-4">
      <Button variant="ghost" class="gap-2 pl-0 hover:pl-0 hover:bg-transparent" @click="router.push('/community')">
        <ArrowLeft class="h-4 w-4" />
        {{ $t('community.back') }}
      </Button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-destructive">{{ error }}</p>
      <Button variant="outline" class="mt-4" @click="fetchPost">
        {{ $t('common.retry') || 'Retry' }}
      </Button>
    </div>

    <div v-else-if="post">
      <FeedPost 
        :post="post" 
        :initially-expanded="true"
        :highlight-comment-id="route.query.commentId as string"
        :highlight-post="route.query.highlight === 'true'"
      />
    </div>
  </div>
</template>
