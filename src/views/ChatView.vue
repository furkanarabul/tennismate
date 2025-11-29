<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatching } from '@/composables/useMatching'
import { useChat, type Message } from '@/composables/useChat'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, User as UserIcon } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { getMatches } = useMatching()
const { getMessages, sendMessage, subscribeToMessages, unsubscribe } = useChat()

const matchId = route.params.matchId as string
const messages = ref<Message[]>([])
const newMessage = ref('')
const matchedUser = ref<any>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const sending = ref(false)

// Load matched user info and messages
onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  // Get matched user info
  const matches = await getMatches(authStore.user.id)
  matchedUser.value = matches.find(m => {
    // Find match by checking if match_id exists in data
    // We'll need to modify this based on actual data structure
    return true // For now
  })

  // Load message history
  messages.value = await getMessages(matchId)
  scrollToBottom()

  // Subscribe to new messages
  subscribeToMessages(matchId, (newMsg) => {
    messages.value.push(newMsg)
    nextTick(() => scrollToBottom())
  })
})

onUnmounted(() => {
  unsubscribe()
})

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleSend = async () => {
  if (!newMessage.value.trim() || !authStore.user || sending.value) return

  sending.value = true
  const content = newMessage.value
  newMessage.value = ''

  await sendMessage(matchId, authStore.user.id, content)
  
  // Don't manually add to messages - realtime subscription will handle it
  
  sending.value = false
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleDateString()
}

const isMyMessage = (msg: Message) => {
  return msg.sender_id === authStore.user?.id
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background pb-24 md:pb-0">
    <!-- Header -->
    <div class="border-b bg-card sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" @click="router.push('/dashboard')">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        
        <div v-if="matchedUser" class="flex items-center gap-3 flex-1">
          <div class="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20">
            <img
              v-if="matchedUser.avatar_url"
              :src="matchedUser.avatar_url"
              :alt="matchedUser.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-primary/10 flex items-center justify-center">
              <UserIcon class="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <h2 class="font-semibold">{{ matchedUser.name }}</h2>
            <p class="text-xs text-muted-foreground">{{ matchedUser.skill_level }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages - scrollable area with bottom padding for input -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full pb-32"
    >
      <div v-if="messages.length === 0" class="text-center py-12">
        <p class="text-muted-foreground">No messages yet. Say hi! 👋</p>
      </div>

      <div class="space-y-4">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'flex',
            isMyMessage(msg) ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            :class="[
              'max-w-[70%] rounded-2xl px-4 py-2',
              isMyMessage(msg)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            ]"
          >
            <p class="text-sm break-words">{{ msg.content }}</p>
            <p
              :class="[
                'text-xs mt-1',
                isMyMessage(msg) ? 'text-primary-foreground/70' : 'text-muted-foreground'
              ]"
            >
              {{ formatTime(msg.created_at) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Input - Fixed at bottom -->
    <div class="fixed bottom-16 md:bottom-0 left-0 right-0 border-t bg-card z-20">
      <div class="max-w-4xl mx-auto px-4 py-3">
        <form @submit.prevent="handleSend" class="flex gap-2">
          <Input
            v-model="newMessage"
            placeholder="Type a message..."
            class="flex-1"
            :disabled="sending"
          />
          <Button type="submit" :disabled="!newMessage.trim() || sending">
            <Send class="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>
