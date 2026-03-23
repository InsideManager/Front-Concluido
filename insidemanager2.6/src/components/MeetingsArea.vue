<template>
  <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <header>
        <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Reuniões</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie e acompanhe os agendamentos</p>
      </header>
      <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <!-- Filtro por Organização -->
        <div class="relative w-full md:w-64">
          <Building2 :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            v-model="selectedOrgId"
            class="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all w-full shadow-sm appearance-none"
          >
            <option value="all">Todas as Empresas</option>
            <option v-for="org in userOrgs" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
        </div>

        <!-- Busca -->
        <div class="relative group w-full md:w-72">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Pesquisar reuniões..."
            class="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all w-full shadow-sm"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="p-8 text-center dark:text-gray-400">Carregando reuniões...</div>

    <div v-else class="space-y-12">
      <div v-if="generalError" class="mb-6">
        <ErrorDisplay :error="generalError" />
      </div>

      <!-- Seção: Minhas Reuniões -->
      <section>
        <div class="flex items-center gap-2 mb-6">
          <UserIcon :size="20" class="text-orange-500" />
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Minhas Reuniões</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-if="myMeetings.length === 0" class="col-span-full">
            <Card class="p-8 text-center bg-gray-50/50 dark:bg-gray-900/50 border-dashed border-2 border-gray-200 dark:border-gray-800">
              <p class="text-gray-500 dark:text-gray-400">Você não possui reuniões marcadas com os filtros atuais.</p>
            </Card>
          </div>
          
          <MeetingCard 
            v-for="resv in myMeetings" 
            :key="resv.id"
            :reservation="resv"
            :is-owner="true"
            @delete="handleDeleteReservation"
          />
        </div>
      </section>

      <!-- Seção: Reuniões da Organização -->
      <section>
        <div class="flex items-center gap-2 mb-6">
          <Building2 :size="20" class="text-blue-500" />
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Reuniões da Organização</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-if="orgMeetings.length === 0" class="col-span-full">
            <Card class="p-8 text-center bg-gray-50/50 dark:bg-gray-900/50 border-dashed border-2 border-gray-200 dark:border-gray-800">
              <p class="text-gray-500 dark:text-gray-400">Nenhuma outra reunião encontrada na organização.</p>
            </Card>
          </div>
          
          <MeetingCard 
            v-for="resv in orgMeetings" 
            :key="resv.id"
            :reservation="resv"
            :is-owner="false"
            @delete="handleDeleteReservation"
            class="opacity-90"
          />
        </div>
      </section>
    </div>
    
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
import { ref, onMounted, computed, onUnmounted, h } from 'vue';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Building2, 
  User as UserIcon,
} from 'lucide-vue-next';
import { api } from '@/src/services/api';
import Card from './Card.vue';
import MeetingCard from './MeetingCard.vue';
import ConfirmModal from './ConfirmModal.vue';
import ErrorDisplay from './ErrorDisplay.vue';
import type { User, Reservation, Organization } from '@/src/types';

const props = defineProps<{
  user: User;
  onNavigate: (page: string) => void;
}>();

// Estado reativo
const reservations = ref<Reservation[]>([]);
const userOrgs = ref<Organization[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedOrgId = ref<string | number>('all');
const generalError = ref<string | null>(null);
const reservationToDelete = ref<number | null>(null);

// Formatação segura de datas
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

// Filtro base comum
const filteredReservations = computed(() => {
  if (!Array.isArray(reservations.value)) return [];
  
  let filtered = reservations.value;

  // Filtro por Organização
  if (selectedOrgId.value !== 'all') {
    filtered = filtered.filter(r => Number(r.organization_id) === Number(selectedOrgId.value));
  }
  
  // Filtro por Busca
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(r => {
      const title = (r.title || 'Reunião').toLowerCase();
      const room = (r.room_name || '').toLowerCase();
      const user = (r.user_name || '').toLowerCase();
      const org = (r.organization_name || '').toLowerCase();
      const dateStr = r.start_time ? safeFormat(r.start_time, 'dd/MM/yyyy').toLowerCase() : '';
      
      return title.includes(q) || room.includes(q) || user.includes(q) || org.includes(q) || dateStr.includes(q);
    });
  }
  
  return filtered;
});

// Minhas Reuniões
const myMeetings = computed(() => {
  return filteredReservations.value.filter(r => Number(r.user_id) === Number(props.user.id));
});

// Reuniões da Organização (outros usuários)
const orgMeetings = computed(() => {
  return filteredReservations.value.filter(r => Number(r.user_id) !== Number(props.user.id));
});

onMounted(() => {
  fetchData();
  window.addEventListener('app:data_change', handleDataChange);
});

onUnmounted(() => {
  window.removeEventListener('app:data_change', handleDataChange);
});

const handleDataChange = () => {
  fetchMeetings();
};

const fetchData = async () => {
  loading.value = true;
  await Promise.all([
    fetchMeetings(),
    fetchOrganizations()
  ]);
  loading.value = false;
};

const fetchMeetings = async () => {
  try {
    const resvData = await api.get('/reservations');
    reservations.value = resvData;
    generalError.value = null;
  } catch (err: any) {
    console.error('Erro ao buscar reuniões:', err);
    generalError.value = err.message || 'Erro ao carregar reuniões';
  }
};

const fetchOrganizations = async () => {
  try {
    const orgs = await api.get('/organizations/list');
    userOrgs.value = orgs;
  } catch (err) {
    console.error('Erro ao buscar organizações:', err);
  }
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
    fetchMeetings();
    // Emitir evento global para atualizar outros componentes
    window.dispatchEvent(new CustomEvent('app:data_change', { detail: { type: 'reservation_deleted' } }));
  } catch (err: any) {
    console.error('Erro ao cancelar reunião:', err);
    generalError.value = err.message || 'Erro ao cancelar reunião';
  }
};
</script>
