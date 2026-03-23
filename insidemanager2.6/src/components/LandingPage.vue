<template>
  <div class="min-h-screen font-sans selection:bg-orange-200 selection:text-orange-900 transition-colors duration-500 bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
    <!-- Navbar -->
    <nav class="fixed top-0 w-full z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white dark:shadow-none">
            <CalendarIcon :size="24" />
          </div>
          <span class="text-2xl font-black tracking-tighter">InsideManager</span>
        </div>
        <div class="flex items-center gap-6">
          <Button @click="onStart">Acessar Sistema</Button>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="pt-40 pb-20 px-6">
      <div class="max-w-7xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-xs font-black uppercase tracking-widest mb-8">
          <div class="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
          Gestão de Espaços 4.0
        </div>
        <h1 class="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
          RESERVE O <span class="text-orange-600">FUTURO</span><br />DO SEU TRABALHO.
        </h1>
        <p class="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 font-medium">
          A plataforma definitiva para gerenciar salas de reunião, recursos e produtividade da sua equipe em tempo real.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button @click="onStart" class="h-14 px-10 text-lg shadow-2xl shadow-orange-200 dark:shadow-none">Começar Agora</Button>
          <Button @click="() => { console.log('Demo button clicked'); onDemo(); }" variant="secondary" class="h-14 px-10 text-lg">Ver Demonstração</Button>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="(feature, i) in features" :key="i" class="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all">
          <div class="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
            <component :is="feature.icon" :size="28" />
          </div>
          <h3 class="text-2xl font-bold mb-4">{{ feature.title }}</h3>
          <p class="text-gray-500 dark:text-gray-400 leading-relaxed">{{ feature.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Calendar as CalendarIcon, LayoutDashboard, Clock, ShieldCheck } from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import Button from './Button.vue';

defineProps<{
  onStart: () => void;
  onDemo: () => void;
}>();

const features = [
  { icon: LayoutDashboard, title: 'Gestão Visual', desc: 'Visualize a ocupação das salas em um dashboard intuitivo e moderno.' },
  { icon: Clock, title: 'Tempo Real', desc: 'Atualizações instantâneas de disponibilidade e recursos para sua equipe.' },
  { icon: ShieldCheck, title: 'Controle Total', desc: 'Painel administrativo completo para gerenciar usuários, salas e permissões.' }
];
</script>
