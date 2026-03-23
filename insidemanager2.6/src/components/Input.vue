<template>
  <div class="space-y-1">
    <label v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}</label>
    <div class="relative">
      <div v-if="icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <component :is="icon" :size="18" />
      </div>
      <input 
        :class="cn(
          'w-full py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all',
          icon ? 'pl-10 pr-4' : 'px-4',
          error && 'border-red-500 focus:ring-red-500'
        )"
        v-bind="$attrs"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/src/lib/utils';

defineProps<{
  label?: string;
  error?: string;
  modelValue?: string | number;
  icon?: any;
}>();

defineEmits(['update:modelValue']);
</script>
