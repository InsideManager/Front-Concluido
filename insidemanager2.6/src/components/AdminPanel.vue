<template>
  <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
    <div class="flex items-center gap-3">
      <Settings class="text-orange-600" :size="32" />
      <h1 class="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">Painel Administrativo</h1>
    </div>

    <div class="flex border-b dark:border-gray-800 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id as TabId"
        :class="cn(
          'px-6 py-3 font-bold text-sm transition-all border-b-2 capitalize whitespace-nowrap',
          activeTab === tab.id 
            ? 'border-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-900/20' 
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        )"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center dark:text-gray-400">Carregando painel...</div>

    <div v-else class="grid grid-cols-1 gap-8">
      <!-- Organizations Tab (Global Admin Only) -->
      <div v-if="activeTab === 'organizations'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card v-for="org in organizations" :key="org.id" class="p-6 dark:bg-gray-900 border-none shadow-xl hover:shadow-2xl transition-all group">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                <Building2 :size="24" />
              </div>
              <div class="flex flex-col items-end">
                <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Código</span>
                <span class="font-mono font-bold text-orange-600">{{ org.code }}</span>
              </div>
            </div>
            
            <h3 class="text-xl font-black tracking-tight dark:text-white mb-2">{{ org.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 h-10">
              {{ org.description || 'Sem descrição disponível.' }}
            </p>

            <div class="flex items-center gap-2 pt-4 border-t dark:border-gray-800">
              <Button @click="accessOrganization(org.id)" class="w-full gap-2" variant="secondary">
                <Globe :size="16" /> Acessar Organização
              </Button>
            </div>
          </Card>
        </div>

        <div v-if="organizations.length === 0" class="py-20 text-center border-2 border-dashed dark:border-gray-800 rounded-3xl">
          <Building2 :size="48" class="mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">Nenhuma organização cadastrada no sistema.</p>
        </div>
      </div>

      <!-- Rooms Tab -->
      <div v-if="activeTab === 'rooms'" class="space-y-6">
        <Card class="p-6 dark:bg-gray-900 border-none shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                <Layout :size="20" />
              </div>
              <h3 class="text-xl font-bold dark:text-white">Cadastrar Nova Sala</h3>
            </div>
            <div v-if="isTypeSelected" class="flex items-center gap-2">
              <span :class="cn(
                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                roomForm.type === 'physical' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              )">
                {{ roomForm.type === 'physical' ? 'Física' : 'Virtual' }}
              </span>
              <button @click="startRoomCreation" class="text-xs text-orange-600 hover:underline font-bold">Alterar</button>
            </div>
          </div>
          
          <div v-if="!isTypeSelected" class="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed dark:border-gray-800 rounded-2xl">
            <div class="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-full mb-6 text-orange-600">
              <Plus :size="40" />
            </div>
            <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Clique no botão abaixo para iniciar o cadastro de uma nova sala física ou virtual no sistema.</p>
            <Button @click="startRoomCreation" size="lg" class="px-10">
              Começar Agora
            </Button>
          </div>

          <form v-else @submit.prevent="handleAddRoom" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Input label="Nome da Sala" v-model="roomForm.name" placeholder="Ex: Sala de Reunião A" :error="roomErrors.name" required />
              
              <template v-if="roomForm.type === 'physical'">
                <Input label="Capacidade Máxima" type="number" v-model.number="roomForm.capacity" placeholder="Ex: 10" :error="roomErrors.capacity" required />
                <Input label="Localização / Bloco" v-model="roomForm.location" placeholder="Ex: 3º Andar, Ala Sul" :error="roomErrors.location" required />
              </template>
              
              <template v-else>
                <Input label="Plataforma" v-model="roomForm.location" placeholder="Ex: Google Meet, Zoom, Teams" :error="roomErrors.location" required />
                <Input label="Link da Reunião" v-model="roomForm.google_meet_url" placeholder="https://meet.google.com/abc-defg-hij" :error="roomErrors.google_meet_url" required />
              </template>

              <Input v-if="roomForm.type === 'physical'" label="Link Google Meet (Opcional)" v-model="roomForm.google_meet_url" placeholder="https://meet.google.com/..." :error="roomErrors.google_meet_url" />
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem da Sala</label>
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                  <Input v-model="roomForm.image_url" placeholder="URL da imagem ou faça upload..." :error="roomErrors.image_url" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 font-bold uppercase">Ou</span>
                  <label class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-bold">
                    <Upload :size="16" /> Upload Local
                    <input type="file" class="hidden" accept="image/*" @change="handleFileUpload($event, 'create')" />
                  </label>
                </div>
              </div>
              <div v-if="roomForm.image_url" class="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border dark:border-gray-800">
                <img :src="roomForm.image_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                <button @click="roomForm.image_url = ''" class="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black">
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>
            
            <Input label="Descrição Detalhada" v-model="roomForm.description" placeholder="Descreva os diferenciais desta sala..." :error="roomErrors.description" />

            <ErrorDisplay :error="roomGeneralError" context="admin" />

            <div class="flex justify-end">
              <Button type="submit" class="w-full md:w-auto px-8 flex items-center justify-center gap-2 h-12 shadow-lg shadow-orange-200 dark:shadow-none">
                <Plus :size="20" /> Confirmar Cadastro
              </Button>
            </div>
          </form>
        </Card>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card v-for="room in rooms" :key="room.id" class="flex flex-col hover:shadow-lg transition-all dark:bg-gray-900 border-none shadow-md group overflow-hidden">
            <div class="h-32 w-full overflow-hidden">
              <img :src="room.image_url || DEFAULT_PLACEHOLDER" :alt="room.name" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" loading="lazy" />
            </div>
            
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-3">
                  <h4 class="font-black text-lg dark:text-white tracking-tight">{{ room.name }}</h4>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button @click="openEditModal(room)" class="text-gray-500 dark:text-gray-400 hover:text-orange-600 p-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all">
                      <Settings :size="18" />
                    </button>
                    <button @click="handleDeleteRoom(room.id)" class="text-gray-500 dark:text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                      <Trash2 :size="18" />
                    </button>
                  </div>
                </div>
                <div class="space-y-2 mb-4">
                  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin :size="14" class="text-orange-500" /> {{ room.location }}
                  </div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Users :size="14" class="text-orange-500" /> Até {{ room.capacity }} pessoas
                  </div>
                </div>
                <p v-if="room.description" class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t dark:border-gray-800 pt-3 italic">{{ room.description }}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Edit Room Modal -->
      <Teleport to="body">
        <div v-if="showTypeSelectionModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <Card class="w-full max-w-md p-8 text-center">
            <h3 class="text-2xl font-black tracking-tighter mb-2 dark:text-white">Tipo de Sala</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-8">Selecione o formato da sala que deseja cadastrar</p>
            
            <div class="grid grid-cols-2 gap-4">
              <button 
                @click="selectRoomType('physical')"
                class="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
              >
                <div class="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Building2 :size="32" />
                </div>
                <span class="font-bold dark:text-white">Física</span>
              </button>

              <button 
                @click="selectRoomType('virtual')"
                class="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
              >
                <div class="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Globe :size="32" />
                </div>
                <span class="font-bold dark:text-white">Virtual</span>
              </button>
            </div>

            <button @click="showTypeSelectionModal = false" class="mt-8 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold">
              Cancelar
            </button>
          </Card>
        </div>

        <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card class="w-full max-w-2xl p-6 dark:bg-gray-900">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-bold dark:text-white">Editar Sala: {{ editingRoom?.name }}</h3>
              <button @click="showEditModal = false" class="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Trash2 :size="24" class="rotate-45" />
              </button>
            </div>

            <form @submit.prevent="handleUpdateRoom" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nome da Sala" v-model="editForm.name" :error="editErrors.name" required />
                
                <template v-if="editForm.type === 'physical'">
                  <Input label="Capacidade Máxima" type="number" v-model.number="editForm.capacity" :error="editErrors.capacity" required />
                  <Input label="Localização / Bloco" v-model="editForm.location" :error="editErrors.location" required />
                </template>
                
                <template v-else>
                  <Input label="Plataforma" v-model="editForm.location" :error="editErrors.location" required />
                  <Input label="Link da Reunião" v-model="editForm.google_meet_url" :error="editErrors.google_meet_url" required />
                </template>

                <Input v-if="editForm.type === 'physical'" label="Link Google Meet (Opcional)" v-model="editForm.google_meet_url" :error="editErrors.google_meet_url" />
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem da Sala</label>
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <Input v-model="editForm.image_url" placeholder="URL da imagem ou faça upload..." :error="editErrors.image_url" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 font-bold uppercase">Ou</span>
                    <label class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-bold">
                      <Upload :size="16" /> Upload Local
                      <input type="file" class="hidden" accept="image/*" @change="handleFileUpload($event, 'edit')" />
                    </label>
                  </div>
                </div>
                <div v-if="editForm.image_url" class="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border dark:border-gray-800">
                  <img :src="editForm.image_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  <button @click="editForm.image_url = ''" class="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black">
                    <Trash2 :size="12" />
                  </button>
                </div>
              </div>

              <Input label="Descrição Detalhada" v-model="editForm.description" :error="editErrors.description" />

              <ErrorDisplay :error="editGeneralError" context="admin" />

              <div class="flex gap-3 justify-end">
                <Button variant="secondary" type="button" @click="showEditModal = false">Cancelar</Button>
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </form>
          </Card>
        </div>
      </Teleport>

      <!-- Resources Tab -->
      <div v-if="activeTab === 'resources'" class="space-y-6">
        <Card class="p-6 dark:bg-gray-900 border-none shadow-xl">
          <div class="flex items-center gap-2 mb-6">
            <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
              <Layers :size="20" />
            </div>
            <h3 class="text-xl font-bold dark:text-white">Cadastrar Novo Recurso</h3>
          </div>

          <form @submit.prevent="handleAddResource" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nome do Recurso" v-model="resForm.name" placeholder="Ex: Projetor Epson" required />
              <Input label="Descrição Curta" v-model="resForm.description" placeholder="Ex: Conexão HDMI/VGA" />
            </div>

            <div class="space-y-3">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Selecione um Ícone</label>
              <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                <button
                  v-for="item in availableIcons"
                  :key="item.name"
                  type="button"
                  @click="resForm.icon = item.name"
                  :class="cn(
                    'p-3 rounded-xl border-2 transition-all flex items-center justify-center',
                    resForm.icon === item.name 
                      ? 'border-orange-600 bg-orange-50 text-orange-600 dark:bg-orange-900/20' 
                      : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
                  )"
                >
                  <component :is="item.icon" :size="20" />
                </button>
              </div>
            </div>

            <div class="flex justify-end">
              <Button type="submit" class="w-full md:w-auto px-8 flex items-center justify-center gap-2 h-12 shadow-lg shadow-orange-200 dark:shadow-none">
                <Plus :size="20" /> Adicionar Recurso
              </Button>
            </div>
          </form>
        </Card>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card v-for="res in resources" :key="res.id" class="p-5 flex justify-between items-center dark:bg-gray-900 border-none shadow-md group">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
                <component :is="getIconComponent(res.icon || 'Box')" :size="24" />
              </div>
              <div>
                <h4 class="font-bold dark:text-white">{{ res.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ res.description }}</p>
              </div>
            </div>
            <button @click="handleDeleteResource(res.id)" class="text-gray-500 dark:text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100">
              <Trash2 :size="18" />
            </button>
          </Card>
        </div>
      </div>

      <!-- Users Tab -->
      <Card v-if="activeTab === 'users'" class="overflow-hidden dark:bg-gray-900">
        <table class="w-full text-left">
          <thead class="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
              <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">E-mail</th>
              <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cargo</th>
              <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-gray-800">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 text-[10px] font-bold overflow-hidden border border-orange-200 dark:border-orange-800">
                    <img v-if="u.avatar_url" :src="u.avatar_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span v-else>{{ u.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  {{ u.name }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ u.email }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="cn(
                  'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                  u.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                )">
                  {{ u.role }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <button v-if="u.role !== 'admin'" @click="handleDeleteUser(u.id)" class="text-red-500 hover:underline">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <!-- All Reservations Tab -->
      <div v-if="activeTab === 'reservations'" class="space-y-4">
        <Card class="p-4 dark:bg-gray-900 border-none shadow-md">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Filtrar por Usuário" v-model="filters.user" placeholder="Nome do usuário..." :icon="Search" />
            <Input label="Filtrar por Sala" v-model="filters.room" placeholder="Nome da sala..." />
            <Input label="Filtrar por Data" type="date" v-model="filters.date" />
          </div>
        </Card>

        <Card class="overflow-hidden dark:bg-gray-900 border-none shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                <tr>
                  <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                  <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                  <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sala</th>
                  <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Horário</th>
                  <th class="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y dark:divide-gray-800">
                <tr v-for="r in filteredReservations" :key="r.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{{ r.title }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border dark:border-gray-700">
                        <img v-if="r.user_avatar_url" :src="r.user_avatar_url" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span v-else class="text-[10px]">{{ (r.user_name || '?').charAt(0).toUpperCase() }}</span>
                      </div>
                      {{ r.user_name || 'Usuário removido' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ r.room_name || 'Sala removida' }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {{ safeFormat(r.start_time, 'dd/MM HH:mm') }} - {{ safeFormat(r.end_time, 'HH:mm') }}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <button @click="handleDeleteReservation(r.id)" class="text-red-500 hover:text-red-700 font-bold transition-colors">Cancelar</button>
                  </td>
                </tr>
                <tr v-if="filteredReservations.length === 0">
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                    Nenhuma reserva encontrada com os filtros aplicados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <!-- Announcements Tab -->
      <div v-if="activeTab === 'announcements'" class="space-y-6">
        <Card class="p-6 dark:bg-gray-900 border-none shadow-xl max-w-2xl mx-auto">
          <div class="flex items-center gap-2 mb-6">
            <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
              <BellIcon :size="20" />
            </div>
            <h3 class="text-xl font-bold dark:text-white">Enviar Anúncio Global</h3>
          </div>

          <form @submit.prevent="handleSendAnnouncement" class="space-y-4">
            <Input label="Título do Anúncio" v-model="announcementForm.title" placeholder="Ex: Manutenção Programada" required />
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem</label>
              <textarea 
                v-model="announcementForm.message"
                class="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all min-h-[120px]"
                placeholder="Descreva o anúncio em detalhes..."
                required
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Alerta</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button 
                  v-for="type in (['info', 'success', 'warning', 'error'] as const)" 
                  :key="type"
                  type="button"
                  @click="announcementForm.type = type"
                  :class="cn(
                    'px-3 py-2 rounded-lg text-xs font-bold capitalize border transition-all',
                    announcementForm.type === type 
                      ? 'bg-orange-600 text-white border-orange-600' 
                      : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-orange-600'
                  )"
                >
                  {{ type }}
                </button>
              </div>
            </div>

            <Button type="submit" class="w-full" :disabled="announcementLoading">
              {{ announcementLoading ? 'Enviando...' : 'Enviar para Todos' }}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Settings, 
  Plus, 
  Trash2, 
  MapPin, 
  Users, 
  Info, 
  Layers, 
  Layout, 
  Search,
  Tv,
  Monitor,
  Coffee,
  Wifi,
  AirVent,
  PenTool,
  Box,
  Projector,
  Speaker,
  Mic,
  Wind,
  Zap,
  Upload,
  Image as ImageIcon,
  Building2,
  Video,
  Globe
} from 'lucide-vue-next';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/services/api';
import Button from './Button.vue';
import Card from './Card.vue';
import Input from './Input.vue';
import ErrorDisplay from './ErrorDisplay.vue';
import type { Room, Resource, User, Reservation } from '@/src/types';

const props = defineProps<{
  user: User;
}>();

// Definição dos tipos de abas disponíveis
type TabId = 'rooms' | 'resources' | 'users' | 'reservations' | 'announcements' | 'organizations';

// Estados reativos para controle da interface e dados
const activeTab = ref<TabId>('rooms');
const loading = ref(true);

const tabs = computed(() => {
  const t = [
    { id: 'rooms', label: 'Salas' },
    { id: 'resources', label: 'Recursos' },
    { id: 'reservations', label: 'Reservas' }
  ];
  
  // Apenas admin global vê aba de usuários globais e anúncios globais
  if (props.user.role === 'admin') {
    t.push({ id: 'organizations', label: 'Organizações' });
    t.push({ id: 'users', label: 'Usuários' });
    t.push({ id: 'announcements', label: 'Anúncios' });
  }
  
  return t;
});

// Estado para anúncios
const announcementForm = ref({ title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'error' });
const announcementLoading = ref(false);

const handleSendAnnouncement = async () => {
  if (!announcementForm.value.title || !announcementForm.value.message) return;
  
  announcementLoading.value = true;
  try {
    await api.post('/admin/announce', announcementForm.value);
    alert('Anúncio enviado com sucesso para todos os usuários!');
    announcementForm.value = { title: '', message: '', type: 'info' };
  } catch (err) {
    alert('Erro ao enviar anúncio.');
  } finally {
    announcementLoading.value = false;
  }
};

const rooms = ref<Room[]>([]);
const resources = ref<Resource[]>([]);
const users = ref<User[]>([]);
const reservations = ref<Reservation[]>([]);
const organizations = ref<any[]>([]);

const accessOrganization = async (orgId: number) => {
  try {
    await api.post('/organizations/switch', { organization_id: orgId });
    window.location.reload(); // Recarrega para aplicar as permissões e contexto da nova org
  } catch (err) {
    alert('Erro ao acessar organização');
  }
};

// Filtros para a lista de reservas
const filters = ref({
  user: '',
  room: '',
  date: ''
});

// Lógica de filtragem reativa
const filteredReservations = computed(() => {
  return reservations.value.filter(r => {
    const matchUser = !filters.value.user || (r.user_name || '').toLowerCase().includes(filters.value.user.toLowerCase());
    const matchRoom = !filters.value.room || (r.room_name || '').toLowerCase().includes(filters.value.room.toLowerCase());
    
    let matchDate = true;
    if (filters.value.date) {
      const filterDate = parseISO(filters.value.date);
      const resvDate = parseISO(r.start_time);
      matchDate = isSameDay(startOfDay(filterDate), startOfDay(resvDate));
    }

    return matchUser && matchRoom && matchDate;
  });
});

// Constante para imagem de placeholder padrão
const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000';

// Função para tratar o upload de imagem local
const handleFileUpload = (event: Event, target: 'create' | 'edit') => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result as string;
    if (target === 'create') {
      roomForm.value.image_url = base64;
    } else {
      editForm.value.image_url = base64;
    }
  };
  reader.readAsDataURL(file);
};

