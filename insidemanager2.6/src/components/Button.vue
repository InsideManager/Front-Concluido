<template>
  <button 
    type="button"
    :class="cn(
      'font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2', 
      variants[variant], 
      sizes[size],
      className
    )"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/src/lib/utils';

interface Props {
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'default',
  className: ''
});

defineEmits(['click']);

const variants = {
  primary: 'bg-orange-600 text-white hover:bg-orange-700 rounded-lg',
  secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg',
  danger: 'bg-red-600 text-white hover:bg-red-700 rounded-lg',
  ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg',
};

const sizes = {
  default: 'px-4 py-2',
  sm: 'px-3 py-1.5 text-sm',
  lg: 'px-6 py-3 text-lg',
  icon: 'w-12 h-12 p-0 rounded-full text-xl',
};

const { variant, size, className } = props;
</script>
