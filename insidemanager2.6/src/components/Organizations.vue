<template>
  <div class="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-2">
        <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Organizações</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie sua afiliação corporativa e separe seus espaços.</p>
      </div>
      <!-- Discrete option to join/create new even if in one -->
      <div v-if="currentOrg && !showJoinCreate" class="flex justify-end">
        <button 
          @click="showJoinCreate = true"
          class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 flex items-center gap-1 transition-colors uppercase tracking-widest"
        >
          <Plus :size="14" /> Entrar ou Criar Outra
        </button>
      </div>
      <div v-if="showJoinCreate" class="flex justify-end">
        <button 
          @click="showJoinCreate = false"
          class="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft :size="14" /> Voltar para Minha Org
        </button>
      </div>
    </header>

    <div v-if="loading" class="py-12 text-center text-gray-500">
      Carregando informações da organização...
    </div>

    <div v-else class="space-y-8">
      <!-- Join/Create Forms (Visible if no org OR if showJoinCreate is true) -->
      <div v-if="!currentOrg || showJoinCreate" class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- Join Organization -->
        <Card class="p-8 border-none shadow-lg dark:bg-gray-900">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Users :size="24" />
            </div>
            <h3 class="text-xl font-bold dark:text-white">Entrar em uma Organização</h3>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Insira o código de acesso fornecido pelo seu administrador para se juntar a um time existente.</p>
          
          <form @submit.prevent="handleJoin" class="space-y-4">
            <Input 
              label="Código de Acesso" 
              v-model="joinCode" 
              placeholder="Ex: AB12CD" 
              maxlength="6"
              class="uppercase font-mono"
            />
            <Button type="submit" class="w-full" :disabled="joining">
              {{ joining ? 'Entrando...' : 'Entrar Agora' }}
            </Button>
          </form>
        </Card>

        <!-- Create Organization -->
        <Card class="p-8 border-none shadow-lg dark:bg-gray-900">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
              <Plus :size="24" />
            </div>
            <h3 class="text-xl font-bold dark:text-white">Criar Nova Organização</h3>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Comece do zero, defina seus espaços e convide seus colaboradores.</p>
          
          <form @submit.prevent="handleCreate" class="space-y-4">
            <Input label="Nome da Organização" v-model="createForm.name" placeholder="Ex: Minha Empresa LTDA" required />
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
              <textarea 
                v-model="createForm.description"
                class="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all min-h-[100px]"
                placeholder="Sobre o que é esta organização?"
              ></textarea>
            </div>
            <Button type="submit" class="w-full" :disabled="creating">
              {{ creating ? 'Criando...' : 'Criar Organização' }}
            </Button>
          </form>
        </Card>
      </div>

      <!-- Current Organization Details (Visible if in an org and NOT showing join/create) -->
      <div v-if="currentOrg && !showJoinCreate" class="space-y-8 animate-in fade-in duration-500">
        <!-- Live Preview Card -->
        <Card 
          class="p-8 border-none shadow-xl relative overflow-hidden text-white min-h-[240px] flex flex-col justify-center transition-all duration-500"
          :style="{ 
            backgroundColor: editOrgForm.primary_color || '#ea580c',
            backgroundImage: editOrgForm.banner_url ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${editOrgForm.banner_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }"
        >
          <div class="relative z-10 space-y-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <img v-if="editOrgForm.logo_url" :src="editOrgForm.logo_url" class="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                  <Building2 v-else :size="32" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-black uppercase tracking-widest text-white/70">Sua Organização</p>
                    <span v-if="user.role === 'admin'" class="px-2 py-0.5 bg-white/30 rounded text-[10px] font-black uppercase tracking-widest">Acesso Administrativo</span>
                  </div>
                  <h2 class="text-3xl font-black tracking-tighter">{{ editOrgForm.name || currentOrg.name }}</h2>
                </div>
              </div>
              <div :class="cn(
                'px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest',
                user.org_role === 'owner' ? 'bg-red-500/30' : 'bg-white/20'
              )">
                {{ user.org_role === 'owner' ? 'Dono' : user.org_role === 'moderator' ? 'Moderador' : 'Membro' }}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-4 bg-white/10 rounded-xl border border-white/10">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Código de Acesso</p>
                <div class="flex items-center justify-between">
                  <span class="text-2xl font-mono font-bold">{{ currentOrg.code }}</span>
                  <button @click="copyCode(currentOrg.code)" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Copy :size="18" />
                  </button>
                </div>
              </div>
              <div class="p-4 bg-white/10 rounded-xl border border-white/10">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Descrição</p>
                <p class="text-sm line-clamp-2">{{ editOrgForm.description || currentOrg.description || 'Sem descrição disponível.' }}</p>
              </div>
            </div>
          </div>
          <div class="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </Card>

        <div class="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          <button 
            v-for="tab in availableTabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="cn(
              'px-6 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap',
              activeTab === tab.id 
                ? 'border-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-900/20' 
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            )"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Settings Section -->
        <div v-if="activeTab === 'settings'" class="space-y-6 animate-in fade-in duration-500">
          <Card class="p-8 dark:bg-gray-900 border-none shadow-xl">
            <h3 class="text-xl font-bold mb-6 dark:text-white">Personalização da Marca</h3>
            <form @submit.prevent="handleUpdateOrg" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nome da Organização" v-model="editOrgForm.name" required />
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Cor Principal</label>
                  <div class="flex gap-3">
                    <input 
                      type="color" 
                      v-model="editOrgForm.primary_color"
                      class="w-12 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <Input v-model="editOrgForm.primary_color" placeholder="#000000" class="flex-1 font-mono" />
                  </div>
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Logo da Organização</label>
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <Input v-model="editOrgForm.logo_url" placeholder="URL do logo ou faça upload..." />
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-bold">
                      <Upload :size="16" /> Upload
                      <input type="file" class="hidden" accept="image/*" @change="(e) => handleImageUpload(e, 'logo')" />
                    </label>
                  </div>
                </div>
                <div v-if="editOrgForm.logo_url" class="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-2">
                  <img :src="editOrgForm.logo_url" class="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  <button @click="editOrgForm.logo_url = ''" class="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black">
                    <X :size="12" />
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem de Capa (Banner)</label>
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <Input v-model="editOrgForm.banner_url" placeholder="URL da capa ou faça upload..." />
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-bold">
                      <Upload :size="16" /> Upload
                      <input type="file" class="hidden" accept="image/*" @change="(e) => handleImageUpload(e, 'banner')" />
                    </label>
                  </div>
                </div>
                <div v-if="editOrgForm.banner_url" class="mt-2 relative w-full h-32 rounded-lg overflow-hidden border dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <img :src="editOrgForm.banner_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button @click="editOrgForm.banner_url = ''" class="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black">
                    <X :size="16" />
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <textarea 
                  v-model="editOrgForm.description"
                  class="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all min-h-[100px]"
                ></textarea>
              </div>
              <div class="flex justify-end">
                <Button type="submit" :disabled="updatingOrg">
                  {{ updatingOrg ? 'Salvando...' : 'Salvar Alterações' }}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <!-- Members Section -->
        <div v-if="activeTab === 'members'" class="space-y-6">
          <Card class="overflow-hidden bg-white dark:bg-gray-900 border-none shadow-xl">
            <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 class="font-bold text-lg text-gray-900 dark:text-white">Membros da Organização</h3>
              <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">{{ members.length }} Membros</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                    <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cargo</th>
                    <th v-if="canManageMembers" class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-for="member in members" :key="member.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold overflow-hidden border border-orange-200 dark:border-orange-800">
                          <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <span v-else>{{ member.name.charAt(0).toUpperCase() }}</span>
                        </div>
                        <div>
                          <p class="text-sm font-bold text-gray-900 dark:text-white">{{ member.name }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{{ member.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <!-- Owners, Moderators or global admins can change roles -->
                      <select 
                        v-if="(user.org_role === 'owner' || user.role === 'admin') && member.id !== user.id"
                        @change="handleUpdateRole(member.id, ($event.target as HTMLSelectElement).value as any)"
                        class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer appearance-none"
                        :value="member.org_role"
                      >
                        <option value="member" class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Membro</option>
                        <option value="moderator" class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Moderador</option>
                        <!-- Apenas admin global pode dar cargo de dono -->
                        <option v-if="user.role === 'admin'" value="owner" class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Dono</option>
                      </select>
                      <span v-else :class="cn(
                        'px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest',
                        member.org_role === 'owner' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                        member.org_role === 'moderator' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      )">
                        {{ member.org_role === 'owner' ? 'Dono' : member.org_role === 'moderator' ? 'Moderador' : 'Membro' }}
                      </span>
                    </td>
                    <td v-if="canManageMembers" class="px-6 py-4 text-right">
                      <button 
                        v-if="canDeleteMember(member)"
                        @click="handleRemoveMember(member.id)"
                        class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Remover da Organização"
                      >
                        <UserMinus :size="18" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <!-- Manage Section (Rooms/Resources) -->
        <div v-if="activeTab === 'manage'" class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card class="p-6 bg-white dark:bg-gray-900 border-none shadow-xl">
              <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Salas da Organização</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Como administrador, você pode gerenciar as salas disponíveis para seu time.</p>
              <Button class="w-full" @click="onNavigate('admin')">Ir para Painel de Salas</Button>
            </Card>
            <Card class="p-6 bg-white dark:bg-gray-900 border-none shadow-xl">
              <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recursos e Equipamentos</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Gerencie projetores, TVs e outros itens que podem ser reservados.</p>
              <Button class="w-full" variant="secondary" @click="onNavigate('admin')">Gerenciar Recursos</Button>
            </Card>
          </div>
        </div>

    <!-- Leave Organization -->
    <div class="text-center pt-8 border-t border-gray-100 dark:border-gray-800">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Deseja sair desta organização?</p>
      <Button variant="ghost" class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" @click="handleLeaveOrg">
        Sair da Organização
      </Button>
    </div>

    <!-- Leave/Delete Modal for Owners -->
    <div v-if="showLeaveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card class="w-full max-w-md p-8 animate-in zoom-in-95 duration-200 dark:bg-gray-900 border-none shadow-2xl">
        <div class="flex items-center gap-3 mb-6 text-red-600">
          <Shield :size="24" />
          <h3 class="text-xl font-bold dark:text-white">Sair da Organização</h3>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Você é o dono desta organização. Antes de sair, você precisa decidir o que fazer com ela:
        </p>

        <div class="space-y-4">
          <button 
            @click="leaveAction = 'transfer'"
            :class="cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all',
              leaveAction === 'transfer' ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
            )"
          >
            <div class="flex items-center gap-3">
              <Users :size="20" :class="leaveAction === 'transfer' ? 'text-orange-600' : 'text-gray-500 dark:text-gray-400'" />
              <div>
                <p class="text-sm font-bold dark:text-white">Transferir Propriedade</p>
                <p class="text-[10px] text-gray-500">Passe o controle para outro membro e saia.</p>
              </div>
            </div>
          </button>

          <div v-if="leaveAction === 'transfer'" class="pl-4 space-y-2 animate-in slide-in-from-top-2">
            <label class="text-[10px] font-bold uppercase text-gray-500">Selecione o novo dono:</label>
            <select 
              v-model="newOwnerId"
              class="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
            >
              <option disabled value="">Selecione um membro...</option>
              <option v-for="m in members.filter(m => m.id !== user.id)" :key="m.id" :value="m.id">
                {{ m.name }} ({{ m.email }})
              </option>
            </select>
          </div>

          <button 
            @click="leaveAction = 'delete'"
            :class="cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all',
              leaveAction === 'delete' ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
            )"
          >
            <div class="flex items-center gap-3">
              <UserMinus :size="20" :class="leaveAction === 'delete' ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'" />
              <div>
                <p class="text-sm font-bold dark:text-white">Excluir Organização</p>
                <p class="text-[10px] text-gray-500">Apague todos os dados e salas permanentemente.</p>
              </div>
            </div>
          </button>
        </div>

        <div class="flex gap-3 mt-8">
          <Button variant="secondary" class="flex-1" @click="showLeaveModal = false">Cancelar</Button>
          <Button 
            variant="primary" 
            class="flex-1 bg-red-600 hover:bg-red-700" 
            :disabled="!leaveAction || (leaveAction === 'transfer' && !newOwnerId) || leaving"
            @click="confirmLeave"
          >
            {{ leaving ? 'Processando...' : 'Confirmar' }}
          </Button>
        </div>
      </Card>
    </div>

    <!-- Simple Leave Confirmation Modal -->
    <div v-if="showLeaveConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card class="w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 dark:bg-gray-900 border-none shadow-2xl">
        <h2 class="text-2xl font-black tracking-tighter mb-4 text-gray-900 dark:text-white uppercase italic text-center">Confirmar Saída</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-8 text-center leading-relaxed">
          Tem certeza que deseja sair desta organização? Você perderá o acesso a todos os recursos e salas.
        </p>
        <div class="flex gap-3">
          <Button variant="secondary" class="flex-1" @click="showLeaveConfirm = false">Cancelar</Button>
          <Button variant="primary" class="flex-1 bg-red-600 hover:bg-red-700" :disabled="leaving" @click="confirmSimpleLeave">
            {{ leaving ? 'Saindo...' : 'Sair' }}
          </Button>
        </div>
      </Card>
    </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Building2, Users, Plus, Copy, Check, UserMinus, Shield, Layout, ArrowLeft, Upload, X } from 'lucide-vue-next';
