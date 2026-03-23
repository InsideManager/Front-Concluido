<template>
  <div :class="cn('min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans transition-colors duration-300', theme === 'dark' ? 'dark' : '')">
    <!-- Auth Views -->
    <template v-if="!user">
      <LandingPage 
        v-if="authView === 'landing'"
        :onStart="() => authView = 'login'" 
        :onDemo="handleDemo"
      />
      <LoginPage 
        v-else
        :onLogin="handleLogin" 
        :onBack="() => { authView = 'landing'; resetPasswordData = null; }" 
        :resetPasswordData="resetPasswordData"
      />
    </template>

    <!-- App Main -->
    <template v-else>
      <div class="flex min-h-screen">
        <!-- Organization Sidebar -->
        <aside class="hidden md:flex w-16 bg-white dark:bg-black flex-col items-center py-4 gap-4 border-r border-gray-200 dark:border-gray-800 shrink-0 z-50">
          <div class="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg shadow-orange-600/20">
            <CalendarIcon :size="20" />
          </div>
          
          <div class="w-8 h-px bg-gray-100 dark:bg-gray-800" />
          
          <div class="flex flex-col gap-3 flex-1 overflow-y-auto w-full items-center scrollbar-hide">
            <button 
              v-for="org in organizations" 
              :key="org.id"
              @click="switchOrganization(org.id)"
              :class="cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group',
                user?.organization_id === org.id 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-white'
              )"
              :title="org.name"
            >
              <span v-if="!org.logo_url" class="text-xs font-black">{{ org.name.substring(0, 2).toUpperCase() }}</span>
              <img v-else :src="org.logo_url" class="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
              
              <!-- Tooltip -->
              <div class="absolute left-14 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-gray-200 dark:border-gray-800 shadow-xl">
                {{ org.name }}
              </div>
              
              <!-- Active Indicator -->
              <div v-if="user?.organization_id === org.id" class="absolute -left-4 w-1 h-6 bg-orange-600 rounded-r-full" />
            </button>

            <button 
              @click="currentPage = 'organizations'"
              class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-600 transition-all"
              title="Nova Organização"
            >
              <Plus :size="20" />
            </button>
          </div>
        </aside>

        <div class="flex-1 flex flex-col min-w-0">
          <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                <CalendarIcon :size="18" />
              </div>
              <div class="flex flex-col">
                <span class="text-xl font-black tracking-tighter leading-none">InsideManager</span>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="hidden md:flex items-center gap-1 mr-4">
                <Button 
                  variant="ghost" 
                  :class="cn(currentPage === 'home' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20')"
                  @click="currentPage = 'home'"
                >
                  Início
                </Button>
                <Button 
                  variant="ghost" 
                  :class="cn(currentPage === 'dashboard' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20')"
                  @click="currentPage = 'dashboard'"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  :class="cn(currentPage === 'rooms' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20')"
                  @click="currentPage = 'rooms'"
                >
                  Salas
                </Button>
                <Button 
                  variant="ghost" 
                  :class="cn(currentPage === 'meetings' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20')"
                  @click="currentPage = 'meetings'"
                >
                  Reuniões
                </Button>
                <Button 
                  variant="ghost" 
                  :class="cn(currentPage === 'organizations' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20')"
                  @click="currentPage = 'organizations'"
                >
                  Organizações
                </Button>
                <Button 
                  variant="ghost" 
                  :class="cn(currentPage === 'profile' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20')"
                  @click="currentPage = 'profile'"
                >
                  Perfil
                </Button>
                <Button 
                  v-if="user.role === 'admin' || user.org_role === 'owner' || user.org_role === 'moderator'"
                  variant="ghost" 
                  :class="cn(currentPage === 'admin' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20')"
                  @click="currentPage = 'admin'"
                >
                  {{ user.role === 'admin' ? 'Admin' : 'Gerenciar' }}
                </Button>
              </div>

              <div class="flex items-center gap-3 border-l pl-4">
                <!-- Notification Bell -->
                <div class="relative">
                  <button 
                    @click="showNotificationHistory = !showNotificationHistory"
                    class="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all relative"
                  >
                    <BellIcon :size="20" />
                    <span v-if="unreadCount > 0" class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {{ unreadCount > 9 ? '9+' : unreadCount }}
                    </span>
                  </button>

                  <!-- Notification History Dropdown -->
                  <div v-if="showNotificationHistory" class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div class="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h4 class="font-bold text-sm">Notificações</h4>
                        <div class="flex items-center gap-3">
                          <button @click="markAllAsRead" class="text-[10px] font-bold text-orange-600 hover:underline">Marcar todas como lidas</button>
                          <button @click="navigateToNotifications" class="text-[10px] font-bold text-gray-500 hover:text-orange-600 flex items-center gap-1">
                            <Maximize2 :size="10" /> Ver todas
                          </button>
                        </div>
                      </div>
                    <div class="max-h-96 overflow-y-auto">
                      <div v-if="notificationHistory.length === 0" class="p-8 text-center text-gray-400 text-xs italic">
                        Nenhuma notificação por aqui.
                      </div>
                      <div 
                        v-for="notif in notificationHistory" 
                        :key="notif.id"
                        :class="cn('p-4 border-b last:border-none dark:border-gray-800 transition-colors', !notif.is_read && 'bg-orange-50/50 dark:bg-orange-900/10')"
                      >
                        <div class="flex gap-3">
                          <div :class="cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getNotifColor(notif.type))" />
                          <div>
                            <p class="text-xs font-bold">{{ notif.title }}</p>
                            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{{ notif.message }}</p>
                            <p class="text-[8px] text-gray-400 mt-1">{{ formatDate(notif.created_at) }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- User Avatar -->
                <div @click="currentPage = 'profile'" class="cursor-pointer w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 text-xs font-bold overflow-hidden border border-orange-200 dark:border-orange-800">
                  <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <span v-else>{{ user.name.charAt(0).toUpperCase() }}</span>
                </div>

                <button 
                  @click="handleLogout"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut :size="20" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main class="pb-20 flex-1 overflow-y-auto">
        <Home v-if="currentPage === 'home'" :user="user" :onNavigate="(p) => currentPage = p as any" />
        <Overview v-else-if="currentPage === 'dashboard'" :user="user" :onNavigate="(p) => currentPage = p as any" />
        <RoomsArea v-else-if="currentPage === 'rooms'" :user="user" :onNavigate="(p) => currentPage = p as any" />
        <MeetingsArea v-else-if="currentPage === 'meetings'" :user="user" :onNavigate="(p) => currentPage = p as any" />
        <AdminPanel v-else-if="currentPage === 'admin'" :user="user" />
        <Organizations v-else-if="currentPage === 'organizations'" :user="user" :onUpdateUser="handleUpdateUser" :onNavigate="(p) => currentPage = p as any" />
        <Profile v-else-if="currentPage === 'profile'" :user="user" :onUpdateUser="handleUpdateUser" :onNavigate="(p) => currentPage = p as any" />
        <ChangePassword v-else-if="currentPage === 'change-password'" :onNavigate="(p) => currentPage = p as any" />
        <NotificationsArea v-else-if="currentPage === 'notifications'" :user="user" />
        <StaticPage 
          v-else-if="staticPages[currentPage as keyof typeof staticPages]"
          v-bind="staticPages[currentPage as keyof typeof staticPages]"
          @back="currentPage = 'home'"
        />
      </main>
    </div>
  </div>
    </template>

    <Footer 
      @navigate="(p) => { if (user) currentPage = p as any; else authView = 'login'; }" 
    />

    <!-- Notifications Toast -->
    <TransitionGroup 
      tag="div" 
      class="fixed top-20 right-4 z-50 space-y-2 pointer-events-none"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-10 scale-95"
      enter-to-class="opacity-100 translate-x-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-for="notif in notifications" 
        :key="notif.id"
        :class="cn(
          'pointer-events-auto bg-white dark:bg-gray-900 border-l-4 shadow-2xl p-4 rounded-xl w-80 flex gap-4 items-start',
          notif.type === 'success' ? 'border-emerald-500' : 
          notif.type === 'warning' ? 'border-orange-500' : 
          notif.type === 'error' ? 'border-red-500' : 'border-blue-500'
        )"
      >
        <div :class="cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          notif.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 
          notif.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 
          notif.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
        )">
          <BellIcon :size="20" />
        </div>
        <div class="flex-1">
          <h5 class="font-bold text-sm">{{ notif.title }}</h5>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ notif.message }}</p>
        </div>
        <button @click="removeNotification(notif.id)" class="text-gray-400 hover:text-gray-600 transition-colors">
          <XIcon :size="16" />
        </button>
      </div>
    </TransitionGroup>

    <!-- Mobile Nav -->
    <template v-if="user">
      <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-around items-center z-40">
        <button 
          @click="currentPage = 'home'"
          :class="cn('flex flex-col items-center gap-1', currentPage === 'home' ? 'text-orange-600' : 'text-gray-400 dark:text-gray-500')"
        >
          <HomeIcon :size="20" />
          <span class="text-[10px] font-bold uppercase">Início</span>
        </button>
        <button 
          @click="currentPage = 'dashboard'"
          :class="cn('flex flex-col items-center gap-1', currentPage === 'dashboard' ? 'text-orange-600' : 'text-gray-400 dark:text-gray-500')"
        >
          <LayoutDashboard :size="20" />
          <span class="text-[10px] font-bold uppercase">Dashboard</span>
        </button>
        <button 
          @click="currentPage = 'rooms'"
          :class="cn('flex flex-col items-center gap-1', currentPage === 'rooms' ? 'text-orange-600' : 'text-gray-400 dark:text-gray-500')"
        >
          <Box :size="20" />
          <span class="text-[10px] font-bold uppercase">Salas</span>
        </button>
        <button 
          @click="currentPage = 'meetings'"
          :class="cn('flex flex-col items-center gap-1', currentPage === 'meetings' ? 'text-orange-600' : 'text-gray-400 dark:text-gray-500')"
        >
          <Clock :size="20" />
          <span class="text-[10px] font-bold uppercase">Reuniões</span>
        </button>
        <button 
          @click="currentPage = 'profile'"
          :class="cn('flex flex-col items-center gap-1', currentPage === 'profile' ? 'text-orange-600' : 'text-gray-400 dark:text-gray-500')"
        >
          <UserIcon :size="20" />
          <span class="text-[10px] font-bold uppercase">Perfil</span>
        </button>
        <button 
          v-if="user.role === 'admin' || user.org_role === 'owner' || user.org_role === 'moderator'"
          @click="currentPage = 'admin'"
          :class="cn('flex flex-col items-center gap-1', currentPage === 'admin' ? 'text-orange-600' : 'text-gray-400 dark:text-gray-500')"
        >
          <Settings :size="20" />
          <span class="text-[10px] font-bold uppercase">{{ user.role === 'admin' ? 'Admin' : 'Gerenciar' }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed, defineAsyncComponent } from 'vue';
