<template>
  <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-2">
        <h1 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-4">
          Olá, {{ user.name.split(' ')[0] }}! 
          <div class="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 overflow-hidden border-2 border-orange-200 dark:border-orange-800 shadow-lg">
            <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <span v-else>{{ user.name.charAt(0).toUpperCase() }}</span>
          </div>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-lg">O que vamos planejar para hoje?</p>
      </div>
      <div class="flex items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600">
          <CalendarIcon :size="24" />
        </div>
        <div class="pr-4">
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hoje é</p>
          <p class="font-bold dark:text-white">{{ format(currentTime, "dd 'de' MMMM HH:mm:ss", { locale: ptBR }) }}</p>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card 
        v-for="(card, i) in mainCards" 
        :key="i"
        :class="cn('p-8 border-none transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden', card.bg)"
        @click="onNavigate(card.page)"
      >
        <div class="relative z-10">
          <div :class="cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg', card.iconBg)">
            <component :is="card.icon" :size="28" :class="card.iconColor" />
          </div>
          <h3 :class="cn('text-2xl font-black tracking-tighter mb-2', card.textColor)">{{ card.title }}</h3>
          <p :class="cn('text-sm font-medium opacity-80', card.textColor)">{{ card.desc }}</p>
        </div>
        <div class="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card class="p-8 border-none shadow-lg dark:bg-gray-900">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-bold dark:text-white">Destaques do Sistema</h3>
          <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Sparkles :size="20" class="text-orange-500" />
          </div>
        </div>
        <div class="space-y-6">
          <div v-for="(item, i) in highlights" :key="i" class="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div :class="cn('p-3 rounded-xl', item.color)">
              <component :is="item.icon" :size="20" />
            </div>
            <div>
              <h4 class="font-bold dark:text-white">{{ item.title }}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card class="p-8 border-none shadow-lg bg-gray-900 text-white relative overflow-hidden">
        <div class="relative z-10">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <Info :size="20" class="text-orange-500" /> Dica de Produtividade
          </h3>
          <div class="space-y-6">
            <p class="text-gray-400 leading-relaxed italic">
              "Ambientes organizados e recursos adequados aumentam em até 40% a eficiência das reuniões corporativas."
            </p>
            <div class="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h4 class="font-bold mb-2 text-orange-500">Você sabia?</h4>
              <p class="text-sm text-gray-300">
                Você pode reservar equipamentos específicos como projetores e kits de videoconferência diretamente ao escolher sua sala.
              </p>
            </div>
            <Button @click="onNavigate('rooms')" class="w-full">Explorar Salas</Button>
          </div>
        </div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[100px]" />
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  LayoutDashboard, 
  Box, 
  Clock, 
  Sparkles, 
  Info, 
  Users, 
  ShieldCheck, 
  Zap 
} from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import Button from './Button.vue';
import Card from './Card.vue';
import type { User } from '@/src/types';

defineProps<{
  user: User;
  onNavigate: (page: string) => void;
}>();

const currentTime = ref(new Date());
let timer: any = null;

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const mainCards = [
  { 
    title: 'Dashboard', 
    desc: 'Visão geral de todas as atividades e estatísticas.', 
    icon: LayoutDashboard, 
    page: 'dashboard',
    bg: 'bg-orange-600', 
    iconBg: 'bg-white/20 dark:bg-white/10', 
    iconColor: 'text-white', 
    textColor: 'text-white', 
  },
  { 
    title: 'Salas', 
    desc: 'Encontre e reserve o espaço ideal para seu time.', 
    icon: Box, 
    page: 'rooms',
    bg: 'bg-white dark:bg-gray-900', 
    iconBg: 'bg-orange-50 dark:bg-orange-900/20', 
    iconColor: 'text-orange-600', 
    textColor: 'text-gray-900 dark:text-white' 
  },
  { 
    title: 'Reuniões', 
    desc: 'Gerencie seus agendamentos e compromissos.', 
    icon: Clock, 
    page: 'meetings',
    bg: 'bg-white dark:bg-gray-900', 
    iconBg: 'bg-blue-50 dark:bg-blue-900/20', 
    iconColor: 'text-blue-600', 
    textColor: 'text-gray-900 dark:text-white' 
  }
];

const highlights = [
  { icon: Users, title: 'Colaboração', desc: 'Salas equipadas para dinâmicas de grupo.', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
  { icon: Zap, title: 'Agilidade', desc: 'Reserva instantânea em menos de 30 segundos.', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' },
  { icon: ShieldCheck, title: 'Segurança', desc: 'Ambientes monitorados e acesso controlado.', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' }
];
</script>
