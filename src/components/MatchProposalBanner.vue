<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { MatchProposal } from '@/composables/useMatchProposal'

const props = defineProps<{
  proposal: MatchProposal
  isSender: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'accept', id: string): void
  (e: 'decline', id: string): void
  (e: 'cancel', id: string): void
}>()

const { t } = useI18n()

const formattedDate = computed(() => {
  const d = new Date(props.proposal.scheduled_at)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
})

const formattedTime = computed(() => {
  const d = new Date(props.proposal.scheduled_at)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

const statusColor = computed(() => {
  switch (props.proposal.status) {
    case 'accepted': return 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
    case 'declined': return 'bg-destructive/10 border-destructive/20 text-destructive'
    case 'cancelled': return 'bg-muted border-muted text-muted-foreground'
    default: return 'bg-primary/10 border-primary/20 text-primary'
  }
})

const statusText = computed(() => {
  if (props.proposal.status === 'pending') {
    return props.isSender ? t('proposal.banner.waiting') : t('proposal.banner.received')
  }
  return t(`proposal.status.${props.proposal.status}`)
})
</script>

<template>
  <div 
    class="w-full border-b backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4 transition-colors"
    :class="statusColor"
  >
    <div class="flex items-center gap-3 min-w-0">
      <div class="h-10 w-10 rounded-full bg-background/50 flex items-center justify-center flex-shrink-0">
        <Calendar class="h-5 w-5 opacity-80" />
      </div>
      
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wide opacity-80 mb-0.5">{{ statusText }}</p>
        <div class="flex items-center gap-2 text-sm font-medium truncate">
          <span>{{ formattedDate }}</span>
          <span class="opacity-50">•</span>
          <span>{{ formattedTime }}</span>
          <template v-if="proposal.court_name">
            <span class="opacity-50">•</span>
            <span class="truncate">{{ proposal.court_name }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <template v-if="proposal.status === 'pending'">
        <template v-if="!isSender">
          <Button 
            size="sm" 
            variant="ghost" 
            class="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
            @click="emit('decline', proposal.id)"
            :disabled="loading"
          >
            {{ t('proposal.decline') }}
          </Button>
          <Button 
            size="sm" 
            class="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
            @click="emit('accept', proposal.id)"
            :disabled="loading"
          >
            {{ t('proposal.accept') }}
          </Button>
        </template>
        <template v-else>
          <Button 
            size="sm" 
            variant="ghost" 
            class="h-8 px-2 opacity-70 hover:opacity-100"
            @click="emit('cancel', proposal.id)"
            :disabled="loading"
          >
            {{ t('proposal.cancel') }}
          </Button>
        </template>
      </template>
      
      <div v-else-if="proposal.status === 'accepted'" class="flex items-center gap-2">
        <div class="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mr-2">
          <CheckCircle2 class="h-5 w-5" />
          <span class="hidden sm:inline">{{ t('proposal.status.accepted') }}</span>
        </div>
        
        <Button 
          size="sm" 
          variant="ghost" 
          class="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          @click="emit('cancel', proposal.id)"
          :disabled="loading"
        >
          {{ t('proposal.cancel_match') }}
        </Button>
      </div>
    </div>
  </div>
</template>