import { 
  Calendar as CalendarIcon, 
  Sun, 
  Moon, 
  LogOut, 
  Home as HomeIcon, 
  LayoutDashboard, 
  Users, 
  Box, 
  Clock, 
  Settings,
  Bell as BellIcon,
  X as XIcon,
  Building2,
  Plus,
  Maximize2
} from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/services/api';
import Button from './components/Button.vue';
import LandingPage from './components/LandingPage.vue';
import LoginPage from './components/LoginPage.vue';
import Footer from './components/Footer.vue';
import type { User, SystemNotification } from './types';

// Lazy load components for better initial performance
const Home = defineAsyncComponent(() => import('./components/Home.vue'));
const Overview = defineAsyncComponent(() => import('./components/Overview.vue'));
const RoomsArea = defineAsyncComponent(() => import('./components/RoomsArea.vue'));
const MeetingsArea = defineAsyncComponent(() => import('./components/MeetingsArea.vue'));
const AdminPanel = defineAsyncComponent(() => import('./components/AdminPanel.vue'));
const Organizations = defineAsyncComponent(() => import('./components/Organizations.vue'));
const Profile = defineAsyncComponent(() => import('./components/Profile.vue'));
const ChangePassword = defineAsyncComponent(() => import('./components/ChangePassword.vue'));
const NotificationsArea = defineAsyncComponent(() => import('./components/NotificationsArea.vue'));
const StaticPage = defineAsyncComponent(() => import('./components/StaticPage.vue'));

