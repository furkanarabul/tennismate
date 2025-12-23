<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNotificationStore, type Notification } from '@/stores/notifications'
import { useI18n } from 'vue-i18n'
import { Bell, Heart, MessageCircle, Reply as ReplyIcon, Loader2, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import { formatDistanceToNow } from 'date-fns'
import { enUS, de, tr } from 'date-fns/locale'

import { useRouter } from 'vue-router'

const store = useNotificationStore()
const { t, locale } = useI18n()
const router = useRouter()
const open = ref(false)

const dateLocale = computed(() => {
  switch (locale.value) {
    case 'de': return de
    case 'tr': return tr
    default: return enUS
  }
})

const unreadCount = computed(() => store.socialUnreadCount)
const notifications = computed(() => store.notifications)

const handleOpenChange = async (val: boolean) => {
  open.value = val
  if (val) {
    await store.fetchNotifications()
  }
}

const handleMarkAllRead = async () => {
    await store.markAllAsRead()
}

const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
        await store.markAsRead(notification.id)
    }
    
    // Navigate to post
    if (notification.type === 'post_like' || notification.type === 'post_comment' || notification.type === 'comment_reply') {
         // Assuming resource_id is post_id
         let routeQuery: any = {}
         if (notification.comment_id) {
             console.log('Navigating to comment:', notification.comment_id)
             routeQuery.commentId = notification.comment_id
         } else {
             // If no comment ID (post like), highlight the post itself
             console.log('Navigating to post highlight (no comment_id)')
             routeQuery.highlight = 'true'
         }
         
         console.log('Pushing route with query:', routeQuery)
         router.push({
             name: 'community-post',
             params: { id: notification.resource_id },
             query: routeQuery
         })
         
         open.value = false // Close popover
    }
}
</script>

<template>
  <Popover v-model:open="open" @update:open="handleOpenChange">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" class="relative">
        <Bell class="h-5 w-5 text-muted-foreground" />
        <span 
            v-if="unreadCount > 0" 
            class="absolute top-1 right-1 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background border border-background"
        ></span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80 p-0" align="end">
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <h4 class="font-semibold text-sm">{{ t('notifications.title') }}</h4>
        <Button 
            v-if="unreadCount > 0" 
            variant="ghost" 
            size="sm" 
            class="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary"
            @click="handleMarkAllRead"
        >
            {{ t('notifications.mark_all_read') }}
        </Button>
      </div>
      
      <div class="max-h-[300px] overflow-y-auto">
        <div v-if="store.loading && notifications.length === 0" class="flex justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="notifications.length === 0" class="py-8 text-center text-muted-foreground text-sm">
            {{ t('notifications.empty') }}
        </div>

        <div v-else class="divide-y">
            <div 
                v-for="notification in notifications" 
                :key="notification.id"
                class="p-3 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 items-start"
                :class="{ 'bg-muted/20': !notification.is_read }"
                @click="handleNotificationClick(notification)"
            >
                <div 
                    class="mt-1 hover:opacity-80 transition-opacity"
                    @click.stop="$router.push(`/profile/${notification.sender_id}`); open = false"
                >
                    <Avatar 
                        :src="notification.sender?.avatar_url" 
                        :fallback="notification.sender?.name?.charAt(0).toUpperCase() || 'U'"
                        class="h-8 w-8 border border-border" 
                    />
                </div>
                
                <div class="flex-1 space-y-1">
                    <p class="text-sm leading-tight">
                        <span class="font-semibold">{{ notification.sender?.name || t('community.unknown_user') }}</span>
                        <span class="text-muted-foreground ml-1">
                            <template v-if="notification.type === 'post_like'">
                                {{ t('notifications.liked_your_post') }}
                            </template>
                            <template v-else-if="notification.type === 'post_comment'">
                                {{ t('notifications.commented_on_post') }}
                            </template>
                            <template v-else-if="notification.type === 'comment_reply'">
                                {{ t('notifications.replied_to_comment') }}
                            </template>
                        </span>
                    </p>
                    <p class="text-[10px] text-muted-foreground">
                        {{ formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale }) }}
                    </p>
                </div>

                <div v-if="!notification.is_read" class="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
