<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCommunityStore } from '@/stores/community'
import FeedPost from '@/components/community/FeedPost.vue'
import CreatePostWidget from '@/components/community/CreatePostWidget.vue'
import { Loader2 } from 'lucide-vue-next'

const store = useCommunityStore()

onMounted(() => {
  store.fetchPosts()
})

const posts = computed(() => store.posts)
</script>

<template>
  <div class="min-h-screen bg-muted/30 pb-20">
    <div class="max-w-xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Community</h1>
        <p class="text-muted-foreground text-sm">Connect with local players, share moments, and find matches.</p>
      </div>

      <!-- Create Post -->
      <CreatePostWidget />

      <!-- Feed -->
      <div v-if="store.loading && posts.length === 0" class="flex justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      
      <div v-else-if="posts.length === 0" class="text-center py-12 text-muted-foreground">
        <p>No posts yet. Be the first to say hello!</p>
      </div>

      <div v-else class="space-y-4">
        <FeedPost 
          v-for="post in posts" 
          :key="post.id" 
          :post="post" 
        />
      </div>
    </div>
  </div>
</template>
