<template>
  <div v-if="error" class="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-3">
    <div class="flex items-start gap-3">
      <div class="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400">
        <AlertCircle :size="20" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-bold text-red-800 dark:text-red-200">{{ friendlyMessage }}</p>
        <button 
          @click="showDetails = !showDetails" 
          class="text-xs font-bold text-red-600 dark:text-red-400 hover:underline mt-1 flex items-center gap-1"
        >
          {{ showDetails ? 'Ocultar detalhes' : 'Ver detalhes técnicos' }}
          <ChevronDown :size="14" :class="cn('transition-transform', showDetails && 'rotate-180')" />
        </button>
      </div>
    </div>
    
    <div v-if="showDetails" class="p-3 bg-black/5 dark:bg-black/40 rounded-xl">
      <p class="text-[10px] font-mono text-red-700 dark:text-red-300 break-all leading-relaxed">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { AlertCircle, ChevronDown } from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';

const props = defineProps<{
  error: string | null;
  context?: 'login' | 'registration' | 'reservation' | 'admin' | 'generic';
}>();

const showDetails = ref(false);

const friendlyMessage = computed(() => {
  switch (props.context) {
    case 'login':
      return 'Não foi possível realizar o acesso. Verifique suas credenciais.';
    case 'registration':
      return 'Houve um problema ao processar seu cadastro. Tente novamente.';
    case 'reservation':
      return 'Não conseguimos concluir sua reserva neste momento.';
    case 'admin':
      return 'Ocorreu um erro ao processar esta ação administrativa.';
    default:
      return 'Algo não saiu como esperado. Por favor, tente novamente em instantes.';
  }
});
</script>
