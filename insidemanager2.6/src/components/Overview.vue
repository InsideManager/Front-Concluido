<template>
  <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-16">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Dashboard</h1>
        <p class="text-gray-500 dark:text-gray-400">Visão geral do seu InsideManager</p>
      </div>
     
    </header>

    <div v-if="loading" class="p-8 text-center dark:text-gray-400">Carregando dashboard...</div>
    
    <div v-else class="space-y-16">
      <ErrorDisplay :error="generalError" class="mb-10" />
      
      <Card v-if="!user.organization_id" class="p-8 border-none shadow-xl bg-blue-600 text-red">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-2xl">
              <Building2 :size="32" />
            </div>
            <div>
              <h3 class="text-black text-xl font-bold dark:text-white">Você ainda não faz parte de uma organização</h3>
              <p class="text-black text-sm dark:text-white">Para ver salas e agendar reuniões, você precisa entrar ou criar uma organização.</p>
            </div>
          </div>
          <Button variant="secondary" @click="onNavigate('organizations')">
            Configurar Organização
          </Button>
        </div>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card 
          v-for="(stat, i) in statCards" 
          :key="i"
          class="p-8 border-none shadow-lg dark:bg-gray-900"
        >
          <div class="flex items-center justify-between mb-6">
            <div :class="cn('p-4 rounded-2xl', stat.color)">
              <component :is="stat.icon" :size="28" />
            </div>
            <span class="text-4xl font-black tracking-tighter dark:text-white">{{ stat.value }}</span>
          </div>
          <p class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{{ stat.label }}</p>
        </Card>
      </div>

      <div class="py-4">
        <MonthlyCalendar :reservations="allReservations" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Next Meeting -->
        <Card class="p-8 bg-orange-600 text-white border-none relative overflow-hidden h-full">
          <div class="relative z-10">
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2 text-black dark:text-white">
              <Clock :size="20" /> Próxima Reunião
            </h3>
            <div v-if="nextMeeting" class="space-y-6">
              <div>
                <h4 class="text-3xl font-black tracking-tighter mb-1">{{ nextMeeting.title }}</h4>
                <p class="text-orange-100 flex items-center gap-2">
                  <LayoutDashboard :size="16" /> {{ nextMeeting.room_name || 'Sala não encontrada' }}
                </p>
              </div>
              <div class="flex gap-8">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-orange-200 mb-1">Data</p>
                  <p class="font-bold">{{ safeFormat(nextMeeting.start_time, "dd/MM/yyyy") }}</p>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-orange-200 mb-1">Horário</p>
                  <p class="font-bold">{{ safeFormat(nextMeeting.start_time, "HH:mm") }} - {{ safeFormat(nextMeeting.end_time, "HH:mm") }}</p>
                </div>
              </div>
              <div class="flex gap-4">
                <Button variant="secondary" class="flex-1" @click="onNavigate('meetings')">
                  Ver Detalhes
                </Button>
                <Button 
                  variant="secondary" 
                  class="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                  @click="handleCancelNextMeeting"
                >
                  Cancelar
                </Button>
              </div>
            </div>
            <div v-else class="py-8 text-center">
              <p class="text-black mb-6 dark:text-white">Você não tem reuniões agendadas.</p>
              <Button variant="secondary" @click="onNavigate('rooms')">
                Agendar Agora
              </Button>
            </div>
          </div>
          <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </Card>

        <!-- Quick Actions -->
        <Card class="p-8 border-none shadow-lg h-full dark:bg-gray-900">
          <h3 class="text-xl font-bold mb-6 dark:text-white">Ações Rápidas</h3>
          <div class="grid grid-cols-1 gap-4">
            <button 
              @click="onNavigate('rooms')"
              class="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-all group"
            >
              <div class="flex items-center gap-4">
                <div class="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <Plus :size="20" />
                </div>
                <div class="text-left">
                  <p class="font-bold dark:text-white group-hover:text-orange-600 transition-colors">Nova Reserva</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Encontre uma sala disponível</p>
                </div>
              </div>
              <ChevronRight :size="20" class="text-gray-300 group-hover:text-orange-600" />
            </button>

            <button 
              @click="onNavigate('meetings')"
              class="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-all group"
            >
              <div class="flex items-center gap-4">
                <div class="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <Clock :size="20" />
                </div>
                <div class="text-left">
                  <p class="font-bold dark:text-white group-hover:text-orange-600 transition-colors">Reuniões</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Veja seus agendamentos</p>
                </div>
              </div>
              <ChevronRight :size="20" class="text-gray-300 group-hover:text-orange-600" />
            </button>
          </div>
        </Card>
      </div>
    </div>
    
    <ConfirmModal 
      :show="showCancelConfirm"
      title="Cancelar Reunião"
      message="Deseja realmente cancelar sua próxima reunião agendada?"
      @confirm="confirmCancelNext"
      @cancel="showCancelConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  LayoutDashboard, 
  Box, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Plus,
  Building2
} from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/services/api';
import Button from './Button.vue';
import Card from './Card.vue';
import MonthlyCalendar from './MonthlyCalendar.vue';
import ErrorDisplay from './ErrorDisplay.vue';
import type { User, Reservation } from '@/src/types';

