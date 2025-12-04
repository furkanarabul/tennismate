<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  loading?: boolean
  userName?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const { t } = useI18n()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <div class="mx-auto bg-red-100 p-3 rounded-full mb-4">
          <AlertTriangle class="h-6 w-6 text-red-600" />
        </div>
        <DialogTitle class="text-center text-xl">
          {{ t('dashboard.unmatch_modal.title') }}
        </DialogTitle>
        <DialogDescription class="text-center pt-2">
          {{ t('dashboard.unmatch_modal.description', { name: userName }) }}
        </DialogDescription>
      </DialogHeader>
      
      <DialogFooter class="sm:justify-center gap-2 mt-4">
        <Button
          variant="outline"
          @click="emit('update:open', false)"
          :disabled="loading"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button
          variant="destructive"
          @click="emit('confirm')"
          :disabled="loading"
        >
          {{ loading ? t('common.loading') : t('dashboard.unmatch_modal.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
