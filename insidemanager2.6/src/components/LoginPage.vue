<template>
  <div class="min-h-screen flex items-center justify-center p-6 transition-colors duration-500 bg-gray-50 dark:bg-gray-950">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <button @click="onBack" class="inline-flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors mb-8">
          <ChevronLeft :size="16" /> VOLTAR PARA O INÍCIO
        </button>
        <div class="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-orange-200 dark:shadow-none mx-auto mb-6">
          <CalendarIcon :size="32" />
        </div>
        <h1 class="text-4xl font-black tracking-tighter dark:text-white">Bem-vindo de volta</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Acesse sua conta para gerenciar reservas</p>
      </div>

      <Card class="p-8 shadow-2xl dark:bg-gray-900 border-none">
        <div class="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8">
          <button 
            @click="view = 'login'"
            :class="cn('flex-1 py-2 text-sm font-bold rounded-lg transition-all', view === 'login' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-500')"
          >
            Login
          </button>
          <button 
            @click="view = 'register'"
            :class="cn('flex-1 py-2 text-sm font-bold rounded-lg transition-all', view === 'register' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-500')"
          >
            Cadastro
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="view === 'register'" class="space-y-6">
            <Input label="Nome Completo" v-model="name" placeholder="Seu nome" required />
          </div>
          
          <template v-if="view !== 'forgot-password' && view !== 'reset-password'">
            <Input label="E-mail Corporativo" type="email" v-model="email" placeholder="seu@email.com" required />
            <Input label="Senha" type="password" v-model="password" placeholder="••••••••" required />
            
            <div v-if="view === 'login'" class="flex justify-end">
              <button 
                type="button" 
                @click="view = 'forgot-password'"
                class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          </template>

          <template v-else-if="view === 'forgot-password'">
            <div class="space-y-4">
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                Insira seu e-mail para receber as instruções de recuperação.
              </p>
              <Input label="E-mail de Recuperação" type="email" v-model="email" placeholder="seu@email.com" required />
              <button 
                type="button" 
                @click="view = 'login'"
                class="w-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                Voltar para o Login
              </button>
            </div>
          </template>

          <template v-else-if="view === 'reset-password'">
            <div class="space-y-4">
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                Defina sua nova senha para o e-mail <strong>{{ resetPasswordData?.email }}</strong>.
              </p>
              <Input label="Nova Senha" type="password" v-model="password" placeholder="••••••••" required />
              <Input label="Confirmar Nova Senha" type="password" v-model="confirmPassword" placeholder="••••••••" required />
              <button 
                type="button" 
                @click="view = 'login'"
                class="w-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </template>
          
          <ErrorDisplay :error="error" context="login" />
          
          <Button type="submit" class="w-full h-12 text-lg" :disabled="loading">
            {{ loading ? 'Processando...' : (view === 'login' ? 'Entrar no Sistema' : view === 'register' ? 'Criar minha Conta' : view === 'forgot-password' ? 'Enviar E-mail' : 'Redefinir Senha') }}
          </Button>
        </form>
      </Card>
      
      <p class="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
        Ambiente Seguro • InsideManager v2.0
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/services/api';
import Button from './Button.vue';
import Input from './Input.vue';
import Card from './Card.vue';
import ErrorDisplay from './ErrorDisplay.vue';
import type { User } from '@/src/types';

const props = defineProps<{
  onLogin: (user: User, token: string) => void;
  onBack: () => void;
  resetPasswordData?: { token: string, email: string } | null;
}>();

const view = ref<'login' | 'register' | 'forgot-password' | 'reset-password'>(props.resetPasswordData ? 'reset-password' : 'login');
const name = ref('');
const email = ref(props.resetPasswordData?.email || '');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    if (view.value === 'forgot-password') {
      const data = await api.post('/auth/forgot-password', { email: email.value });
      alert(data.message);
      view.value = 'login';
      return;
    }

    if (view.value === 'reset-password') {
      if (password.value !== confirmPassword.value) {
        throw new Error('As senhas não coincidem');
      }
      const data = await api.post('/auth/reset-password', { 
        email: props.resetPasswordData?.email, 
        token: props.resetPasswordData?.token, 
        newPassword: password.value 
      });
      alert(data.message);
      window.history.replaceState({}, document.title, window.location.pathname); // Limpa a URL
      view.value = 'login';
      password.value = '';
      confirmPassword.value = '';
      return;
    }

    const isLogin = view.value === 'login';
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email: email.value, password: password.value }
      : { name: name.value, email: email.value, password: password.value };
    
    const data = await api.post(endpoint, payload);
    
    if (isLogin) {
      props.onLogin(data.user, data.token);
    } else {
      // Se for cadastro, mostra sucesso e muda para login
      alert('Cadastro realizado com sucesso! Agora você pode fazer o login.');
      view.value = 'login';
      password.value = '';
    }
  } catch (err: any) {
    if (view.value === 'login') {
      error.value = 'E-mail ou senha inválidos';
    } else {
      error.value = err.message || 'Erro no processamento';
    }
  } finally {
    loading.value = false;
  }
};
</script>