// Estados globais da aplicação
const user = ref<User | null>(null);
const currentPage = ref<'home' | 'dashboard' | 'rooms' | 'meetings' | 'admin' | 'organizations' | 'profile' | 'help' | 'docs' | 'status' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'notifications' | 'change-password'>('home');

const navigateToNotifications = () => {
  currentPage.value = 'notifications';
  showNotificationHistory.value = false;
};
const authView = ref<'landing' | 'login'>('landing');
const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const theme = ref<'light' | 'dark'>(getSystemTheme());
const resetPasswordData = ref<{ token: string, email: string } | null>(null);

// Estado das notificações
const notifications = ref<Array<{ id: number, title: string, message: string, type?: string }>>([]);
const notificationHistory = ref<SystemNotification[]>([]);
const showNotificationHistory = ref(false);
const unreadCount = computed(() => notificationHistory.value.filter(n => !n.is_read).length);

// Estado das organizações
const organizations = ref<any[]>([]);

const fetchOrganizations = async () => {
  if (!user.value) return;
  try {
    const data = await api.get('/organizations/list');
    organizations.value = data;
  } catch (err) {
    console.error('Erro ao buscar organizações:', err);
  }
};

const switchOrganization = async (orgId: number) => {
  if (user.value?.organization_id === orgId) return;
  
  try {
    await api.post('/organizations/switch', { organization_id: orgId });
    const updatedUser = await api.get('/auth/me');
    handleUpdateUser(updatedUser);
    addNotification('Organização Alterada', `Você agora está em ${updatedUser.organization_name}`, 'success');
    // Forçar recarregamento de dados de outros componentes se necessário
    window.dispatchEvent(new CustomEvent('app:data_change', { detail: { type: 'org_switch' } }));
  } catch (err) {
    addNotification('Erro', 'Não foi possível trocar de organização', 'error');
  }
};

