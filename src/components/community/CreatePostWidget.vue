<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Send, Image as ImageIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useCommunityStore } from '@/stores/community'

const { t } = useI18n()
const store = useCommunityStore()
const content = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  if (!content.value.trim()) return

  loading.value = true
  try {
    await store.createPost(content.value)
    content.value = ''
  } catch (err) {
    console.error('Failed to post', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card class="border shadow-sm mb-6">
    <CardContent class="p-4 space-y-4">
      <Textarea 
        v-model="content" 
        :placeholder="t('community.create_placeholder')"
        class="min-h-[100px] resize-none border-0 bg-secondary/30 focus-visible:ring-0 px-0 placeholder:text-muted-foreground/70"
      />
      
      
      <div class="flex items-center justify-between pt-2 border-t border-border/50">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground" disabled>
            <ImageIcon class="h-4 w-4" />
          </Button>
        </div>

        <Button 
          size="sm" 
          @click="handleSubmit" 
          :disabled="!content.trim() || loading"
          class="gap-2"
        >
          <Send class="h-3.5 w-3.5" />
          {{ t('community.post_button') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

