<template>
  <NuxtLayout name="dashboard">
    <div class="users-page">
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Gestion des utilisateurs</h1>
          <p class="subtitle">Gérez les accès et les rôles de votre équipe.</p>
        </div>
        <BaseButton @click="openAddModal">
          <UserPlus :size="18" />
          Ajouter un utilisateur
        </BaseButton>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else class="users-table-container glass">
        <table class="users-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Date de création</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" :class="{ 'is-me': u.id === user?.id }">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ u.email[0].toUpperCase() }}</div>
                  <div class="user-meta">
                    <span class="email">{{ u.email }}</span>
                    <span v-if="u.id === user?.id" class="me-badge">Vous</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="u.role">
                  {{ u.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}
                </span>
              </td>
              <td>{{ formatDate(u.createdAt) }}</td>
              <td class="actions-col">
                <div class="actions-group">
                  <button class="icon-btn edit" @click="openEditModal(u)" title="Modifier">
                    <Settings :size="18" />
                  </button>
                  <button 
                    v-if="u.id !== user?.id" 
                    class="icon-btn delete" 
                    @click="confirmDelete(u)" 
                    title="Supprimer"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit User Modal -->
      <BaseModal 
        v-if="showModal" 
        :title="isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'" 
        @close="closeModal"
      >
        <form @submit.prevent="handleSubmit" class="user-form">
          <BaseInput 
            v-model="form.email" 
            label="Adresse Email" 
            type="email" 
            required 
            :disabled="isEditing"
          />
          <BaseInput 
            v-model="form.password" 
            label="Mot de passe" 
            :placeholder="isEditing ? 'Laisser vide pour ne pas changer' : '••••••••'" 
            :required="!isEditing"
          />
          
          <div class="base-select-container">
            <label class="label">Rôle</label>
            <select v-model="form.role" class="select">
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div class="form-actions">
            <BaseButton type="submit" variant="primary" block :loading="submitting">
              {{ isEditing ? 'Mettre à jour' : 'Créer l\'utilisateur' }}
            </BaseButton>
          </div>
        </form>
      </BaseModal>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { UserPlus, Trash2, Settings } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const { user } = useAuth()
const loading = ref(true)
const submitting = ref(false)
const users = ref<any[]>([])

const showModal = ref(false)
const isEditing = ref(false)
const currentUserId = ref<number | null>(null)

const form = reactive({
  email: '',
  password: '',
  role: 'user'
})

const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await $fetch('/api/users')
  } catch (e) {
    console.error('Failed to fetch users', e)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  currentUserId.value = null
  form.email = ''
  form.password = ''
  form.role = 'user'
  showModal.value = true
}

const openEditModal = (u: any) => {
  isEditing.value = true
  currentUserId.value = u.id
  form.email = u.email
  form.password = ''
  form.role = u.role
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEditing.value) {
      await $fetch(`/api/users/${currentUserId.value}`, {
        method: 'PATCH',
        body: {
          password: form.password || undefined,
          role: form.role
        }
      })
    } else {
      await $fetch('/api/users', {
        method: 'POST',
        body: form
      })
    }
    await fetchUsers()
    closeModal()
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Une erreur est survenue')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async (u: any) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${u.email} ?`)) {
    try {
      await $fetch(`/api/users/${u.id}`, { method: 'DELETE' })
      await fetchUsers()
    } catch (e: any) {
      alert(e.data?.statusMessage || 'Erreur lors de la suppression')
    }
  }
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}

onMounted(() => {
  if (user.value?.role !== 'admin') {
    navigateTo('/dashboard')
    return
  }
  fetchUsers()
})
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
}

.users-table-container {
  overflow-x: auto;
  border-radius: 1.5rem;
  padding: 1rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.users-table th {
  padding: 1.25rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-glass);
}

.users-table td {
  padding: 1.25rem 1rem;
  font-size: 0.9375rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.users-table tr.is-me {
  background: rgba(59, 130, 246, 0.03);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: #334155;
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8125rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.email {
  font-weight: 500;
}

.me-badge {
  font-size: 0.6875rem;
  color: var(--accent-primary);
  font-weight: 600;
}

.role-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.role-badge.admin {
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
}

.role-badge.user {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.actions-col {
  text-align: right;
  width: 100px;
}

.actions-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.icon-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-actions {
  margin-top: 1rem;
}

.select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  color: var(--text-primary);
  padding: 0.75rem;
  width: 100%;
  outline: none;
  font-size: 0.9375rem;
}

.select:focus {
  border-color: var(--accent-primary);
}
</style>
