<template>
  <div class="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
    <header class="space-y-2">
      <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Seu Perfil</h1>
      <p class="text-gray-500 dark:text-gray-400">Gerencie suas informações pessoais e segurança.</p>
    </header>

    <Card class="p-8 border-none shadow-xl dark:bg-gray-900">
      <form @submit.prevent="handleUpdate" class="space-y-6">
        <div class="flex flex-col items-center gap-4 mb-8">
          <div class="relative group">
            <div class="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 overflow-hidden border-2 border-orange-200 dark:border-orange-800">
              <img v-if="form.avatar_url" :src="form.avatar_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <UserIcon v-else :size="48" />
            </div>
            <label class="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Upload :size="20" />
              <input type="file" class="hidden" accept="image/*" @change="handleAvatarUpload" />
            </label>
          </div>
          <div class="text-center w-full max-w-xs space-y-2">
            <h3 class="text-xl font-bold dark:text-white">{{ user.name }}</h3>
            <p class="text-sm text-gray-500">{{ user.email }}</p>
            <div class="flex flex-col gap-2 pt-2">
              <Input v-model="form.avatar_url" placeholder="URL da foto de perfil..." class="text-center" />
              <Button type="button" variant="secondary" size="sm" class="w-full" @click="fileInput?.click()">
                <Upload :size="16" class="mr-2" /> Carregar do Computador
              </Button>
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleAvatarUpload" />
            </div>
            <div class="mt-2 flex gap-2 justify-center">
              <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {{ user.role === 'admin' ? 'Admin Global' : 'Usuário' }}
              </span>
              <span v-if="user.org_role" class="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded text-[10px] font-bold uppercase tracking-widest text-orange-600">
                {{ user.org_role === 'owner' ? 'Dono da Org' : user.org_role === 'moderator' ? 'Moderador da Org' : 'Membro' }}
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <Input label="Nome Completo" v-model="form.name" required />
          <Input label="E-mail" type="email" v-model="form.email" required />
          
          <div class="pt-4 border-t dark:border-gray-800">
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                  <Key :size="18" class="text-orange-600" />
                </div>
                <div>
                  <p class="text-sm font-bold dark:text-white">Segurança da Conta</p>
                  <p class="text-[10px] text-gray-500 uppercase tracking-widest">Senha e Proteção</p>
                </div>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                @click="onNavigate('change-password')"
              >
                Alterar Senha
              </Button>
            </div>
          </div>
        </div>

        <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl">
          {{ error }}
        </div>
        <div v-if="success" class="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-sm rounded-xl">
          Perfil atualizado com sucesso!
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
        </Button>
      </form>
    </Card>

    <Card class="p-8 border-none shadow-xl dark:bg-gray-900">
      <h3 class="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
        <BellIcon :size="20" class="text-orange-600" />
        Preferências de Notificação
      </h3>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-bold dark:text-white">Notificações por E-mail</p>
            <p class="text-xs text-gray-500">Receba confirmações e lembretes por e-mail.</p>
          </div>
          <button 
            @click="handleToggleNotification('email')"
            :class="cn(
              'w-12 h-6 rounded-full transition-all relative',
              user.email_notifications ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'
            )"
          >
            <div :class="cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
              user.email_notifications ? 'right-1' : 'left-1'
            )" />
          </button>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-bold dark:text-white">Notificações por SMS</p>
            <p class="text-xs text-gray-500">Receba alertas urgentes diretamente no seu celular.</p>
          </div>
          <button 
            @click="handleToggleNotification('sms')"
            :class="cn(
              'w-12 h-6 rounded-full transition-all relative',
              user.sms_notifications ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'
            )"
          >
            <div :class="cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
              user.sms_notifications ? 'right-1' : 'left-1'
            )" />
          </button>
        </div>
      </div>
    </Card>

    <Card class="p-8 border-none shadow-xl dark:bg-gray-900">
      <h3 class="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
        <Share2 :size="20" class="text-orange-600" />
        Integrações
      </h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <CalendarIcon :size="20" class="text-blue-600" />
            </div>
            <div>
              <p class="text-sm font-bold dark:text-white">Google Calendar</p>
              <p class="text-[10px] text-gray-500 uppercase tracking-widest">
                {{ user.google_calendar_connected ? 'Conectado' : 'Não conectado' }}
              </p>
            </div>
          </div>
          <Button 
            :variant="user.google_calendar_connected ? 'ghost' : 'primary'" 
            size="sm"
            @click="handleToggleGoogleCalendar"
            :disabled="connectingCalendar"
          >
            {{ user.google_calendar_connected ? 'Desconectar' : 'Conectar' }}
          </Button>
        </div>
        <p class="text-[10px] text-gray-400 px-2 italic">
          Sincronize suas reuniões automaticamente com sua agenda do Google.
        </p>
      </div>
    </Card>

    <div class="pt-8 border-t dark:border-gray-800 text-center">
      <Button variant="ghost" class="text-red-500 hover:text-red-600 hover:bg-red-50" @click="handleLogout">
        Sair da Conta
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User as UserIcon, Share2, Calendar as CalendarIcon, Bell as BellIcon, Upload, Key } from 'lucide-vue-next';
import { api } from '@/src/services/api';
import { cn } from '@/src/lib/utils';
import Card from './Card.vue';
import Input from './Input.vue';
import Button from './Button.vue';
import type { User } from '@/src/types';

const props = defineProps<{
  user: User;
  onUpdateUser: (user: User) => void;
  onNavigate: (page: string) => void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const form = ref({
  name: props.user.name,
  email: props.user.email,
  password: '',
  avatar_url: props.user.avatar_url || ''
});

const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    form.value.avatar_url = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const loading = ref(false);
const connectingCalendar = ref(false);
const error = ref('');
const success = ref(false);

const handleUpdate = async () => {
  loading.value = true;
  error.value = '';
  success.value = false;
  try {
    await api.put('/profile', form.value);
    const updatedUser = { 
      ...props.user, 
      name: form.value.name, 
      email: form.value.email,
      avatar_url: form.value.avatar_url
    };
    props.onUpdateUser(updatedUser);
    success.value = true;
    form.value.password = '';
  } catch (err: any) {
    error.value = err.message || 'Erro ao atualizar perfil';
  } finally {
    loading.value = false;
  }
};

const handleToggleNotification = async (type: 'email' | 'sms') => {
  try {
    const field = type === 'email' ? 'email_notifications' : 'sms_notifications';
    const newState = !props.user[field];
    await api.put('/profile', { [field]: newState ? 1 : 0 });
    
    props.onUpdateUser({
      ...props.user,
      [field]: newState
    });
  } catch (err: any) {
    alert('Erro ao alterar preferências de notificação');
  }
};

const handleToggleGoogleCalendar = async () => {
  connectingCalendar.value = true;
  try {
    const newState = !props.user.google_calendar_connected;
    await api.put('/profile', { google_calendar_connected: newState ? 1 : 0 });
    
    props.onUpdateUser({
      ...props.user,
      google_calendar_connected: newState
    });
    
    alert(newState ? 'Google Calendar conectado com sucesso!' : 'Google Calendar desconectado.');
  } catch (err: any) {
    alert('Erro ao alterar integração com Google Calendar');
  } finally {
    connectingCalendar.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
};
</script>
