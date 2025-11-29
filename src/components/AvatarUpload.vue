<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload, Image as ImageIcon, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  currentAvatarUrl?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:avatarUrl': [url: string]
}>()

const uploading = ref(false)
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const displayUrl = computed(() => previewUrl.value || props.currentAvatarUrl || null)

const openFilePicker = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // Validate file
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB')
    return
  }

  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Upload to Supabase
  await uploadAvatar(file)
}

const uploadAvatar = async (file: File) => {
  uploading.value = true

  try {
    const fileExt = file.name.split('.').pop()
    const filePath = `${props.userId}/avatar.${fileExt}`

    // Delete old avatar if exists
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(props.userId)

    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map(x => `${props.userId}/${x.name}`)
      await supabase.storage.from('avatars').remove(filesToRemove)
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    emit('update:avatarUrl', data.publicUrl)
  } catch (error) {
    console.error('Error uploading avatar:', error)
    alert('Failed to upload avatar. Please try again.')
    previewUrl.value = null
  } finally {
    uploading.value = false
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  
  if (file) {
    // Simulate file input change
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    if (fileInput.value) {
      fileInput.value.files = dataTransfer.files
      await handleFileChange({ target: fileInput.value } as any)
    }
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const removePreview = () => {
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Avatar Display -->
    <div
      class="relative group w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-muted cursor-pointer hover:border-primary transition-colors"
      @click="openFilePicker"
      @drop="handleDrop"
      @dragover="handleDragOver"
    >
      <img
        v-if="displayUrl"
        :src="displayUrl"
        alt="Avatar"
        class="w-full h-full object-cover"
      />
      <div v-else class="text-muted-foreground">
        <ImageIcon class="h-12 w-12" />
      </div>

      <!-- Upload overlay -->
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Upload class="h-8 w-8 text-white" />
      </div>

      <!-- Loading overlay -->
      <div v-if="uploading" class="absolute inset-0 bg-black/70 flex items-center justify-center">
        <div class="text-white text-sm">Uploading...</div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Upload button text -->
    <div class="text-center">
      <p class="text-sm text-muted-foreground">
        Click or drag & drop to upload
      </p>
      <p class="text-xs text-muted-foreground mt-1">
        Max 5MB (JPG, PNG, WebP)
      </p>
    </div>

    <!-- Remove preview (only if preview exists and not saved) -->
    <Button
      v-if="previewUrl && !uploading"
      variant="outline"
      size="sm"
      @click="removePreview"
    >
      <X class="h-4 w-4 mr-2" />
      Cancel
    </Button>
  </div>
</template>
