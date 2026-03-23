<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 space-y-6 animate-in fade-in zoom-in duration-200">
        <div class="flex flex-col items-center text-center space-y-4">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600">
            <AlertTriangle :size="32" />
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">{{ title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{{ message }}</p>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button 
            @click="$emit('cancel')" 
            class="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Voltar
          </button>
          <button 
            @click="$emit('confirm')" 
            class="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';

defineProps<{
  show: boolean;
  title: string;
  message: string;
}>();

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>
