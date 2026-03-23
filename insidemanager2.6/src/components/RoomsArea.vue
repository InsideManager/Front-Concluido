<template>
  <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
    <header>
      <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Salas Disponíveis</h1>
      <p class="text-gray-500 dark:text-gray-400">Escolha o melhor ambiente para sua produtividade</p>
    </header>

    <div v-if="loading" class="p-8 text-center dark:text-gray-400">Carregando salas...</div>

    <div v-else-if="!user.organization_id" class="py-20 text-center space-y-6">
      <div class="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 mx-auto">
        <Building2 :size="40" />
      </div>
      <div class="max-w-md mx-auto space-y-2">
        <h3 class="text-2xl font-black dark:text-white tracking-tighter">Acesso Restrito</h3>
        <p class="text-gray-500 dark:text-gray-400">Você precisa estar vinculado a uma organização para visualizar e reservar salas.</p>
      </div>
      <Button @click="onNavigate('organizations')">Configurar Organização</Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        v-for="(room, idx) in rooms" 
        :key="room.id"
        class="h-full flex flex-col hover:shadow-xl hover:shadow-orange-100 dark:hover:shadow-none transition-all border-none shadow-lg overflow-hidden"
      >
        <div class="h-48 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
          <img 
            :src="room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000'" 
            :alt="room.name" 
            class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div :class="cn(
            'absolute top-3 right-3 backdrop-blur px-3 py-1.5 rounded-full text-xs font-black shadow-sm',
            room.type === 'virtual' ? 'bg-purple-600 text-white' : 'bg-white/90 dark:bg-gray-900/90 text-orange-600'
          )">
            {{ room.type === 'virtual' ? 'VIRTUAL' : `${room.capacity} PESSOAS` }}
          </div>
          <div :class="cn(
            'absolute bottom-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-2',
            getRoomAvailability(room.id).color
          )">
            <div class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {{ getRoomAvailability(room.id).label }}
          </div>
          
          <!-- Cancel button if occupied by current user -->
          <button 
            v-if="getRoomAvailability(room.id).status === 'occupied' && Number(getRoomAvailability(room.id).currentReservation?.user_id) === Number(user.id)"
            @click.stop="handleDeleteReservation(getRoomAvailability(room.id).currentReservation.id)"
            class="absolute bottom-3 right-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Trash2 :size="10" /> Cancelar
          </button>
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <div class="flex justify-between items-start mb-1">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ room.name }}</h3>
            <button 
              @click="handleShareRoom(room)" 
              class="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-all"
              title="Compartilhar Sala"
            >
              <Check v-if="copiedId === room.id" :size="18" class="text-emerald-500" />
              <Share2 v-else :size="18" />
            </button>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
            <component :is="room.type === 'virtual' ? Globe : MapPin" :size="14" class="text-orange-500" /> {{ room.location }}
          </p>
          
          <!-- Availability Timeline -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Disponibilidade Hoje</span>
              <span class="text-[10px] font-bold text-gray-500">{{ getRoomAvailability(room.id).reservations.length }} reuniões</span>
            </div>
            <div class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
              <div 
                v-for="(reserved, hourIdx) in 12" 
                :key="hourIdx"
                :class="cn(
                  'flex-1 border-r border-white/10 last:border-none',
                  isReserved(room.id, hourIdx) ? 'bg-orange-500' : 'bg-emerald-400/30'
                )"
                :title="`${hourIdx + 8}:00`"
              />
            </div>
            <div class="flex justify-between mt-1 px-0.5">
              <span class="text-[8px] text-gray-500 dark:text-gray-400 font-bold">08h</span>
              <span class="text-[8px] text-gray-500 dark:text-gray-400 font-bold">14h</span>
              <span class="text-[8px] text-gray-500 dark:text-gray-400 font-bold">20h</span>
            </div>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-6 leading-relaxed">{{ room.description }}</p>
          
          <div v-if="room.google_meet_url" class="mb-4">
            <a 
              :href="room.google_meet_url" 
              target="_blank" 
              class="flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-800"
            >
              <Video :size="16" /> Entrar no Google Meet
            </a>
          </div>

          <div class="mt-auto">
            <Button 
              class="w-full h-11 shadow-lg shadow-orange-100 dark:shadow-none" 
              @click="openReservationModal(room)"
            >
              Agendar Agora
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Reservation Modal -->
    <Teleport to="body">
      <div v-if="showReservationModal && selectedRoom" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <Card class="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Reservar {{ selectedRoom.name }}</h2>
            <button @click="showReservationModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <ChevronLeft :size="24" />
            </button>
          </div>

          <form @submit.prevent="handleCreateReservation" class="space-y-4">
            <Input 
              label="Título da Reunião" 
              placeholder="Ex: Alinhamento Semanal" 
              v-model="resTitle"
              required
            />
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="Data (AAAA-MM-DD)" 
                type="text" 
                placeholder="2026-03-11"
                v-model="resDate"
                required
              />
              <Input 
                label="Início" 
                type="time" 
                v-model="resStart"
                required
              />
              <Input 
                label="Fim" 
                type="time" 
                v-model="resEnd"
                required
              />
            </div>

            <ErrorDisplay :error="resError" context="reservation" />

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-sm font-black text-gray-400 uppercase tracking-widest">Recursos Adicionais</label>
                <span v-if="resDate && resStart && resEnd" class="text-[10px] text-gray-400">Verificando disponibilidade para o horário...</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <label 
                  v-for="res in resources" 
                  :key="res.id" 
                  :class="cn(
                    'flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-2xl transition-all duration-200 group relative',
                    isResourceTaken(res.id)
                      ? 'border-gray-100 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-60'
                      : resResources.includes(res.id) 
                        ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' 
                        : 'border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-900/40 text-gray-500 dark:text-gray-400'
                  )"
                >
                  <input 
                    type="checkbox" 
                    class="hidden"
                    :value="res.id"
                    v-model="resResources"
                    :disabled="isResourceTaken(res.id)"
                  />
                  <div :class="cn(
                    'p-2 rounded-xl transition-colors',
                    isResourceTaken(res.id)
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      : resResources.includes(res.id) 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40'
                  )">
                    <component :is="getResourceIcon(res)" :size="18" />
                  </div>
                  <span class="text-xs font-bold uppercase tracking-tight text-center">{{ res.name }}</span>
                  
                  <!-- Badge de Indisponível -->
                  <div v-if="isResourceTaken(res.id)" class="absolute inset-0 bg-white/60 dark:bg-gray-950/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10 group/taken">
                    <div class="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg transform -rotate-12">
                      INDISPONÍVEL
                    </div>
                    
                    <!-- Tooltip de Detalhes -->
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover/taken:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                      <p class="font-bold mb-1">Em uso por:</p>
                      <p class="text-gray-300">{{ getResourceUsageInfo(res.id)?.user_name || 'Outro usuário' }}</p>
                      <p class="text-gray-400 mt-1 italic">Na sala: {{ getResourceUsageInfo(res.id)?.room_name || 'N/A' }}</p>
                      <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <Button variant="secondary" class="flex-1" type="button" @click="showReservationModal = false">
                Cancelar
              </Button>
              <Button class="flex-1" type="submit">
                Confirmar Reserva
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Teleport>
    
    <ConfirmModal 
      :show="!!reservationToDelete"
      title="Cancelar Reunião"
      message="Tem certeza que deseja cancelar esta reunião? Esta ação não pode ser desfeita."
      @confirm="confirmDelete"
      @cancel="reservationToDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import { format } from 'date-fns';