import { api } from '@/src/services/api';
import { cn } from '@/src/lib/utils';
import Card from './Card.vue';
import Input from './Input.vue';
import Button from './Button.vue';
import type { Organization, User } from '@/src/types';

const props = defineProps<{
  user: User;
  onUpdateUser: (user: User) => void;
  onNavigate: (page: string) => void;
}>();

const currentOrg = ref<Organization | null>(null);
const members = ref<User[]>([]);
const loading = ref(true);
const joining = ref(false);
const creating = ref(false);
const updatingOrg = ref(false);
const leaving = ref(false);
const joinCode = ref('');
const createForm = ref({ name: '', description: '' });
const editOrgForm = ref({ name: '', description: '', primary_color: '#ea580c', logo_url: '', banner_url: '' });
const activeTab = ref('members');
const showJoinCreate = ref(false);

// Leave flow
const showLeaveModal = ref(false);
const leaveAction = ref<'transfer' | 'delete' | null>(null);
const newOwnerId = ref<number | ''>('');

const canManageMembers = computed(() => {
  return props.user.org_role === 'owner' || props.user.org_role === 'moderator' || props.user.role === 'admin';
});

const canManageOrg = computed(() => {
  return props.user.org_role === 'owner' || props.user.role === 'admin';
});

const canDeleteMember = (member: User) => {
  if (member.id === props.user.id) return false; // Cannot delete self
  
  // Admin global can delete anyone
  if (props.user.role === 'admin') return true;
  
  // Dono pode remover qualquer um exceto outro dono
  if (props.user.org_role === 'owner') return member.org_role !== 'owner';
  
  return false;
};

