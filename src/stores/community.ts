import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface Post {
    id: string
    user_id: string
    content: string
    media_url?: string | null
    post_type: 'general' | 'match_request' | 'question'
    location?: any
    created_at: string
    updated_at: string
    profiles?: {
        name: string
        avatar_url: string
    }
    likes_count?: number
    comments_count?: number
    user_has_liked?: boolean
}

export interface Comment {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
    parent_id?: string | null
    profiles?: {
        name: string
        avatar_url: string
    }
    likes_count?: number
    user_has_liked?: boolean
}

export const useCommunityStore = defineStore('community', () => {
    const posts = ref<Post[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const fetchPosts = async () => {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            const userId = authStore.user?.id

            const { data, error: err } = await supabase
                .from('posts')
                .select(`
          *,
          profiles:user_id (name, avatar_url),
          likes:post_likes (user_id),
          comments:post_comments (count)
        `)
                .order('created_at', { ascending: false })

            if (err) throw err

            posts.value = data.map((post: any) => ({
                ...post,
                likes_count: post.likes?.length || 0,
                comments_count: post.comments?.[0]?.count || 0,
                user_has_liked: userId ? post.likes?.some((like: any) => like.user_id === userId) : false
            }))
        } catch (err: any) {
            console.error('Error fetching posts:', err)
            error.value = err.message
        } finally {
            loading.value = false
        }
    }

    const createPost = async (content: string, type: 'general' | 'match_request' | 'question' = 'general') => {
        try {
            const authStore = useAuthStore()
            if (!authStore.user) throw new Error('User not authenticated')

            const { data, error: err } = await supabase
                .from('posts')
                .insert({
                    user_id: authStore.user.id,
                    content,
                    post_type: type
                })
                .select(`
          *,
          profiles:user_id (name, avatar_url)
        `)
                .single()

            if (err) throw err

            // Add to local state immediately
            posts.value.unshift({
                ...data,
                likes_count: 0,
                comments_count: 0,
                user_has_liked: false
            })

            return data
        } catch (err: any) {
            console.error('Error creating post:', err)
            throw err
        }
    }

    const toggleLike = async (postId: string) => {
        const authStore = useAuthStore()
        if (!authStore.user) return

        const postIndex = posts.value.findIndex(p => p.id === postId)
        if (postIndex === -1) return

        const post = posts.value[postIndex]
        if (!post) return

        // Prevent self-like
        if (post.user_id === authStore.user.id) return

        const wasLiked = post.user_has_liked

        // Optimistic update
        post.user_has_liked = !wasLiked
        post.likes_count = (post.likes_count || 0) + (wasLiked ? -1 : 1)

        try {
            if (wasLiked) {
                await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', authStore.user.id)
            } else {
                await supabase
                    .from('post_likes')
                    .insert({
                        post_id: postId,
                        user_id: authStore.user.id
                    })
            }
        } catch (err) {
            // Revert on error
            console.error('Error toggling like:', err)
            post.user_has_liked = wasLiked
            post.likes_count = (post.likes_count || 0) + (wasLiked ? 1 : -1)
        }
    }

    return {
        posts,
        loading,
        error,
        fetchPosts,
        createPost,
        toggleLike,
        fetchComments,
        createComment,
        deleteComment,
        updateComment,
        toggleCommentLike,
        deletePost,
        updatePost
    }

    async function deletePost(postId: string) {
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)

            if (error) throw error

            posts.value = posts.value.filter(p => p.id !== postId)
        } catch (err) {
            console.error('Error deleting post:', err)
            throw err
        }
    }

    async function updatePost(postId: string, content: string) {
        try {
            const { error } = await supabase
                .from('posts')
                .update({ content })
                .eq('id', postId)

            if (error) throw error

            const post = posts.value.find(p => p.id === postId)
            if (post) {
                post.content = content
            }
        } catch (err) {
            console.error('Error updating post:', err)
            throw err
        }
    }

    async function fetchComments(postId: string) {
        try {
            const authStore = useAuthStore()
            const userId = authStore.user?.id

            const { data, error } = await supabase
                .from('post_comments')
                .select(`
                    *,
                    profiles:user_id (name, avatar_url),
                    likes:comment_likes (user_id)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true })

            if (error) throw error

            return data.map((comment: any) => ({
                ...comment,
                likes_count: comment.likes?.length || 0,
                user_has_liked: userId ? comment.likes?.some((like: any) => like.user_id === userId) : false
            })) as Comment[]
        } catch (err) {
            console.error('Error fetching comments:', err)
            throw err
        }
    }

    async function createComment(postId: string, content: string, parentId?: string) {
        try {
            const authStore = useAuthStore()
            if (!authStore.user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: postId,
                    user_id: authStore.user.id,
                    content,
                    parent_id: parentId
                })
                .select(`
                    *,
                    profiles:user_id (name, avatar_url)
                `)
                .single()

            if (error) throw error

            // Update local post comment count
            const post = posts.value.find(p => p.id === postId)
            if (post) {
                post.comments_count = (post.comments_count || 0) + 1
            }

            return data as Comment
        } catch (err) {
            console.error('Error creating comment:', err)
            throw err
        }
    }

    async function deleteComment(commentId: string, postId: string) {
        try {
            const { error } = await supabase
                .from('post_comments')
                .delete()
                .eq('id', commentId)

            if (error) throw error

            // Update local post comment count
            const post = posts.value.find(p => p.id === postId)
            if (post) {
                post.comments_count = Math.max((post.comments_count || 0) - 1, 0)
            }
        } catch (err) {
            console.error('Error deleting comment:', err)
            throw err
        }
    }

    async function updateComment(commentId: string, content: string) {
        try {
            const { error } = await supabase
                .from('post_comments')
                .update({ content })
                .eq('id', commentId)

            if (error) throw error
        } catch (err) {
            console.error('Error updating comment:', err)
            throw err
        }
    }

    async function toggleCommentLike(comment: Comment) {
        const authStore = useAuthStore()
        if (!authStore.user) return

        if (comment.user_id === authStore.user.id) {
            console.warn('Cannot like your own comment')
            return
        }

        const wasLiked = comment.user_has_liked
        // Optimistic update
        comment.user_has_liked = !wasLiked
        comment.likes_count = (comment.likes_count || 0) + (wasLiked ? -1 : 1)

        try {
            if (wasLiked) {
                await supabase
                    .from('comment_likes')
                    .delete()
                    .eq('comment_id', comment.id)
                    .eq('user_id', authStore.user.id)
            } else {
                await supabase
                    .from('comment_likes')
                    .insert({
                        comment_id: comment.id,
                        user_id: authStore.user.id
                    })
            }
        } catch (err) {
            console.error('Error toggling comment like:', err)
            // Revert
            comment.user_has_liked = wasLiked
            comment.likes_count = (comment.likes_count || 0) + (wasLiked ? 1 : -1)
        }
    }
})