import { 
  MapPin, 
  ChevronLeft, 
  Tv, 
  Monitor, 
  Coffee, 
  Wifi, 
  AirVent, 
  PenTool, 
  Box,
  Projector,
  Share2,
  Check,
  Speaker,
  Mic,
  Wind,
  Zap,
  Video,
  Globe,
  Building2,
  Trash2
} from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/services/api';
import Button from './Button.vue';
import Card from './Card.vue';
import Input from './Input.vue';
import ConfirmModal from './ConfirmModal.vue';
import ErrorDisplay from './ErrorDisplay.vue';
import type { User, Room, Resource, Reservation } from '@/src/types';

const props = defineProps<{
  user: User;
  onNavigate: (page: string) => void;
}>();

// Estados reativos para armazenar dados do servidor
const rooms = ref<Room[]>([]);
const resources = ref<Resource[]>([]);
const reservations = ref<Reservation[]>([]);
const selectedRoom = ref<Room | null>(null);
const showReservationModal = ref(false);
const loading = ref(true);
const reservationToDelete = ref<number | null>(null);

// Estado do formulário de reserva
const resTitle = ref('');
const resDate = ref(format(new Date(), 'yyyy-MM-dd'));
const resStart = ref('09:00');
const resEnd = ref('10:00');
const resResources = ref<number[]>([]);
const resError = ref('');
const copiedId = ref<number | null>(null);