const fetchNotifications = async () => {
  if (!user.value) return;
  try {
    const data = await api.get('/notifications');
    notificationHistory.value = data;
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
  }
};

const markAllAsRead = async () => {
  try {
    await api.post('/notifications/read-all', {});
    notificationHistory.value = notificationHistory.value.map(n => ({ ...n, is_read: 1 }));
    window.dispatchEvent(new CustomEvent('notifications:updated'));
  } catch (err) {
    console.error('Erro ao marcar notificações como lidas:', err);
  }
};

const getNotifColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-emerald-500';
    case 'warning': return 'bg-orange-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-blue-500';
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// Dados das páginas estáticas
const staticPages = {
  help: {
    title: 'Central de Ajuda',
    description: 'Tudo o que você precisa saber para dominar o InsideManager.',
    content: [
      { title: 'Como começar', text: 'Para começar, faça o login com suas credenciais corporativas. No dashboard, você terá uma visão geral das salas disponíveis e seus próximos agendamentos.' },
      { title: 'Reservando uma sala', text: 'Vá para a aba "Salas", escolha o ambiente desejado, selecione a data e o horário. Você também pode adicionar recursos extras como projetores ou café.' },
      { title: 'Cancelamentos', text: 'Seus agendamentos podem ser cancelados na aba "Minhas Reuniões" até 30 minutos antes do início previsto.' }
    ]
  },
  docs: {
    title: 'Documentação',
    description: 'Guias técnicos e APIs para integração.',
    content: [
      { title: 'API de Reservas', text: 'Nossa API REST permite que você integre o InsideManager com seu calendário do Google ou Outlook de forma automática.' },
      { title: 'Webhooks', text: 'Configure webhooks para receber notificações em tempo real sempre que uma sala for reservada ou liberada.' },
      { title: 'Segurança', text: 'Utilizamos OAuth2 e criptografia de ponta a ponta para garantir que seus dados corporativos estejam sempre seguros.' }
    ]
  },
  status: {
    title: 'Status do Sistema',
    description: 'Monitoramento em tempo real da nossa infraestrutura.',
    content: [
      { title: 'API Principal', text: 'Operacional - Latência média: 45ms' },
      { title: 'Banco de Dados', text: 'Operacional - Uptime: 99.99%' },
      { title: 'Serviço de Notificações', text: 'Operacional - Entrega imediata ativa.' }
    ]
  },
  contact: {
    title: 'Contato',
    description: 'Estamos aqui para ajudar sua equipe.',
    content: [
      { title: 'Suporte Técnico', text: 'E-mail: suporte@insidemanager.com - Resposta em até 2 horas em horário comercial.' },
      { title: 'Vendas e Parcerias', text: 'E-mail: comercial@insidemanager.com' },
      { title: 'Endereço', text: 'Av. Paulista, 1000 - São Paulo, SP - Brasil' }
    ]
  },
  privacy: {
    title: 'Privacidade',
    description: 'Como tratamos seus dados com respeito e segurança.',
    content: [
      { title: 'Coleta de Dados', text: 'Coletamos apenas as informações necessárias para o funcionamento da plataforma, como seu nome, e-mail e histórico de reservas.' },
      { title: 'Uso de Dados', text: 'Seus dados nunca são vendidos para terceiros. Eles são usados exclusivamente para a gestão de espaços da sua empresa.' },
      { title: 'Seus Direitos', text: 'Você tem o direito de solicitar a exclusão total dos seus dados a qualquer momento através do nosso suporte.' }
    ]
  },
  terms: {
    title: 'Termos de Uso',
    description: 'Regras para uma convivência produtiva.',
    content: [
      { title: 'Uso Aceitável', text: 'A plataforma deve ser usada apenas para fins profissionais e agendamento de espaços corporativos.' },
      { title: 'Responsabilidade', text: 'O usuário é responsável pela conservação dos recursos solicitados durante o período da reserva.' },
      { title: 'Modificações', text: 'Reservamo-nos o direito de atualizar estes termos para refletir melhorias no serviço.' }
    ]
  },
  cookies: {
    title: 'Cookies',
    description: 'Transparência sobre o uso de tecnologias de rastreio.',
    content: [
      { title: 'Cookies Essenciais', text: 'Usamos cookies para manter você logado e lembrar suas preferências de tema (claro/escuro).' },
      { title: 'Analytics', text: 'Utilizamos dados anônimos para entender quais salas são mais populares e otimizar o layout da plataforma.' },
      { title: 'Gerenciamento', text: 'Você pode desativar cookies nas configurações do seu navegador, mas algumas funções da plataforma podem ser limitadas.' }
    ]
  }
};

