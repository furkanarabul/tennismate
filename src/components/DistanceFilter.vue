<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import gsap from 'gsap'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  modelValue: number | null // Distance in km, null = no limit
  playerCounts?: Record<number | string, number> // Legacy prop, can be removed later
  allDistances?: number[] // All player distances for real-time counting
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

// Internal value for the slider (0-100)
const sliderValue = ref(props.modelValue === null ? 100 : props.modelValue)
const thumbRef = ref<HTMLElement | null>(null)
const valueRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// Update slider when prop changes
watch(() => props.modelValue, (newVal) => {
  sliderValue.value = newVal === null ? 100 : newVal
})

// Animate thumb and track on interaction
const onDragStart = () => {
  isDragging.value = true
  if (thumbRef.value) {
    gsap.to(thumbRef.value, { scale: 1.2, duration: 0.3, ease: 'back.out(1.7)' })
  }
  if (trackRef.value) {
    gsap.to(trackRef.value, { height: 12, duration: 0.3, ease: 'power2.out' })
  }
}

const onDragEnd = () => {
  isDragging.value = false
  if (thumbRef.value) {
    gsap.to(thumbRef.value, { scale: 1, duration: 0.2, ease: 'power2.out' })
  }
  if (trackRef.value) {
    gsap.to(trackRef.value, { height: 8, duration: 0.3, ease: 'power2.out' })
  }
}

// Handle slider visual update (instant)
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value)
  
  // Haptic feedback on max
  if (val >= 100 && sliderValue.value < 100) {
    if (navigator.vibrate) navigator.vibrate(10)
    // Flash effect on value
    if (valueRef.value) {
      gsap.fromTo(valueRef.value, 
        { scale: 1.5, color: '#22c55e' }, 
        { scale: 1, color: 'currentColor', duration: 0.5, ease: 'elastic.out(1, 0.3)' }
      )
    }
  }
  
  sliderValue.value = val
}

// Handle actual data update (when user releases)
const handleChange = () => {
  const val = sliderValue.value
  if (val >= 100) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', val)
  }
}

// Display text for the current value
const displayValue = computed(() => {
  if (sliderValue.value >= 100) return t('filters.distance.anywhere')
  return `${sliderValue.value} ${t('discover.distance_unit') || 'km'}`
})

const isMax = computed(() => sliderValue.value >= 100)
const currentPlayerCount = computed(() => {
  // If we have all distances, calculate real-time count
  if (props.allDistances) {
    if (sliderValue.value >= 100) return props.allDistances.length
    return props.allDistances.filter(d => d <= sliderValue.value).length
  }

  // Fallback to bucket counts (legacy)
  if (!props.playerCounts) return 0
  if (sliderValue.value >= 100) return props.playerCounts['any'] || 0
  
  const buckets = [2, 5, 10, 25, 50]
  if (buckets.includes(sliderValue.value)) {
    return props.playerCounts[sliderValue.value] || 0
  }
  return null
})

// Calculate progress percentage
const progress = computed(() => {
  const min = 2
  const max = 100
  const val = sliderValue.value
  return ((val - min) / (max - min)) * 100
})
</script>

<template>
  <div class="py-2">
    <!-- Main Value Display -->
    <div class="flex flex-col items-center justify-center mb-6">
      <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {{ t('filters.distance.label') }}
      </div>
      <div 
        ref="valueRef"
        class="text-4xl font-black tracking-tight transition-colors duration-300"
        :class="isMax ? 'text-primary' : 'text-foreground'"
      >
        {{ displayValue }}
      </div>
      
      <!-- Player Count Badge -->
      <div class="h-6 mt-2">
        <div 
          v-if="currentPlayerCount !== null" 
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground animate-in fade-in slide-in-from-bottom-2"
        >
          {{ currentPlayerCount === 0 ? t('filters.distance.no_players_found') : t('filters.distance.players_found', { n: currentPlayerCount }) }}
        </div>
      </div>
    </div>
    
    <!-- Slider Track -->
    <div class="relative h-10 flex items-center group touch-none">
      <!-- Track Background -->
      <div 
        ref="trackRef"
        class="absolute w-full h-2 bg-secondary rounded-full overflow-hidden transition-all duration-300"
      >
        <!-- Fill -->
        <div 
          class="h-full bg-primary transition-all duration-75 ease-out"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      
      <!-- Slider Input (Invisible but interactive) -->
      <input
        type="range"
        min="2"
        max="100"
        step="1"
        :value="sliderValue"
        @input="handleInput"
        @change="handleChange"
        @mousedown="onDragStart"
        @mouseup="onDragEnd"
        @touchstart="onDragStart"
        @touchend="onDragEnd"
        class="absolute w-full h-full opacity-0 cursor-pointer z-20"
      />
      
      <!-- Thumb (Visual only) -->
      <div 
        ref="thumbRef"
        class="absolute h-6 w-6 bg-background border-[3px] border-primary rounded-full shadow-xl pointer-events-none flex items-center justify-center z-10 transition-shadow duration-200"
        :class="{ 'shadow-primary/20 ring-4 ring-primary/10': isDragging }"
        :style="{ left: `calc(${progress}% - 12px)` }"
      >
        <div class="h-1.5 w-1.5 bg-primary rounded-full"></div>
      </div>
    </div>
    
    <!-- Minimal Labels -->
    <div class="flex justify-between text-[10px] font-medium text-muted-foreground/50 px-1 select-none uppercase tracking-widest">
      <span>{{ t('filters.distance.close') }}</span>
      <span>{{ t('filters.distance.far') }}</span>
    </div>
  </div>
</template>