// Formulários reativos para criação de salas e recursos
const roomForm = ref({ name: '', capacity: 0, location: '', description: '', image_url: '', google_meet_url: '', type: 'physical' as 'physical' | 'virtual' });
const roomErrors = ref({ name: '', capacity: '', location: '', description: '', image_url: '', google_meet_url: '' });
const roomGeneralError = ref('');
const resForm = ref({ name: '', description: '', icon: 'Box' });

// Controle do popup de seleção de tipo de sala
const showTypeSelectionModal = ref(false);
const isTypeSelected = ref(false);

const startRoomCreation = () => {
  showTypeSelectionModal.value = true;
  isTypeSelected.value = false;
  roomForm.value = { name: '', capacity: 0, location: '', description: '', image_url: '', google_meet_url: '', type: 'physical' };
};

const selectRoomType = (type: 'physical' | 'virtual') => {
  roomForm.value.type = type;
  isTypeSelected.value = true;
  showTypeSelectionModal.value = false;
};

// Ícones disponíveis para recursos
const availableIcons = [
  { name: 'Tv', icon: Tv },
  { name: 'Monitor', icon: Monitor },
  { name: 'Coffee', icon: Coffee },
  { name: 'Wifi', icon: Wifi },
  { name: 'AirVent', icon: AirVent },
  { name: 'PenTool', icon: PenTool },
  { name: 'Box', icon: Box },
  { name: 'Projector', icon: Projector },
  { name: 'Speaker', icon: Speaker },
  { name: 'Mic', icon: Mic },
  { name: 'Wind', icon: Wind },
  { name: 'Zap', icon: Zap }
];

