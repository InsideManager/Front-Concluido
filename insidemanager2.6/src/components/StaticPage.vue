<template>
  <div class="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
    <header class="space-y-4">
      <Button variant="ghost" @click="$emit('back')" class="gap-2 -ml-4">
        <ArrowLeft :size="16" /> Voltar
      </Button>
      <h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{{ title }}</h1>
      <p class="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">{{ description }}</p>
    </header>

    <Card class="p-8 md:p-12 space-y-8 dark:bg-gray-900 border-none shadow-xl">
      <div class="prose dark:prose-invert max-w-none space-y-6">
        <section v-for="(section, i) in content" :key="i" class="space-y-3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ section.title }}</h2>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ section.text }}</p>
        </section>
      </div>

      <div class="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-gray-400 italic">Última atualização: 11 de Março de 2026</p>
        <Button @click="$emit('back')">Entendi</Button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import Button from './Button.vue';
import Card from './Card.vue';

defineProps<{
  title: string;
  description: string;
  content: Array<{ title: string, text: string }>;
}>();

defineEmits(['back']);
</script>
