<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-vue-next'
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
    case 'accepted': return 'text-green-500 bg-green-500/10 border-green-500/20'
    case 'declined': return 'text-destructive bg-destructive/10 border-destructive/20'
    case 'cancelled': return 'text-muted-foreground bg-muted border-muted'
    default: return 'text-primary bg-primary/10 border-primary/20'
  }
})

const statusIcon = computed(() => {
  switch (props.proposal.status) {
    case 'accepted': return CheckCircle2
    case 'declined': return XCircle
    case 'cancelled': return AlertCircle
    default: return Calendar
  }
})

const statusText = computed(() => {
  return t(`proposal.status.${props.proposal.status}`)
})
</script>

<template>
  <Card class="w-full max-w-sm mx-auto overflow-hidden border-2" :class="statusColor">
    <CardHeader class="pb-2 pt-4 px-4 flex flex-row items-center gap-2 border-b border-inherit">
      <component :is="statusIcon" class="h-5 w-5" />
      <span class="font-bold uppercase tracking-wide text-xs">{{ statusText }}</span>
    </CardHeader>
    
    <CardContent class="p-4 space-y-3">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-background/50 flex items-center justify-center flex-shrink-0">
          <Calendar class="h-5 w-5 opacity-70" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground uppercase font-medium">{{ t('proposal.date') }}</p>
          <p class="font-semibold">{{ formattedDate }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-background/50 flex items-center justify-center flex-shrink-0">
          <Clock class="h-5 w-5 opacity-70" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground uppercase font-medium">{{ t('proposal.time') }}</p>
          <p class="font-semibold">{{ formattedTime }}</p>
        </div>
      </div>

      <div v-if="proposal.court_name" class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-background/50 flex items-center justify-center flex-shrink-0">
          <MapPin class="h-5 w-5 opacity-70" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground uppercase font-medium">{{ t('proposal.court') }}</p>
          <p class="font-semibold">{{ proposal.court_name }}</p>
        </div>
      </div>
    </CardContent>

    <!-- Actions for Receiver -->
    <CardFooter v-if="!isSender && proposal.status === 'pending'" class="p-2 gap-2 bg-background/50">
      <Button 
        variant="ghost" 
        class="flex-1 hover:bg-destructive/10 hover:text-destructive" 
        size="sm"
        @click="emit('decline', proposal.id)"
        :disabled="loading"
      >
        {{ t('proposal.decline') }}
      </Button>
      <Button 
        class="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
        size="sm"
        @click="emit('accept', proposal.id)"
        :disabled="loading"
      >
        {{ t('proposal.accept') }}
      </Button>
    </CardFooter>

    <!-- Actions for Sender -->
    <CardFooter v-if="isSender && proposal.status === 'pending'" class="p-2 bg-background/50">
      <Button 
        variant="ghost" 
        class="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" 
        size="sm"
        @click="emit('cancel', proposal.id)"
        :disabled="loading"
      >
        {{ t('proposal.cancel') }}
      </Button>
    </CardFooter>
  </Card>
</template>