// Observa mudanças no horário para remover recursos que ficaram indisponíveis e limpar erros
watch([resDate, resStart, resEnd], () => {
  resResources.value = resResources.value.filter(id => !isResourceTaken(id));
  
  // Validação em tempo real
  if (resStart.value && resEnd.value) {
    const start = new Date(`${resDate.value}T${resStart.value}:00`);
    const end = new Date(`${resDate.value}T${resEnd.value}:00`);
    if (start >= end) {
      resError.value = 'O horário de término deve ser posterior ao início';
    } else {
      resError.value = '';
    }
  }
});

onMounted(() => {
  fetchData(); // Busca salas, recursos e reservas ao carregar
  window.addEventListener('app:data_change', handleDataChange);
});

onUnmounted(() => {
  window.removeEventListener('app:data_change', handleDataChange);
});

const handleDataChange = () => {
  console.log('[Salas] Dados alterados no servidor, atualizando disponibilidade...');
  fetchData();
};

// Busca todos os dados necessários para exibir a disponibilidade das salas
const fetchData = async () => {
  try {
    const [roomsData, resourcesData, reservationsData] = await Promise.all([
      api.get('/rooms'),
      api.get('/resources'),
      api.get('/reservations')
    ]);
    rooms.value = roomsData;
    resources.value = resourcesData;
    reservations.value = reservationsData;
  } catch (err) {
    console.error('Erro ao carregar dados das salas:', err);
  } finally {
    loading.value = false;
  }
};

// Calcula a disponibilidade de todas as salas de uma vez para otimizar
const roomsAvailability = computed(() => {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const availabilityMap = new Map();

  rooms.value.forEach(room => {
    const todayReservations = reservations.value.filter(r => 
      r.room_id === room.id && 
      r.start_time.startsWith(today)
    );

    const currentReservation = todayReservations.find(r => {
      const start = new Date(r.start_time);
      const end = new Date(r.end_time);
      return now >= start && now <= end;
    });

    if (currentReservation) {
      availabilityMap.set(room.id, { 
        status: 'occupied', 
        label: 'Ocupada agora', 
        color: 'bg-red-500', 
        reservations: todayReservations,
        currentReservation
      });
    } else {
      availabilityMap.set(room.id, { status: 'available', label: 'Disponível', color: 'bg-emerald-500', reservations: todayReservations });
    }
  });

  return availabilityMap;
});

// Calcula a linha do tempo de todas as salas
const roomsTimeline = computed(() => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const timelineMap = new Map();

  rooms.value.forEach(room => {
    const roomTimeline = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8;
      const isReserved = reservations.value.some(r => {
        if (r.room_id !== room.id || !r.start_time.startsWith(today)) return false;
        const start = new Date(r.start_time).getHours();
        const end = new Date(r.end_time).getHours();
        return hour >= start && hour < end;
      });
      return isReserved;
    });
    timelineMap.set(room.id, roomTimeline);
  });

  return timelineMap;
});

// Calcula o status de disponibilidade de uma sala específica no momento atual
const getRoomAvailability = (roomId: number) => {
  return roomsAvailability.value.get(roomId) || { status: 'available', label: 'Disponível', color: 'bg-emerald-500', reservations: [] };
};

// Verifica se a sala está reservada em uma hora específica (usado na linha do tempo)
const isReserved = (roomId: number, hourIndex: number) => {
  const timeline = roomsTimeline.value.get(roomId);
  return timeline ? timeline[hourIndex] : false;
};

// Retorna o ícone apropriado baseado no nome do recurso ou no ícone selecionado
const getResourceIcon = (resource: Resource) => {
  if (resource.icon) {
    const iconMap: Record<string, any> = {
      Tv, Monitor, Coffee, Wifi, AirVent, PenTool, Box, Projector, Speaker, Mic, Wind, Zap
    };
    return iconMap[resource.icon] || Box;
  }

  const n = resource.name.toLowerCase();
  if (n.includes('tv')) return Tv;
  if (n.includes('projetor')) return Projector;
  if (n.includes('monitor')) return Monitor;
  if (n.includes('café') || n.includes('cafe')) return Coffee;
  if (n.includes('wifi') || n.includes('internet')) return Wifi;
  if (n.includes('ar') || n.includes('ventilação')) return AirVent;
  if (n.includes('quadro') || n.includes('caneta')) return PenTool;
  return Box;
};

