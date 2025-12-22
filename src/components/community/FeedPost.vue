<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, MoreHorizontal, Send, Trash2, Loader2, Edit2, Reply, X, CornerDownRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCommunityStore, type Post, type Comment } from '@/stores/community'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  post: Post
}>()

const store = useCommunityStore()
const authStore = useAuthStore()

const showComments = ref(false)
const comments = ref<Comment[]>([])
const loadingComments = ref(false)
const newComment = ref('')
const submittingComment = ref(false)

// Editing state
const editingCommentId = ref<string | null>(null)
const editContent = ref('')
const updatingComment = ref(false)

// Reply state
const replyingToId = ref<string | null>(null)
const replyingToUser = ref<string | null>(null)
const replyContent = ref('')
const submittingReply = ref(false)

const isOwnPost = computed(() => {
  return authStore.user?.id === props.post.user_id
})

// Group comments into parents and children
const rootComments = computed(() => {
  return comments.value.filter(c => !c.parent_id)
})

const getReplies = (parentId: string) => {
  return comments.value.filter(c => c.parent_id === parentId)
}

const handleLike = () => {
  if (isOwnPost.value) return
  store.toggleLike(props.post.id)
}

const toggleComments = async () => {
  showComments.value = !showComments.value
  if (showComments.value && comments.value.length === 0) {
    await loadComments()
  }
}

const loadComments = async () => {
  loadingComments.value = true
  try {
    const data = await store.fetchComments(props.post.id)
    comments.value = data || []
  } catch (err) {
    console.error('Failed to load comments', err)
  } finally {
    loadingComments.value = false
  }
}

// Add top-level comment
const handleAddComment = async () => {
  if (!newComment.value.trim()) return
  
  submittingComment.value = true
  try {
    const comment = await store.createComment(props.post.id, newComment.value)
    if (comment) {
      comments.value.push(comment)
      newComment.value = ''
    }
  } catch (err) {
    console.error('Failed to add comment', err)
  } finally {
    submittingComment.value = false
  }
}

// Add reply
const handleReply = async (parentId: string) => {
  if (!replyContent.value.trim()) return

  submittingReply.value = true
  try {
    const comment = await store.createComment(props.post.id, replyContent.value, parentId)
    if (comment) {
      comments.value.push(comment)
      replyContent.value = ''
      replyingToId.value = null
      replyingToUser.value = null
    }
  } catch (err) {
    console.error('Failed to add reply', err)
  } finally {
    submittingReply.value = false
  }
}

const handleDeleteComment = async (commentId: string) => {
  try {
    await store.deleteComment(commentId, props.post.id)
    comments.value = comments.value.filter(c => c.id !== commentId && c.parent_id !== commentId) // Remove children too locally if implied
  } catch (err) {
    console.error('Failed to delete comment', err)
  }
}

const startEditComment = (comment: Comment) => {
  editingCommentId.value = comment.id
  editContent.value = comment.content
  replyingToId.value = null // Cancel reply if editing
}

const startReply = (comment: Comment) => {
  replyingToId.value = comment.id
  replyingToUser.value = comment.profiles?.name || 'User'
  editingCommentId.value = null // Cancel edit if replying
  replyContent.value = ''
}

const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

const cancelReply = () => {
  replyingToId.value = null
  replyingToUser.value = null
  replyContent.value = ''
}

const handleUpdateComment = async () => {
  if (!editingCommentId.value || !editContent.value.trim()) return

  updatingComment.value = true
  try {
    await store.updateComment(editingCommentId.value, editContent.value)
    
    // Update local state
    const comment = comments.value.find(c => c.id === editingCommentId.value)
    if (comment) {
      comment.content = editContent.value
    }
    cancelEdit()
  } catch (err) {
    console.error('Failed to update comment', err)
  } finally {
    updatingComment.value = false
  }
}

const handleLikeComment = (comment: Comment) => {
  if (isOwnComment(comment.user_id)) return
  store.toggleCommentLike(comment)
}

const isOwnComment = (userId: string) => {
  return authStore.user?.id === userId
}
</script>

