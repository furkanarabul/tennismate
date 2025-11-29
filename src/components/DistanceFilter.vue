<script setup lang="ts">
import { Label } from '@/components/ui/label'

interface Props {
  modelValue: number | null // Distance in km, null = no limit
  playerCounts?: Record<number | string, number> // Count per distance
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const distanceOptions = [
  { value: 2, label: '2 km', description: 'Very close' },
  { value: 5, label: '5 km', description: 'Walking distance' },
  { value: 10, label: '10 km', description: 'Nearby' },
  { value: 25, label: '25 km', description: 'Same area' },
  { value: 50, label: '50 km', description: 'Extended' },
  { value: null, label: 'Any', description: 'No limit' }
]

const selectDistance = (value: number | null) => {
  emit('update:modelValue', value)
}

const getPlayerCount = (value: number | null): number => {
  if (!props.playerCounts) return 0
  const key = value === null ? 'any' : value
  return props.playerCounts[key] || 0
}
</script>

<template>
  <div class="space-y-3">
    <Label class="text-sm font-medium">Distance Range</Label>
    
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in distanceOptions"
        :key="option.value ?? 'any'"
        @click="selectDistance(option.value)"
        :class="[
          'px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
          modelValue === option.value
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        ]"
        type="button"
      >
        <span>{{ option.label }}</span>
        <!-- Player Count Badge -->
        <span 
          v-if="playerCounts"
          :class="[
            'ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold',
            modelValue === option.value
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary/20 text-primary'
          ]"
        >
          {{ getPlayerCount(option.value) }}
        </span>
      </button>
    </div>
    
    <p class="text-xs text-muted-foreground">
      Numbers show available players in each range
    </p>
  </div>
</template>
