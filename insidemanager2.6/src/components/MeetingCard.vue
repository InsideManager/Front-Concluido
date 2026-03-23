<template>
  <Card class="p-5 border-l-4 border-l-orange-600 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-900">
    <div class="flex justify-between items-start mb-4">
      <div class="space-y-1">
        <h4 class="font-black text-lg text-gray-900 dark:text-white tracking-tight">{{ reservation.title || 'Reunião' }}</h4>
        <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          <Building2 :size="10" />
          {{ (reservation as any).organization_name }}
        </div>
      </div>
      <Button 
        v-if="isOwner"
        variant="secondary" 
        size="sm"
        @click="$emit('delete', reservation.id)"
        class="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
      >
        <Trash2 :size="14" />
        <span>Cancelar Reunião</span>
      </Button>
    </div>
    <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
      <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
        <LayoutDashboard :size="16" class="text-orange-500" />
        <span class="font-bold dark:text-white">{{ reservation.room_name || 'Sala não encontrada' }}</span>
      </div>
      <div class="flex items-center gap-3 px-1">
        <CalendarIcon :size="16" class="text-gray-500 dark:text-gray-400" /> 
        <span>{{ safeFormat(reservation.start_time, "dd 'de' MMMM") }}</span>
      </div>
      <div class="flex items-center gap-3 px-1">
        <Clock :size="16" class="text-gray-500 dark:text-gray-400" /> 
        <span class="font-medium">
          {{ safeFormat(reservation.start_time, 'HH:mm') }} às {{ safeFormat(reservation.end_time, 'HH:mm') }}
        </span>
      </div>
      
      <div v-if="reservation.resources && reservation.resources.length > 0" class="pt-2 border-t border-gray-100 dark:border-gray-800">
        <p class="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Recursos Reservados</p>
        <div class="flex flex-wrap gap-1.5">
          <span 
            v-for="res in reservation.resources" 
            :key="res.id" 
            class="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-md text-[10px] font-black uppercase tracking-wider border border-orange-100 dark:border-orange-800"
          >
            {{ res.name }}
          </span>
        </div>
      </div>

      <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
          <img v-if="(reservation as any).user_avatar_url" :src="(reservation as any).user_avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
            {{ (reservation as any).user_name?.charAt(0) || '?' }}
          </div>
        </div>
        <span class="text-[10px] text-gray-500 italic">Agendado por {{ (reservation as any).user_name }}</span>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, LayoutDashboard, Trash2, Building2 } from 'lucide-vue-next';
import Card from './Card.vue';
import Button from './Button.vue';
import type { Reservation } from '@/src/types';

defineProps<{
  reservation: Reservation;
  isOwner: boolean;
}>();

defineEmits<{
  (e: 'delete', id: number): void;
}>();

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
</script>
