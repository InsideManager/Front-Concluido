<template>
  <Card class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold flex items-center gap-2">
        <CalendarIcon :size="20" class="text-orange-600" />
        Calendário de Reservas
      </h3>
      <div class="flex flex-col md:flex-row items-center gap-4">
        <div class="relative group">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            v-model="searchDate" 
            type="text" 
            placeholder="Ir para (DD/MM/AAAA)"
            class="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all w-44"
            @keyup.enter="goToDate"
          />
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="currentMonth = new Date()" 
            class="px-3 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
          >
            Hoje
          </button>
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button @click="prevMonth" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm">
              <ChevronLeft :size="18" />
            </button>
            <span class="text-[10px] font-black uppercase tracking-widest min-w-[120px] text-center">
              {{ format(currentMonth, 'MMMM yyyy', { locale: ptBR }) }}
            </span>
            <button @click="nextMonth" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm">
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <div v-for="day in weekDays" :key="day" class="bg-gray-50 dark:bg-gray-900 p-3 text-center">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ day }}</span>
      </div>
      
      <div 
        v-for="(day, idx) in calendarDays" 
        :key="idx"
        :class="cn(
          'min-h-[100px] p-2 transition-colors relative',
          isSameMonth(day, currentMonth) ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50 text-gray-400',
          isToday(day) && 'bg-orange-50/30 dark:bg-orange-900/10'
        )"
      >
        <div class="flex justify-between items-start mb-1">
          <span :class="cn(
            'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full',
            isToday(day) ? 'bg-orange-600 text-white' : 'text-gray-700 dark:text-gray-300'
          )">
            {{ format(day, 'd') }}
          </span>
        </div>

        <div class="space-y-1">
          <div 
            v-for="res in getReservationsForDay(day)" 
            :key="res.id"
            class="text-[10px] p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 truncate font-bold"
            :title="`${res.title} (${res.room_name})`"
          >
            {{ format(parseISO(res.start_time), 'HH:mm') }} - {{ res.title }}
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search } from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import Card from './Card.vue';
import type { Reservation } from '@/src/types';

const props = defineProps<{
  reservations: Reservation[];
}>();

const currentMonth = ref(new Date());
const searchDate = ref('');

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentMonth.value));
  const end = endOfWeek(endOfMonth(currentMonth.value));
  return eachDayOfInterval({ start, end });
});

const prevMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1);
};

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1);
};

const goToDate = () => {
  if (!searchDate.value) return;

  // Try DD/MM/YYYY
  const parts = searchDate.value.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      currentMonth.value = date;
      searchDate.value = '';
      return;
    }
  }

  // Try YYYY-MM-DD
  const partsISO = searchDate.value.split('-');
  if (partsISO.length === 3) {
    const year = parseInt(partsISO[0]);
    const month = parseInt(partsISO[1]) - 1;
    const day = parseInt(partsISO[2]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      currentMonth.value = date;
      searchDate.value = '';
      return;
    }
  }

  alert('Formato de data inválido. Use DD/MM/AAAA ou AAAA-MM-DD');
};

const reservationsByDay = computed(() => {
  const map = new Map<string, Reservation[]>();
  props.reservations.forEach(res => {
    if (!res.start_time) return;
    const dateKey = format(parseISO(res.start_time), 'yyyy-MM-dd');
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)?.push(res);
  });
  return map;
});

const getReservationsForDay = (day: Date) => {
  const dateKey = format(day, 'yyyy-MM-dd');
  return reservationsByDay.value.get(dateKey) || [];
};
</script>
