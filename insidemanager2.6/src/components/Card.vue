<template>
  <div :class="cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl', className)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/src/lib/utils';

defineProps<{
  className?: string;
}>();
</script>
