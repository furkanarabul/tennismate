<script setup lang="ts">
import { Label } from '@/components/ui/label'

interface Props {
  modelValue: number | null // Distance in km, null = no limit
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const distanceOptions = [
  { value: 5, label: '5 km', description: 'Very close' },
  { value: 10, label: '10 km', description: 'Nearby' },
  { value: 25, label: '25 km', description: 'Same area' },
  { value: 50, label: '50 km', description: 'Extended range' },
  { value: null, label: 'Any', description: 'No limit' }
]

const selectDistance = (value: number | null) => {
  emit('update:modelValue', value)
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
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          modelValue === option.value
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        ]"
        type="button"
      >
        {{ option.label }}
      </button>
    </div>
    
    <p class="text-xs text-muted-foreground">
      Show players within selected distance
    </p>
  </div>
</template>
