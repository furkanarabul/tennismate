<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatching } from '@/composables/useMatching'
import { useChat, type Message } from '@/composables/useChat'
import { useMatchProposal, type MatchProposal } from '@/composables/useMatchProposal'
import { useNotificationStore } from '@/stores/notifications'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, User as UserIcon, CalendarPlus } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import MatchProposalModal from '@/components/MatchProposalModal.vue'
import MatchProposalCard from '@/components/MatchProposalCard.vue'
import MatchProposalBanner from '@/components/MatchProposalBanner.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { getMatches } = useMatching()
const { getMessages, sendMessage, subscribeToMessages, unsubscribe, markAsRead, markMatchMessagesAsRead } = useChat()
const { createProposal, getProposals, subscribeToProposals, respondToProposal } = useMatchProposal()
const { t } = useI18n()
const notificationStore = useNotificationStore()

const matchId = route.params.matchId as string
const messages = ref<Message[]>([])
const proposals = ref<MatchProposal[]>([])
const newMessage = ref('')
const matchedUser = ref<any>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const sending = ref(false)
const showProposalModal = ref(false)
const proposalLoading = ref(false)

// Combine messages and proposals for the timeline
const timeline = computed(() => {
  return messages.value.map(m => ({ type: 'message' as const, data: m, date: new Date(m.created_at) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
})

// Active proposal for the banner
const activeProposal = computed(() => {
  // 1. Look for pending proposals first
  const pending = proposals.value.find(p => p.status === 'pending')
  if (pending) return pending
  
  // 2. Look for accepted proposals in the future
  const now = new Date()
  const accepted = proposals.value
    .filter(p => p.status === 'accepted')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()) // Newest first
    
  // Check if the latest accepted proposal is in the future (or recent past, e.g. today)
  if (accepted.length > 0) {
    const latest = accepted[0]
    if (latest) {
      const scheduledDate = new Date(latest.scheduled_at)
      // Show if it's in the future or within the last 24 hours
      if (scheduledDate.getTime() > now.getTime() - 24 * 60 * 60 * 1000) {
        return latest
      }
    }
  }
  
  return null
})

// Load matched user info and messages
onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  // Get matched user info
  const matches = await getMatches(authStore.user.id)
  matchedUser.value = matches.find(m => m.matchId === matchId)

  // Load message history
  messages.value = await getMessages(matchId)
  
  // Load proposals
  proposals.value = await getProposals(matchId)
  
  scrollToBottom()
  
  // Mark as read (all messages in this match)
  if (authStore.user) {
    await markMatchMessagesAsRead(matchId, authStore.user.id)
    notificationStore.markMatchAsRead(matchId)
  }

  // Subscribe to new messages
  subscribeToMessages(matchId, (newMsg) => {
    messages.value.push(newMsg)
    nextTick(() => scrollToBottom())
    
    // If we receive a message while in chat, mark it as read immediately if it's not ours
    if (newMsg.sender_id !== authStore.user?.id) {
      markAsRead(newMsg.id) // Use message ID here, not match ID
    }
  })

  // Subscribe to proposals
  subscribeToProposals(matchId, (payload) => {
    if (payload.eventType === 'INSERT') {
      proposals.value.push(payload.new)
      nextTick(() => scrollToBottom())
    } else if (payload.eventType === 'UPDATE') {
      const index = proposals.value.findIndex(p => p.id === payload.new.id)
      if (index !== -1) {
        proposals.value[index] = payload.new
      }
    }
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

const handleCreateProposal = async (data: { date: string; time: string; court: string }) => {
  if (!authStore.user || !matchedUser.value) return
  
  proposalLoading.value = true
  const scheduledAt = new Date(`${data.date}T${data.time}`).toISOString()
  
  const proposal = await createProposal(
    matchId,
    authStore.user.id,
    matchedUser.value.id, // This might need to be fixed if matchedUser structure is different
    scheduledAt,
    data.court
  )
  
  if (proposal) {
    // Realtime will handle adding it to the list
    showProposalModal.value = false
  }
  
  proposalLoading.value = false
}

const handleProposalAction = async (id: string, action: 'accepted' | 'declined' | 'cancelled') => {
  await respondToProposal(id, action)
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return t('chat.time.just_now')
  if (diffMins < 60) return t('chat.time.min_ago', { n: diffMins })
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return t('chat.time.hour_ago', { n: diffHours })
  
  return date.toLocaleDateString()
}

const isMyMessage = (msg: Message) => {
  return msg.sender_id === authStore.user?.id
}

const getSkillLevelLabel = (level: string) => {
  if (!level) return ''
  const key = level.toLowerCase()
  return t(`profile.skill_levels.${key}`) || level
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background pb-24 md:pb-0">
    <!-- Header -->
    <div class="bg-card sticky top-0 z-10 shadow-sm">
      <div class="border-b">
        <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button variant="ghost" size="icon" @click="router.push('/dashboard')">
              <ArrowLeft class="h-5 w-5" />
            </Button>
            
            <div v-if="matchedUser" class="flex items-center gap-3">
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
                <p class="text-xs text-muted-foreground">{{ getSkillLevelLabel(matchedUser.skill_level) }}</p>
              </div>
            </div>
          </div>

          <!-- Propose Match Button -->
          <Button variant="outline" size="sm" class="gap-2" @click="showProposalModal = true">
            <CalendarPlus class="h-4 w-4" />
            <span class="hidden sm:inline">{{ t('proposal.create_title') }}</span>
          </Button>
        </div>
      </div>

      <!-- Active Proposal Banner -->
      <MatchProposalBanner
        v-if="activeProposal"
        :proposal="activeProposal"
        :is-sender="activeProposal.sender_id === authStore.user?.id"
        :loading="proposalLoading"
        @accept="handleProposalAction($event, 'accepted')"
        @decline="handleProposalAction($event, 'declined')"
        @cancel="handleProposalAction($event, 'cancelled')"
      />
    </div>

    <!-- Messages - scrollable area with bottom padding for input -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full pb-32"
    >
      <div v-if="timeline.length === 0" class="text-center py-12">
        <p class="text-muted-foreground">{{ t('chat.no_messages') }}</p>
      </div>

      <div class="space-y-6">
        <div
          v-for="(item, index) in timeline"
          :key="item.data.id"
        >
          <!-- Message -->
          <div
            :class="[
              'flex',
              isMyMessage(item.data) ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              :class="[
                'max-w-[70%] rounded-2xl px-4 py-2',
                isMyMessage(item.data)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              ]"
            >
              <p class="text-sm break-words">{{ item.data.content }}</p>
              <p
                :class="[
                  'text-xs mt-1',
                  isMyMessage(item.data) ? 'text-primary-foreground/70' : 'text-muted-foreground'
                ]"
              >
                {{ formatTime(item.data.created_at) }}
              </p>
            </div>
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
            :placeholder="t('chat.type_message')"
            class="flex-1"
            :disabled="sending"
          />
          <Button type="submit" :disabled="!newMessage.trim() || sending">
            <Send class="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>

    <!-- Proposal Modal -->
    <MatchProposalModal
      v-model:open="showProposalModal"
      :loading="proposalLoading"
      @submit="handleCreateProposal"
    />
  </div>
</template>