const props = defineProps<{
  user: User;
  onNavigate: (page: string) => void;
}>();

const stats = ref({ rooms: 0, resources: 0, myMeetings: 0, totalMeetings: 0 });
const nextMeeting = ref<Reservation | null>(null);
const allReservations = ref<Reservation[]>([]);
const loading = ref(true);
const generalError = ref<string | null>(null);
const showCancelConfirm = ref(false);

const statCards = computed(() => [
  { label: 'Salas Totais', value: stats.value.rooms, icon: LayoutDashboard, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' },
  { label: 'Recursos', value: stats.value.resources, icon: Box, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
  { label: 'Minhas Reuniões', value: stats.value.myMeetings, icon: Clock, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
  { label: 'Total Reservas', value: stats.value.totalMeetings, icon: CalendarIcon, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' }
]);

onMounted(() => {
  fetchStats();
  window.addEventListener('app:data_change', handleDataChange);
});

onUnmounted(() => {
  window.removeEventListener('app:data_change', handleDataChange);
});

const handleDataChange = () => {
  console.log('[Dashboard] Dados alterados no servidor, atualizando estatísticas...');
  fetchStats();
};

const handleCancelNextMeeting = () => {
  if (!nextMeeting.value) return;
  showCancelConfirm.value = true;
};

const confirmCancelNext = async () => {
  if (!nextMeeting.value) return;
  const id = nextMeeting.value.id;
  showCancelConfirm.value = false;
  
  try {
    await api.delete(`/reservations/${id}`);
    fetchStats();
    // Emitir evento global
    window.dispatchEvent(new CustomEvent('app:data_change', { detail: { type: 'reservation_deleted' } }));
  } catch (err: any) {
    console.error('Erro ao cancelar reunião:', err);
    generalError.value = err.message || 'Erro ao cancelar reunião';
  }
};

// Formatação segura de datas usando date-fns com suporte a português
const safeFormat = (dateStr: string, formatStr: string) => {
  try {
    if (!dateStr) return 'Data inválida';
    const date = parseISO(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    return format(date, formatStr, { locale: ptBR });
  } catch (e) {
    return 'Erro na data';
  }
};

const fetchStats = async () => {
  try {
    const [rooms, resources, reservations] = await Promise.all([
      api.get('/rooms'),
      api.get('/resources'),
      api.get('/reservations')
    ]);
    
    if (!Array.isArray(reservations)) {
      throw new Error('Dados de reservas inválidos recebidos do servidor');
    }

    allReservations.value = reservations;
    const myResv = reservations.filter((r: Reservation) => Number(r.user_id) === Number(props.user.id));
    const sortedMyResv = [...myResv].sort((a, b) => {
      const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return timeA - timeB;
    });
    const futureResv = sortedMyResv.find(r => r.start_time && new Date(r.start_time) > new Date());

    stats.value = {
      rooms: Array.isArray(rooms) ? rooms.length : 0,
      resources: Array.isArray(resources) ? resources.length : 0,
      myMeetings: myResv.length,
      totalMeetings: reservations.length
    };
    nextMeeting.value = futureResv || null;
    generalError.value = null;
  } catch (err: any) {
    console.error(err);
    generalError.value = err.message || 'Erro ao carregar dados';
  } finally {
    loading.value = false;
  }
};
</script>