const availableTabs = computed(() => {
  const tabs = [{ id: 'members', label: 'Membros' }];
  if (canManageMembers.value) {
    tabs.push({ id: 'manage', label: 'Gerenciar' });
  }
  if (canManageOrg.value) {
    tabs.push({ id: 'settings', label: 'Configurações' });
  }
  return tabs;
});

onMounted(() => {
  fetchMyOrg();
});

const fetchMyOrg = async () => {
  loading.value = true;
  try {
    const org = await api.get('/organizations/my');
    currentOrg.value = org;
    if (org) {
      editOrgForm.value = {
        name: org.name,
        description: org.description || '',
        primary_color: org.primary_color || '#ea580c',
        logo_url: org.logo_url || '',
        banner_url: org.banner_url || ''
      };
      await fetchMembers();
    }
  } catch (err) {
    console.error('Erro ao buscar organização:', err);
    currentOrg.value = null;
  } finally {
    loading.value = false;
  }
};

const handleImageUpload = (event: Event, type: 'logo' | 'banner') => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (type === 'logo') editOrgForm.value.logo_url = e.target?.result as string;
    else editOrgForm.value.banner_url = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const handleUpdateOrg = async () => {
  updatingOrg.value = true;
  try {
    await api.put('/organizations/my', editOrgForm.value);
    await fetchMyOrg();
    
    // Update global user state if name changed
    if (currentOrg.value && editOrgForm.value.name !== props.user.organization_name) {
      props.onUpdateUser({
        ...props.user,
        organization_name: editOrgForm.value.name
      });
    }
    
    alert('Organização atualizada com sucesso!');
  } catch (err: any) {
    alert(err.message || 'Erro ao atualizar organização');
  } finally {
    updatingOrg.value = false;
  }
};