// Observa mudanças na página para resetar o scroll
let ws: WebSocket | null = null;

watch([currentPage, authView], () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const handleUpdateUser = (updatedUser: User) => {
  user.value = updatedUser;
  localStorage.setItem('user', JSON.stringify(updatedUser));
  fetchOrganizations();
};

onMounted(() => {
  window.addEventListener('notifications:updated', fetchNotifications);
  // Verifica se o token é muito grande (causando erro 413) e limpa se necessário
  const token = localStorage.getItem('token');
  if (token && token.length > 4000) {
    console.warn('Token muito grande detectado, limpando para evitar erro 413');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    user.value = null;
    authView.value = 'login';
    addNotification('Sessão Expirada', 'Sua sessão foi reiniciada para otimização de performance. Por favor, faça login novamente.', 'warning');
    return;
  }

  // Verifica se há parâmetros de reset de senha na URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const email = urlParams.get('email');
  
  if (resetToken && email) {
    resetPasswordData.value = { token: resetToken, email };
    authView.value = 'login';
  }

  // Recupera dados do usuário do localStorage ao carregar a página
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    user.value = JSON.parse(savedUser);
    setupWebSocket(); // Inicializa o WebSocket se o usuário estiver logado
    fetchNotifications(); // Busca histórico de notificações
    fetchOrganizations(); // Busca lista de organizações
  }
  
  // Listener para mudanças no tema do sistema
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    theme.value = e.matches ? 'dark' : 'light';
  };
  
  // Adiciona o listener usando o método moderno
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else {
    // Fallback para navegadores mais antigos
    mediaQuery.addListener(handleSystemThemeChange);
  }
  
  applyTheme(); // Aplica o tema do sistema
});

