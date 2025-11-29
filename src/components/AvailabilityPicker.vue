<script setup lang="ts">
import { ref} from 'vue'

interface AvailabilitySlot {
  day: string
  timeSlots: string[]
}

interface Props {
  modelValue: AvailabilitySlot[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: AvailabilitySlot[]]
}>()

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const timeSlots = ['Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-9pm)']

const isDaySelected = (day: string) => {
  return props.modelValue.some(slot => slot.day === day)
}

const isTimeSlotSelected = (day: string, timeSlot: string) => {
  const daySlot = props.modelValue.find(slot => slot.day === day)
  return daySlot?.timeSlots.includes(timeSlot) || false
}

const toggleDay = (day: string) => {
  const exists = props.modelValue.some(slot => slot.day === day)
  
  if (exists) {
    // Remove day
    emit('update:modelValue', props.modelValue.filter(slot => slot.day !== day))
  } else {
    // Add day with default time slot
    emit('update:modelValue', [...props.modelValue, { day, timeSlots: [] }])
  }
}

const toggleTimeSlot = (day: string, timeSlot: string) => {
  const newValue = [...props.modelValue]
  const daySlotIndex = newValue.findIndex(slot => slot.day === day)
  
  if (daySlotIndex === -1) {
    // Day doesn't exist, create it
    newValue.push({ day, timeSlots: [timeSlot] })
  } else {
    // Day exists, toggle time slot
    const daySlot = newValue[daySlotIndex]
    if (!daySlot) return // Safety check
    
    const hasSlot = daySlot.timeSlots.includes(timeSlot)
    if (hasSlot) {
      daySlot.timeSlots = daySlot.timeSlots.filter(t => t !== timeSlot)
    } else {
      daySlot.timeSlots.push(timeSlot)
    }
  }
  
  emit('update:modelValue', newValue)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm font-medium mb-3">Select Days</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="day in days"
          :key="day"
          type="button"
          @click="toggleDay(day)"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            isDaySelected(day)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          {{ day.slice(0, 3) }}
        </button>
      </div>
    </div>

    <div v-if="modelValue.length > 0">
      <p class="text-sm font-medium mb-3">Time Slots</p>
      <div class="space-y-3">
        <div v-for="slot in modelValue" :key="slot.day" class="border rounded-lg p-3">
          <p class="text-sm font-medium mb-2">{{ slot.day }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="time in timeSlots"
              :key="time"
              type="button"
              @click="toggleTimeSlot(slot.day, time)"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                isTimeSlotSelected(slot.day, time)
                  ? 'bg-primary/10 text-primary border border-primary'
                  : 'bg-background border border-input hover:bg-muted'
              ]"
            >
              {{ time.split(' ')[0] }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