watch(() => props.user.organization_id, () => {
  fetchMyOrg();
});

const fetchMembers = async () => {
  try {
    const data = await api.get('/organizations/members');
    members.value = data;
  } catch (err) {
    console.error('Erro ao buscar membros:', err);
  }
};

const handleUpdateRole = async (userId: number, role: 'owner' | 'admin' | 'moderator' | 'member') => {
  try {
    await api.put(`/organizations/members/${userId}/role`, { role });
    await fetchMembers();
  } catch (err: any) {
    console.error('Erro ao atualizar cargo:', err);
  }
};

const handleRemoveMember = async (userId: number) => {
  if (!confirm('Tem certeza que deseja remover este membro da organização?')) return;
  try {
    await api.delete(`/organizations/members/${userId}`);
    await fetchMembers();
  } catch (err: any) {
    console.error('Erro ao remover membro:', err);
  }
};

const showLeaveConfirm = ref(false);

const handleLeaveOrg = async () => {
  if (props.user.org_role === 'owner' && props.user.role !== 'admin') {
    showLeaveModal.value = true;
    return;
  }
  showLeaveConfirm.value = true;
};

const confirmSimpleLeave = async () => {
  try {
    leaving.value = true;
    await api.post('/organizations/leave', { action: 'leave' });
    
    currentOrg.value = null;
    const updatedUser = await api.get('/auth/me');
    props.onUpdateUser(updatedUser);
    showLeaveConfirm.value = false;
  } catch (err: any) {
    console.error('Erro ao sair da organização:', err);
  } finally {
    leaving.value = false;
  }
};