// Verifica se um recurso está ocupado no período selecionado
const isResourceTaken = (resourceId: number) => {
  if (!resDate.value || !resStart.value || !resEnd.value) return false;

  const currentStart = new Date(`${resDate.value}T${resStart.value}:00`);
  const currentEnd = new Date(`${resDate.value}T${resEnd.value}:00`);

  if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) return false;

  return reservations.value.some(r => {
    const rStart = new Date(r.start_time);
    const rEnd = new Date(r.end_time);

    // Verifica sobreposição de horários
    const overlaps = (currentStart < rEnd && currentEnd > rStart);
    
    if (!overlaps) return false;

    // Se houver sobreposição, verifica se o recurso está nesta reserva
    return r.resources && r.resources.some(res => res.id === resourceId);
  });
};

// Retorna a reserva que está utilizando o recurso no momento selecionado
const getResourceUsageInfo = (resourceId: number) => {
  if (!resDate.value || !resStart.value || !resEnd.value) return null;

  const currentStart = new Date(`${resDate.value}T${resStart.value}:00`);
  const currentEnd = new Date(`${resDate.value}T${resEnd.value}:00`);

  if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) return null;

  return reservations.value.find(r => {
    const rStart = new Date(r.start_time);
    const rEnd = new Date(r.end_time);
    const overlaps = (currentStart < rEnd && currentEnd > rStart);
    if (!overlaps) return false;
    return r.resources && r.resources.some(res => res.id === resourceId);
  });
};

// Abre o modal de reserva para a sala selecionada
const openReservationModal = (room: Room) => {
  // Se a sala estiver ocupada agora, não permitir abrir o modal se for para o mesmo horário
  // Mas o modal permite escolher qualquer horário, então deixamos abrir.
  selectedRoom.value = room;
  showReservationModal.value = true;
  resTitle.value = '';
  resResources.value = [];
  resError.value = '';
};

const handleDeleteReservation = (id: number) => {
  reservationToDelete.value = id;
};

const confirmDelete = async () => {
  if (!reservationToDelete.value) return;
  const id = reservationToDelete.value;
  reservationToDelete.value = null;
  
  try {
    await api.delete(`/reservations/${id}`);
    fetchData();
    // Emitir evento global para atualizar outros componentes
    window.dispatchEvent(new CustomEvent('app:data_change', { detail: { type: 'reservation_deleted' } }));
  } catch (err: any) {
    console.error('Erro ao cancelar reunião:', err);
    alert('Erro ao cancelar reunião: ' + err.message);
  }
};

// Envia a nova reserva para o servidor
const handleCreateReservation = async () => {
  if (!selectedRoom.value) return;
  resError.value = '';

  const startTime = `${resDate.value}T${resStart.value}:00`;
  const endTime = `${resDate.value}T${resEnd.value}:00`;

  // Validação básica de horário
  if (new Date(startTime) >= new Date(endTime)) {
    resError.value = 'O horário de término deve ser posterior ao início';
    return;
  }

  try {
    await api.post('/reservations', {
      room_id: selectedRoom.value.id,
      start_time: startTime,
      end_time: endTime,
      title: resTitle.value,
      resource_ids: resResources.value
    });
    alert('Reserva realizada com sucesso!');
    showReservationModal.value = false;
    props.onNavigate('dashboard'); // Redireciona para o dashboard após sucesso
  } catch (err: any) {
    resError.value = err.message || 'Erro ao criar reserva';
  }
};

// Compartilha a URL da sala copiando para o clipboard
const handleShareRoom = async (room: Room) => {
  const url = `${window.location.origin}/?room=${room.id}`;
  try {
    await navigator.clipboard.writeText(url);
    copiedId.value = room.id;
    setTimeout(() => {
      if (copiedId.value === room.id) {
        copiedId.value = null;
      }
    }, 2000);
  } catch (err) {
    console.error('Erro ao copiar para o clipboard:', err);
  }
};
</script>
