<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import FeedPost from '@/components/community/FeedPost.vue'
import type { Post } from '@/stores/community'

const route = useRoute()
const router = useRouter()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const fetchPost = async () => {
  const postId = route.params.id as string
  if (!postId) return

  loading.value = true
  try {
    const { data, error: err } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (name, avatar_url)
      `)
      .eq('id', postId)
      .single()

    if (err) throw err

    // Fetch integration details manually or reuse logic from store if available,
    // but here we just need to ensure the FeedPost can render it.
    // FeedPost expects a Post object which includes user_has_liked etc.
    // We need to fetch those dynamic fields.
    
    // Actually, for simplicity, let's just fetch the raw post and then
    // check 'post_likes' for current user.
    const { data: likesData } = await supabase
        .from('post_likes')
        .select('created_at')
        .eq('post_id', postId)
    
    // Check if current user liked it
    const { data: userLike } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()
        
    // Get comment count
    const { count: commentCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

    const fullPost: Post = {
        ...data,
        likes_count: likesData?.length || 0,
        comments_count: commentCount || 0,
        user_has_liked: !!userLike
    }
    
    post.value = fullPost

    // Handle deep linking to comment
    if (route.query.commentId) {
        await nextTick()
        // We need to wait for FeedPost to mount and also potentially fetch comments if it does so lazily.
        // FeedPost typically fetches comments only when expanded or always?
        // Let's assume FeedPost handles fetching comments.
        // We might need to pass a prop 'initialOpen' or similar to FeedPost.
        scrollToComment(route.query.commentId as string)
    }

  } catch (err: any) {
    console.error('Error fetching post:', err)
    error.value = 'Failed to load post'
  } finally {
    loading.value = false
  }
}

const scrollToComment = (commentId: string) => {
    setTimeout(() => {
        const el = document.getElementById(`comment-${commentId}`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, 1000) // Small delay to allow comments to load
}

onMounted(() => {
  fetchPost()
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
      />
    </div>
  </div>
</template>
