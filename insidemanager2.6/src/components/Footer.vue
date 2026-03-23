<template>
  <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div class="col-span-1 md:col-span-1 space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white">
              <CalendarIcon :size="18" />
            </div>
            <span class="text-xl font-black tracking-tighter dark:text-white">InsideManager</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Otimizando o uso de espaços corporativos com tecnologia e design inteligente.
          </p>
          <div class="flex items-center gap-4 pt-2">
            <a href="#" class="text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"><X :size="20" /></a>
            <a href="#" class="text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"><Linkedin :size="20" /></a>
            <a href="#" class="text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"><Github :size="20" /></a>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Plataforma</h4>
          <ul class="space-y-4">
            <li><a href="#" @click.prevent="$emit('navigate', 'home')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Início</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'dashboard')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Dashboard</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'rooms')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Salas</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'meetings')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Reuniões</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Suporte</h4>
          <ul class="space-y-4">
            <li><a href="#" @click.prevent="$emit('navigate', 'help')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Central de Ajuda</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'docs')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Documentação</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'status')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Status do Sistema</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'contact')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Contato</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Legal</h4>
          <ul class="space-y-4">
            <li><a href="#" @click.prevent="$emit('navigate', 'privacy')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Privacidade</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'terms')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Termos de Uso</a></li>
            <li><a href="#" @click.prevent="$emit('navigate', 'cookies')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors">Cookies</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-gray-100 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          © 2026 InsideManager. Todos os direitos reservados.
        </p>
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          Feito com <Heart :size="12" class="text-red-500 fill-red-500" /> para equipes produtivas.
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Calendar as CalendarIcon, X, Linkedin, Github, Heart } from 'lucide-vue-next';

defineEmits(['navigate']);
</script>