<template>
  <Card class="mb-4 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow duration-200">
    <CardHeader class="p-4 flex flex-row items-center gap-4 pb-2">
      <Avatar 
        :src="post.profiles?.avatar_url" 
        :fallback="post.profiles?.name?.charAt(0).toUpperCase() || 'U'"
        class="h-10 w-10 border border-border" 
      />
      
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-sm">{{ post.profiles?.name || 'Unknown User' }}</h3>
          <span class="text-xs text-muted-foreground">
            {{ formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) }}
          </span>
        </div>
        <p v-if="post.post_type !== 'general'" 
           class="text-[10px] uppercase font-bold tracking-wider mt-0.5"
           :class="{
             'text-blue-500': post.post_type === 'match_request',
             'text-amber-500': post.post_type === 'question'
           }"
        >
          {{ post.post_type.replace('_', ' ') }}
        </p>
      </div>

      <Button variant="ghost" size="icon" class="h-8 w-8 -mr-2 text-muted-foreground">
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </CardHeader>

    <CardContent class="p-4 pt-0">
      <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{{ post.content }}</p>
      
      <div v-if="post.media_url" class="mt-3 rounded-lg overflow-hidden border border-border">
        <img :src="post.media_url" alt="Post content" class="w-full h-auto object-cover max-h-[400px]" />
      </div>

      <div class="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          class="gap-2 px-2"
          :class="{ 
            'text-red-500 hover:text-red-600': post.user_has_liked, 
            'text-muted-foreground hover:text-red-500': !post.user_has_liked,
            'opacity-50 cursor-not-allowed hover:text-muted-foreground': isOwnPost
          }"
          :disabled="isOwnPost"
          @click="handleLike"
          :title="isOwnPost ? 'You cannot like your own post' : ''"
        >
          <Heart class="h-4 w-4" :class="{ 'fill-current': post.user_has_liked }" />
          <span class="text-xs font-medium">{{ post.likes_count || 0 }}</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          class="gap-2 px-2 text-muted-foreground hover:text-primary"
          @click="toggleComments"
        >
          <MessageCircle class="h-4 w-4" />
          <span class="text-xs font-medium">{{ post.comments_count || 0 }}</span>
        </Button>
      </div>

      <!-- Comments Section -->
      <div v-if="showComments" class="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
        
        <!-- Loading -->
        <div v-if="loadingComments" class="flex justify-center py-4">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>

        <!-- Comments List -->
        <div v-else class="space-y-4 mb-4">
          <div v-if="comments.length === 0" class="text-center py-2 text-xs text-muted-foreground">
            No comments yet.
          </div>
          
          <!-- Parent Comments Loop -->
          <div v-for="comment in rootComments" :key="comment.id" class="flex gap-3 mb-4 last:mb-0">
            <Avatar 
              :src="comment.profiles?.avatar_url" 
              :fallback="comment.profiles?.name?.charAt(0).toUpperCase() || 'U'"
              class="h-8 w-8 border border-border flex-shrink-0 z-10 bg-background" 
            />
            <div class="flex-1 space-y-2">
              
              <!-- Content Block (Edit or View) -->
              <div v-if="editingCommentId === comment.id" class="space-y-2">
                 <Input 
                    v-model="editContent" 
                    class="h-8 text-xs" 
                    @keyup.enter="handleUpdateComment"
                    :disabled="updatingComment"
                 />
                 <div class="flex gap-2">
                   <Button size="sm" variant="default" class="h-6 px-2 text-[10px]" @click="handleUpdateComment" :disabled="updatingComment">
                      <Loader2 v-if="updatingComment" class="h-3 w-3 animate-spin mr-1" />
                      Save
                   </Button>
                   <Button size="sm" variant="ghost" class="h-6 px-2 text-[10px]" @click="cancelEdit" :disabled="updatingComment">
                      Cancel
                   </Button>
                 </div>
              </div>

              <div v-else class="bg-muted/40 rounded-lg p-3 text-sm relative group">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-xs">{{ comment.profiles?.name || 'Unknown' }}</span>
                  <span class="text-[10px] text-muted-foreground">
                    {{ formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) }}
                  </span>
                </div>
                <p class="text-foreground/90 break-words">{{ comment.content }}</p>
              </div>
              
              <!-- Action Bar -->
              <div class="flex items-center gap-4 px-1">
                  <!-- Like -->
                  <button 
                    @click="handleLikeComment(comment)"
                    class="text-[10px] flex items-center gap-1 transition-colors group"
                    :class="{ 
                      'text-red-500 hover:text-red-600': comment.user_has_liked, 
                      'text-muted-foreground hover:text-red-500': !comment.user_has_liked && !isOwnComment(comment.user_id),
                      'text-muted-foreground opacity-50 cursor-not-allowed': isOwnComment(comment.user_id)
                    }"
                    :disabled="isOwnComment(comment.user_id)"
                  >
                    <Heart class="h-3 w-3 transition-transform group-hover:scale-110" :class="{ 'fill-current': comment.user_has_liked }" />
                    <span v-if="comment.likes_count" class="font-medium">{{ comment.likes_count }}</span>
                  </button>

                  <!-- Reply -->
                  <button 
                    @click="startReply(comment)"
                    class="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Reply class="h-3 w-3" />
                    Reply
                  </button>

                  <!-- Edit/Delete (if own) -->
                  <template v-if="isOwnComment(comment.user_id) && editingCommentId !== comment.id">
                    <button 
                      @click="startEditComment(comment)"
                      class="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Edit2 class="h-3 w-3" />
                      Edit
                    </button>
                    <button 
                      @click="handleDeleteComment(comment.id)"
                      class="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <Trash2 class="h-3 w-3" />
                      Delete
                    </button>
                  </template>
              </div>

              <!-- Reply Input Area -->
              <div v-if="replyingToId === comment.id" class="mt-2 pl-2 border-l-2 border-primary/20 animate-in slide-in-from-left-2 duration-300">
                  <div class="flex items-center justify-between mb-1.5 px-1">
                      <span class="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <CornerDownRight class="h-3 w-3" />
                        Replying to <span class="text-primary font-semibold">@{{ replyingToUser }}</span>
                      </span>
                  </div>
                  <div class="flex gap-2 items-center">
                    <Input 
                      v-model="replyContent"
                      placeholder="Write your reply..."
                      class="h-8 text-xs bg-background"
                      @keyup.enter="handleReply(comment.id)"
                      :disabled="submittingReply"
                      autoFocus
                    />
                    <Button size="sm" class="h-8 w-8 p-0 shrink-0" @click="handleReply(comment.id)" :disabled="!replyContent.trim() || submittingReply">
                      <Loader2 v-if="submittingReply" class="h-3 w-3 animate-spin" />
                      <Send v-else class="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" class="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground" @click="cancelReply">
                      <X class="h-3 w-3" />
                    </Button>
                  </div>
              </div>

              <!-- Nested Replies -->
              <div v-if="getReplies(comment.id).length > 0" class="pl-3 space-y-3 pt-2 relative">
                  <!-- Thread Line -->
                  <div class="absolute left-[-11px] top-[-10px] bottom-4 w-px bg-border/40"></div>
                  
                  <div v-for="reply in getReplies(comment.id)" :key="reply.id" class="flex gap-2 relative">
                       <!-- Curve to reply -->
                       <div class="absolute left-[-19px] top-3 w-4 h-4 border-b border-l border-border/40 rounded-bl-lg"></div>

                       <Avatar 
                        :src="reply.profiles?.avatar_url" 
                        :fallback="reply.profiles?.name?.charAt(0).toUpperCase() || 'U'"
                        class="h-6 w-6 border border-border flex-shrink-0 mt-1 z-10 bg-background" 
                      />
                      <div class="flex-1 space-y-1">
                          <!-- Reply Content/Edit -->
                          <div v-if="editingCommentId === reply.id" class="space-y-1">
                             <Input 
                                v-model="editContent" 
                                class="h-7 text-xs" 
                                @keyup.enter="handleUpdateComment"
                                :disabled="updatingComment"
                             />
                             <div class="flex gap-2">
                               <Button size="sm" variant="default" class="h-5 px-2 text-[10px]" @click="handleUpdateComment" :disabled="updatingComment">Save</Button>
                               <Button size="sm" variant="ghost" class="h-5 px-2 text-[10px]" @click="cancelEdit" :disabled="updatingComment">Cancel</Button>
                             </div>
                          </div>
                          
                          <div v-else class="bg-muted/30 rounded-lg p-2 text-xs">
                             <div class="flex items-center justify-between mb-0.5">
                                <span class="font-semibold text-xs">{{ reply.profiles?.name }}</span>
                                <span class="text-[10px] text-muted-foreground">{{ formatDistanceToNow(new Date(reply.created_at), { addSuffix: true }) }}</span>
                             </div>
                             <p class="text-foreground/90">{{ reply.content }}</p>
                          </div>

                          <!-- Reply Action Bar -->
                          <div class="flex items-center gap-3 px-1">
                              <!-- Like Reply -->
                             <button 
                                @click="handleLikeComment(reply)"
                                class="text-[10px] flex items-center gap-1 transition-colors group"
                                :class="{ 
                                  'text-red-500 hover:text-red-600': reply.user_has_liked, 
                                  'text-muted-foreground hover:text-red-500': !reply.user_has_liked && !isOwnComment(reply.user_id),
                                  'text-muted-foreground opacity-50 cursor-not-allowed': isOwnComment(reply.user_id)
                                }"
                                :disabled="isOwnComment(reply.user_id)"
                              >
                                <Heart class="h-2.5 w-2.5 transition-transform group-hover:scale-110" :class="{ 'fill-current': reply.user_has_liked }" />
                                <span v-if="reply.likes_count" class="font-medium text-[9px]">{{ reply.likes_count }}</span>
                              </button>
                             
                             <!-- Edit/Delete Reply -->
                              <template v-if="isOwnComment(reply.user_id) && editingCommentId !== reply.id">
                                <button @click="startEditComment(reply)" class="text-[10px] text-muted-foreground hover:text-primary"><Edit2 class="h-2.5 w-2.5" /></button>
                                <button @click="handleDeleteComment(reply.id)" class="text-[10px] text-muted-foreground hover:text-destructive"><Trash2 class="h-2.5 w-2.5" /></button>
                              </template>
                          </div>
                      </div>
                  </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Add Main Comment Input -->
        <div class="flex gap-2 items-center">
          <Input 
            v-model="newComment"
            placeholder="Write a comment..." 
            class="h-9 text-sm"
            @keyup.enter="handleAddComment"
            :disabled="submittingComment"
          />
          <Button 
            size="sm" 
            class="h-9 w-9 p-0"
            :disabled="!newComment.trim() || submittingComment"
            @click="handleAddComment"
          >
            <Loader2 v-if="submittingComment" class="h-4 w-4 animate-spin" />
            <Send v-else class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