// Função para obter o componente do ícone pelo nome
const getIconComponent = (iconName: string) => {
  const found = availableIcons.find(i => i.name === iconName);
  return found ? found.icon : Box;
};

// Estados para edição de sala
const showEditModal = ref(false);
const editingRoom = ref<Room | null>(null);
const editForm = ref({ name: '', capacity: 0, location: '', description: '', image_url: '', google_meet_url: '', type: 'physical' as 'physical' | 'virtual' });
const editErrors = ref({ name: '', capacity: '', location: '', description: '', image_url: '', google_meet_url: '' });
const editGeneralError = ref('');

onMounted(() => {
  fetchAdminData(); // Busca todos os dados administrativos ao montar o componente
});

// Formatação segura de datas para exibição
const safeFormat = (dateStr: string, formatStr: string) => {
  try {
    if (!dateStr) return 'Data inválida';
    const date = parseISO(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    return format(date, formatStr, { locale: ptBR });
  } catch (e) {
    return 'Erro na data';
  }
};

// Busca centralizada de todos os dados necessários para o painel
const fetchAdminData = async () => {
  try {
    const requests = [
      api.get('/rooms'),
      api.get('/resources'),
      api.get('/users'),
      api.get('/reservations')
    ];

    if (props.user.role === 'admin') {
      requests.push(api.get('/organizations'));
    }

    const results = await Promise.all(requests);
    rooms.value = Array.isArray(results[0]) ? results[0] : [];
    resources.value = Array.isArray(results[1]) ? results[1] : [];
    users.value = Array.isArray(results[2]) ? results[2] : [];
    reservations.value = Array.isArray(results[3]) ? results[3] : [];
    
    if (props.user.role === 'admin' && results[4]) {
      organizations.value = Array.isArray(results[4]) ? results[4] : [];
    }
  } catch (err) {
    console.error('Erro ao buscar dados administrativos:', err);
  } finally {
    loading.value = false;
  }
};

// Criação de uma nova sala
const handleAddRoom = async () => {
  // Limpa erros anteriores
  roomErrors.value = { name: '', capacity: '', location: '', description: '', image_url: '', google_meet_url: '' };
  roomGeneralError.value = '';

  // Validação client-side
  let hasError = false;
  if (!roomForm.value.name.trim()) {
    roomErrors.value.name = 'O nome da sala é obrigatório';
    hasError = true;
  }
  
  if (roomForm.value.type === 'physical') {
    if (!roomForm.value.capacity || roomForm.value.capacity <= 0) {
      roomErrors.value.capacity = 'A capacidade deve ser maior que zero';
      hasError = true;
    }
    if (!roomForm.value.location.trim()) {
      roomErrors.value.location = 'A localização é obrigatória';
      hasError = true;
    }
  }
  
  if (hasError) return;

  try {
    await api.post('/rooms', roomForm.value);
    alert('Sala adicionada com sucesso!');
    roomForm.value = { name: '', capacity: 0, location: '', description: '', image_url: '', google_meet_url: '', type: 'physical' };
    isTypeSelected.value = false;
    fetchAdminData(); // Atualiza a lista após adicionar
  } catch (err: any) { 
    roomGeneralError.value = 'Erro ao adicionar sala: ' + (err.message || 'Erro desconhecido');
    console.error(err); 
  }
};

// Edição de sala
const openEditModal = (room: Room) => {
  editingRoom.value = room;
  editForm.value = { 
    name: room.name, 
    capacity: room.capacity, 
    location: room.location, 
    description: room.description || '', 
    image_url: room.image_url || '',
    google_meet_url: room.google_meet_url || '',
    type: room.type || 'physical'
  };
  editErrors.value = { name: '', capacity: '', location: '', description: '', image_url: '', google_meet_url: '' };
  editGeneralError.value = '';
  showEditModal.value = true;
};

const handleUpdateRoom = async () => {
  if (!editingRoom.value) return;

  // Limpa erros anteriores
  editErrors.value = { name: '', capacity: '', location: '', description: '', image_url: '', google_meet_url: '' };
  editGeneralError.value = '';

  // Validação client-side
  let hasError = false;
  if (!editForm.value.name.trim()) {
    editErrors.value.name = 'O nome da sala é obrigatório';
    hasError = true;
  }
  
  if (editForm.value.type === 'physical') {
    if (!editForm.value.capacity || editForm.value.capacity <= 0) {
      editErrors.value.capacity = 'A capacidade deve ser maior que zero';
      hasError = true;
    }
    if (!editForm.value.location.trim()) {
      editErrors.value.location = 'A localização é obrigatória';
      hasError = true;
    }
  }
  
  if (hasError) return;

  try {
    await api.put(`/rooms/${editingRoom.value.id}`, editForm.value);
    alert('Sala atualizada com sucesso!');
    showEditModal.value = false;
    fetchAdminData();
  } catch (err: any) {
    editGeneralError.value = 'Erro ao atualizar sala: ' + (err.message || 'Erro desconhecido');
    console.error(err);
  }
};

// Exclusão de uma sala existente
const handleDeleteRoom = async (id: number) => {
  console.log('handleDeleteRoom chamado com ID:', id);
  if (!confirm('Tem certeza que deseja excluir esta sala?')) return;
  try {
    console.log('Enviando requisição DELETE para /rooms/' + id);
    const response = await api.delete(`/rooms/${id}`);
    console.log('Resposta da exclusão:', response);
    alert('Sala excluída com sucesso!');
    fetchAdminData();
  } catch (err: any) { 
    console.error('Erro na exclusão da sala:', err);
    alert('Erro ao excluir sala: ' + err.message);
  }
};

// Criação de um novo recurso (ex: Projetor, TV)
const handleAddResource = async () => {
  try {
    await api.post('/resources', resForm.value);
    alert('Recurso adicionado com sucesso!');
    resForm.value = { name: '', description: '', icon: 'Box' };
    fetchAdminData();
  } catch (err: any) { 
    alert('Erro ao adicionar recurso: ' + err.message);
    console.error(err); 
  }
};

// Exclusão de um recurso
const handleDeleteResource = async (id: number) => {
  console.log('handleDeleteResource chamado com ID:', id);
  if (!confirm('Tem certeza que deseja excluir este recurso?')) return;
  try {
    console.log('Enviando requisição DELETE para /resources/' + id);
    const response = await api.delete(`/resources/${id}`);
    console.log('Resposta da exclusão:', response);
    alert('Recurso excluído com sucesso!');
    fetchAdminData();
  } catch (err: any) { 
    console.error('Erro na exclusão do recurso:', err);
    alert('Erro ao excluir recurso: ' + err.message);
  }
};

// Cancelamento de qualquer reserva (Ação de Admin)
const handleDeleteReservation = async (id: number) => {
  console.log('handleDeleteReservation chamado com ID:', id);
  if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
  try {
    console.log('Enviando requisição DELETE para /reservations/' + id);
    const response = await api.delete(`/reservations/${id}`);
    console.log('Resposta do cancelamento:', response);
    alert('Reserva cancelada com sucesso!');
    fetchAdminData();
  } catch (err: any) { 
    console.error('Erro no cancelamento da reserva:', err);
    alert('Erro ao cancelar reserva: ' + err.message);
  }
};

// Exclusão de um usuário do sistema
const handleDeleteUser = async (id: number) => {
  console.log('handleDeleteUser chamado com ID:', id);
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
  try {
    console.log('Enviando requisição DELETE para /users/' + id);
    const response = await api.delete(`/users/${id}`);
    console.log('Resposta da exclusão:', response);
    alert('Usuário excluído com sucesso!');
    fetchAdminData();
  } catch (err: any) { 
    console.error('Erro na exclusão do usuário:', err);
    alert('Erro ao excluir usuário: ' + err.message);
  }
};
</script>