const confirmLeave = async () => {
  if (!leaveAction.value) return;
  leaving.value = true;
  try {
    await api.post('/organizations/leave', { 
      action: leaveAction.value, 
      newOwnerId: newOwnerId.value 
    });
    
    showLeaveModal.value = false;
    currentOrg.value = null;
    const updatedUser = await api.get('/auth/me');
    props.onUpdateUser(updatedUser);
  } catch (err: any) {
    console.error('Erro ao processar saída:', err);
  } finally {
    leaving.value = false;
  }
};

const handleJoin = async () => {
  if (!joinCode.value) return;
  joining.value = true;
  try {
    const res = await api.post('/organizations/join', { code: joinCode.value.toUpperCase() });
    currentOrg.value = res.organization;
    
    // Atualiza o usuário no estado global
    const updatedUser = { 
      ...props.user, 
      organization_id: res.organization.id, 
      organization_name: res.organization.name,
      org_role: 'member' as any 
    };
    props.onUpdateUser(updatedUser);
    
    await fetchMembers();
    showJoinCreate.value = false;
    alert('Você entrou na organização com sucesso!');
  } catch (err: any) {
    alert(err.message || 'Erro ao entrar na organização');
  } finally {
    joining.value = false;
  }
};

const handleCreate = async () => {
  if (!createForm.value.name) return;
  creating.value = true;
  try {
    const res = await api.post('/organizations', createForm.value);
    
    // Busca os dados completos da nova organização
    await fetchMyOrg();
    
    // Atualiza o usuário no estado global
    const updatedUser = { 
      ...props.user, 
      organization_id: res.id, 
      organization_name: res.name,
      org_role: 'owner' as any 
    };
    props.onUpdateUser(updatedUser);
    
    showJoinCreate.value = false;
    alert(`Organização criada! Seu código de acesso é: ${res.code}`);
  } catch (err: any) {
    alert(err.message || 'Erro ao criar organização');
  } finally {
    creating.value = false;
  }
};

const copyCode = (code: string) => {
  navigator.clipboard.writeText(code);
  alert('Código copiado para a área de transferência!');
};
</script>
