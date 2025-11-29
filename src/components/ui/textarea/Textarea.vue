<script setup lang="ts">
import { computed } from 'vue'

interface TextareaProps {
  id?: string
  placeholder?: string
  disabled?: boolean
  modelValue?: string
  rows?: number
  maxlength?: number
}

const props = withDefaults(defineProps<TextareaProps>(), {
  rows: 4
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

const remainingChars = computed(() => {
  if (!props.maxlength) return null
  return props.maxlength - (props.modelValue?.length || 0)
})
</script>

<template>
  <div class="relative">
    <textarea
      :id="id"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="modelValue"
      :rows="rows"
      :maxlength="maxlength"
      @input="handleInput"
      class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
    />
    <div v-if="maxlength" class="absolute bottom-2 right-2 text-xs text-muted-foreground">
      {{ remainingChars }} characters remaining
    </div>
  </div>
</template>
