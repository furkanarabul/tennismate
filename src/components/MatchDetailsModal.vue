<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, MapPin, MessageCircle, AlertCircle, CheckCircle2, XCircle, Download, ExternalLink } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { MatchProposal } from '@/composables/useMatchProposal'
import { useCalendar } from '@/composables/useCalendar'

const props = defineProps<{
  open: boolean
  proposal: MatchProposal | null
  matchName?: string
  loading?: boolean
  isSender?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'cancel', id: string): void
  (e: 'accept', id: string): void
  (e: 'decline', id: string): void
  (e: 'message'): void
}>()

const { t } = useI18n()
const { createGoogleCalendarUrl, downloadIcsFile } = useCalendar()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const formattedDate = computed(() => {
  if (!props.proposal) return ''
  const d = new Date(props.proposal.scheduled_at)
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
})

const formattedTime = computed(() => {
  if (!props.proposal) return ''
  const d = new Date(props.proposal.scheduled_at)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

const addToGoogleCalendar = () => {
  if (!props.proposal || !props.matchName) return
  
  const url = createGoogleCalendarUrl({
    title: `Tennis Match with ${props.matchName}`,
    description: t('match_details.calendar_description', { name: props.matchName }),
    location: props.proposal.court_name || '',
    start: new Date(props.proposal.scheduled_at)
  })
  
  window.open(url, '_blank')
}

const downloadIcs = () => {
  if (!props.proposal || !props.matchName) return
  
  downloadIcsFile({
    title: `Tennis Match with ${props.matchName}`,
    description: t('match_details.calendar_description', { name: props.matchName }),
    location: props.proposal.court_name || '',
    start: new Date(props.proposal.scheduled_at)
  })
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t('match_details.title') }}</DialogTitle>
      </DialogHeader>
      
      <div v-if="proposal" class="grid gap-6 py-4">
        <!-- Match Info -->
        <div class="flex flex-col items-center justify-center text-center space-y-2">
          <div 
            class="h-16 w-16 rounded-full flex items-center justify-center mb-2"
            :class="proposal.status === 'pending' ? 'bg-amber-500/10' : 'bg-primary/10'"
          >
            <Clock v-if="proposal.status === 'pending'" class="h-8 w-8 text-amber-500" />
            <CalendarIcon v-else class="h-8 w-8 text-primary" />
          </div>
          
          <template v-if="proposal.status === 'pending'">
            <template v-if="isSender">
              <h3 class="font-semibold text-lg">{{ t('match_details.pending_title') }}</h3>
              <p class="text-muted-foreground">{{ t('match_details.pending_subtitle', { name: matchName }) }}</p>
            </template>
            <template v-else>
              <h3 class="font-semibold text-lg">{{ t('match_details.received_title') }}</h3>
              <p class="text-muted-foreground">{{ t('match_details.received_subtitle', { name: matchName }) }}</p>
            </template>
          </template>
          <template v-else>
            <h3 class="font-semibold text-lg">{{ t('match_details.scheduled_with', { name: matchName }) }}</h3>
            <p class="text-muted-foreground">{{ t('match_details.subtitle') }}</p>
          </template>
        </div>

        <div class="space-y-4 border rounded-lg p-4 bg-muted/20">
          <!-- Date -->
          <div class="flex items-center gap-3">
            <CalendarIcon class="h-5 w-5 text-muted-foreground" />
            <div>
              <p class="text-sm font-medium">{{ t('proposal.date') }}</p>
              <p class="text-sm text-muted-foreground">{{ formattedDate }}</p>
            </div>
          </div>

          <!-- Time -->
          <div class="flex items-center gap-3">
            <Clock class="h-5 w-5 text-muted-foreground" />
            <div>
              <p class="text-sm font-medium">{{ t('proposal.time') }}</p>
              <p class="text-sm text-muted-foreground">{{ formattedTime }}</p>
            </div>
          </div>

          <!-- Court -->
          <div class="flex items-center gap-3">
            <MapPin class="h-5 w-5 text-muted-foreground" />
            <div>
              <p class="text-sm font-medium">{{ t('proposal.court') }}</p>
              <p class="text-sm text-muted-foreground">{{ proposal.court_name || t('common.not_set') }}</p>
            </div>
          </div>
        </div>

        <!-- Add to Calendar Actions (Only for Accepted Matches) -->
        <div v-if="proposal.status === 'accepted'" class="flex gap-2">
          <Button variant="outline" class="flex-1 gap-2 text-xs" @click="addToGoogleCalendar">
            <ExternalLink class="h-3.5 w-3.5" />
            Google Calendar
          </Button>
          <Button variant="outline" class="flex-1 gap-2 text-xs" @click="downloadIcs">
            <Download class="h-3.5 w-3.5" />
            iCal (.ics)
          </Button>
        </div>
      </div>

      <DialogFooter class="flex-col sm:flex-row gap-2">
        <!-- Receiver Actions for Pending Proposal -->
        <template v-if="proposal?.status === 'pending' && !isSender">
          <Button 
            variant="outline" 
            class="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            @click="emit('decline', proposal?.id || '')"
            :disabled="loading"
          >
            {{ t('proposal.decline') }}
          </Button>
          <Button 
            class="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            @click="emit('accept', proposal?.id || '')"
            :disabled="loading"
          >
            {{ t('proposal.accept') }}
          </Button>
        </template>
        
        <!-- Sender or Accepted Actions -->
        <template v-else>
          <Button 
            variant="outline" 
            class="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            @click="emit('cancel', proposal?.id || '')"
            :disabled="loading"
          >
            {{ t('proposal.cancel_match') }}
          </Button>
          <Button 
            class="w-full sm:w-auto gap-2"
            @click="emit('message')"
          >
            <MessageCircle class="h-4 w-4" />
            {{ t('dashboard.card.message') }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