onUnmounted(() => {
  window.removeEventListener('notifications:updated', fetchNotifications);
  // Fecha a conexão WebSocket ao destruir o componente
  if (ws) ws.close();
});

// Configuração da conexão WebSocket para notificações
const setupWebSocket = () => {
  if (ws) ws.close();
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    // Autentica a conexão enviando o token JWT
    const token = localStorage.getItem('token');
    if (token) {
      ws?.send(JSON.stringify({ type: 'auth', token }));
    }
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Trata mensagens de notificação recebidas do servidor
      if (data.type === 'notification') {
        addNotification(data.title, data.message, data.notificationType);
        fetchNotifications(); // Atualiza o histórico quando recebe uma nova
      } else if (data.type === 'data_change') {
        // Dispara um evento global para que outros componentes possam atualizar seus dados
        window.dispatchEvent(new CustomEvent('app:data_change', { detail: data }));
      }
    } catch (e) {
      console.error('Erro na mensagem WS:', e);
    }
  };
  
  ws.onclose = () => {
    // Tenta reconectar após 5 segundos se a conexão cair
    setTimeout(setupWebSocket, 5000);
  };
};

// Adiciona uma nova notificação visual (toast)
const addNotification = (title: string, message: string, type: string = 'info') => {
  const id = Date.now();
  notifications.value.push({ id, title, message, type });
  
  // Remove automaticamente após 10 segundos
  setTimeout(() => {
    removeNotification(id);
  }, 10000);
};

// Remove uma notificação da lista
const removeNotification = (id: number) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

// Aplica o tema (claro/escuro) no documento
const applyTheme = () => {
  const isDark = theme.value === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    document.body.classList.remove('dark');
  }
};

// Observa mudanças no tema para aplicação imediata
watch(theme, () => {
  applyTheme();
});

// Trata o sucesso do login
const handleLogin = (newUser: User, token: string) => {
  console.log('[App] handleLogin triggered', newUser.email);
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(newUser));
  user.value = newUser;
  setupWebSocket(); // Inicializa o WebSocket se o usuário estiver logado
  fetchNotifications(); // Busca histórico de notificações
  fetchOrganizations(); // Busca lista de organizações
};

// Trata o logout do usuário
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  user.value = null;
  authView.value = 'landing';
  if (ws) ws.close(); // Fecha o WebSocket ao deslogar
};

// Função para login rápido de demonstração
const handleDemo = async () => {
  console.log('[App] handleDemo triggered');
  try {
    const data = await api.post('/auth/login', { 
      email: 'admin@example.com', 
      password: 'admin123' 
    });
    console.log('[App] handleDemo success', data.user.email);
    handleLogin(data.user, data.token);
  } catch (err) {
    console.error('[App] handleDemo failed, using fallback', err);
    // Fallback para dados fictícios se a API falhar
    const demoUser: User = { 
      id: 1, 
      name: 'Admin Demo', 
      email: 'admin@example.com', 
      role: 'admin' 
    };
    handleLogin(demoUser, 'demo-token');
  }
};
</script>
