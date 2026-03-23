<template>
  <div class="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl text-orange-600">
          <Bell :size="32" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Notificações</h1>
          <p class="text-gray-500 dark:text-gray-400">Gerencie seus alertas e avisos do sistema</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button @click="markAllAsRead" variant="secondary" class="hidden md:flex gap-2">
          <CheckCheck :size="18" /> Marcar todas como lidas
        </Button>
      </div>
    </header>

    <!-- Filters Bar -->
    <div class="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div class="flex items-center gap-1">
        <button 
          @click="filter = 'all'"
          :class="cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all',
            filter === 'all' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          )"
        >
          Todas
        </button>
        <button 
          @click="filter = 'unread'"
          :class="cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all relative',
            filter === 'unread' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          )"
        >
          Não Lidas
          <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
            {{ unreadCount }}
          </span>
        </button>
      </div>
      
      <div class="flex items-center gap-2 pr-2">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {{ filteredNotifications.length }} mensagens
        </span>
      </div>
    </div>

    <div v-if="loading" class="py-20 text-center">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mb-4"></div>
      <p class="text-gray-500">Carregando notificações...</p>
    </div>

    <div v-else-if="filteredNotifications.length === 0" class="py-20 text-center border-2 border-dashed dark:border-gray-800 rounded-3xl bg-white/50 dark:bg-gray-900/50">
      <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Inbox :size="40" class="text-gray-300 dark:text-gray-600" />
      </div>
      <h3 class="text-xl font-bold dark:text-white mb-2">Caixa de entrada vazia</h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
        {{ filter === 'unread' ? 'Você não tem notificações não lidas no momento.' : 'Você ainda não recebeu nenhuma notificação.' }}
      </p>
    </div>

    <div v-else class="space-y-2">
      <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div 
          v-for="notif in filteredNotifications" 
          :key="notif.id"
          @click="markAsRead(notif.id)"
          :class="cn(
            'group p-4 md:p-6 border-b last:border-0 dark:border-gray-800 flex items-start gap-4 transition-all cursor-pointer relative',
            !notif.is_read ? 'bg-orange-50/30 dark:bg-orange-900/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          )"
        >
          <!-- Unread Indicator Dot -->
          <div v-if="!notif.is_read" class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-600 rounded-full shadow-sm shadow-orange-600/50" />
          
          <div :class="cn('p-3 rounded-2xl h-fit shrink-0', getIconBg(notif.type))">
            <component :is="getIcon(notif.type)" :size="20" />
          </div>
          
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex justify-between items-start gap-4">
              <div class="flex items-center gap-2 min-w-0">
                <h3 :class="cn('font-bold text-base truncate dark:text-white', !notif.is_read ? 'text-gray-900' : 'text-gray-500')">
                  {{ notif.title }}
                </h3>
                <span v-if="!notif.is_read" class="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-black rounded uppercase tracking-tighter">Novo</span>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                {{ formatTime(notif.created_at) }}
              </span>
            </div>
            <p :class="cn('text-sm leading-relaxed line-clamp-2', !notif.is_read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 font-medium')">
              {{ notif.message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              v-if="!notif.is_read"
              @click.stop="markAsRead(notif.id)"
              class="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all"
              title="Marcar como lida"
            >
              <Check :size="18" />
            </button>
            <button 
              @click.stop="deleteNotification(notif.id)"
              class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              title="Excluir"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>
      
      <div class="text-center pt-4">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Fim das notificações
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Bell, 
  CheckCheck, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  Inbox,
  Trash2,
  Check,
} from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/services/api';
import Button from './Button.vue';

const notifications = ref<any[]>([]);
const loading = ref(true);
const filter = ref<'all' | 'unread'>('all');

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') {
    return notifications.value.filter(n => !n.is_read);
  }
  return notifications.value;
});

const fetchNotifications = async () => {
  try {
    const data = await api.get('/notifications');
    notifications.value = data;
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
  } finally {
    loading.value = false;
  }
};

const markAllAsRead = async () => {
  try {
    await api.post('/notifications/read-all');
    notifications.value = notifications.value.map(n => ({ ...n, is_read: 1 }));
    window.dispatchEvent(new CustomEvent('notifications:updated'));
  } catch (err) {
    console.error('Erro ao marcar todas como lidas:', err);
  }
};

const markAsRead = async (id: number) => {
  const notif = notifications.value.find(n => n.id === id);
  if (!notif || notif.is_read) return;

  try {
    await api.post(`/notifications/${id}/read`);
    notifications.value = notifications.value.map(n => n.id === id ? { ...n, is_read: 1 } : n);
    window.dispatchEvent(new CustomEvent('notifications:updated'));
  } catch (err) {
    console.error('Erro ao marcar como lida:', err);
  }
};

const deleteNotification = async (id: number) => {
  try {
    await api.delete(`/notifications/${id}`);
    notifications.value = notifications.value.filter(n => n.id !== id);
    window.dispatchEvent(new CustomEvent('notifications:updated'));
  } catch (err) {
    console.error('Erro ao excluir notificação:', err);
  }
};

const formatTime = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch (e) {
    return dateStr;
  }
};

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle2;
    case 'warning': return AlertTriangle;
    case 'error': return AlertCircle;
    default: return Info;
  }
};

const getIconBg = (type: string) => {
  switch (type) {
    case 'success': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30';
    case 'warning': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30';
    case 'error': return 'bg-red-100 text-red-600 dark:bg-red-900/30';
    default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';
  }
};

onMounted(() => {
  fetchNotifications();
  window.addEventListener('notifications:updated', fetchNotifications);
});

onUnmounted(() => {
  window.removeEventListener('notifications:updated', fetchNotifications);
});
</script>

