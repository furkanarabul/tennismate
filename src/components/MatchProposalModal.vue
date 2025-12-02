<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'submit', payload: { date: string; time: string; court: string }): void
}>()

const { t } = useI18n()

const date = ref('')
const time = ref('')
const court = ref('')

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const isValid = computed(() => {
  return date.value && time.value
})

const handleSubmit = () => {
  if (!isValid.value) return
  emit('submit', {
    date: date.value,
    time: time.value,
    court: court.value
  })
}

// Get tomorrow's date as min date
const minDate = computed(() => {
  const d = new Date()
  return d.toISOString().split('T')[0]
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t('proposal.create_title') }}</DialogTitle>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
        <!-- Date -->
        <div class="grid gap-2">
          <Label for="date" class="flex items-center gap-2">
            <CalendarIcon class="h-4 w-4" />
            {{ t('proposal.date') }}
          </Label>
          <Input
            id="date"
            type="date"
            v-model="date"
            :min="minDate"
            class="col-span-3"
          />
        </div>

        <!-- Time -->
        <div class="grid gap-2">
          <Label for="time" class="flex items-center gap-2">
            <Clock class="h-4 w-4" />
            {{ t('proposal.time') }}
          </Label>
          <Input
            id="time"
            type="time"
            v-model="time"
            class="col-span-3"
          />
        </div>

        <!-- Court (Optional) -->
        <div class="grid gap-2">
          <Label for="court" class="flex items-center gap-2">
            <MapPin class="h-4 w-4" />
            {{ t('proposal.court') }} <span class="text-muted-foreground text-xs font-normal">({{ t('common.optional') }})</span>
          </Label>
          <Input
            id="court"
            v-model="court"
            :placeholder="t('proposal.court_placeholder')"
            class="col-span-3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="handleSubmit" :disabled="!isValid || loading">
          {{ loading ? t('common.sending') : t('proposal.send') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
