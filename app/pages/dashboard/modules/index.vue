<template>
  <NuxtLayout name="dashboard">
    <div class="modules-page">
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Gestion des modules</h1>
          <p class="subtitle">Gérez vos modules de génération de contenu avec des prompts personnalisés.</p>
        </div>
        <BaseButton @click="openAddModal">
          <Plus :size="18" />
          Ajouter un module
        </BaseButton>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else class="modules-table-container glass">
        <table class="modules-table">
          <thead>
            <tr>
              <th>Nom du module</th>
              <th>Prompt</th>
              <th>Posts associés</th>
              <th>Date de création</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="module in modules" :key="module.id">
              <td>
                <div class="module-name">
                  <div class="module-icon">
                    <FileText :size="18" />
                  </div>
                  <span class="name">{{ module.name }}</span>
                </div>
              </td>
              <td>
                <div class="script-preview">{{ truncateScript(module.script) }}</div>
              </td>
              <td>
                <span class="post-count">{{ module._count.posts }} post{{ module._count.posts > 1 ? 's' : '' }}</span>
              </td>
              <td>{{ formatDate(module.createdAt) }}</td>
              <td class="actions-col">
                <div class="actions-group">
                  <button class="icon-btn edit" @click="openEditModal(module)" title="Modifier">
                    <Settings :size="18" />
                  </button>
                  <button class="icon-btn delete" @click="confirmDelete(module)" title="Supprimer">
                    <Trash2 :size="18" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Module Modal -->
      <BaseModal 
        v-if="showModal" 
        :title="isEditing ? 'Modifier le module' : 'Nouveau module'" 
        @close="closeModal"
      >
        <form @submit.prevent="handleSubmit" class="module-form">
          <BaseInput 
            v-model="form.name" 
            label="Nom du module" 
            type="text" 
            required 
            placeholder="Ex: Posts LinkedIn professionnels"
          />
          
          <div class="base-textarea-container">
            <label class="label">Prompt / Script</label>
            <textarea 
              v-model="form.script" 
              class="textarea" 
              rows="8"
              required
              placeholder="Décrivez le prompt qui sera utilisé pour générer le contenu de ce module..."
            ></textarea>
            <p class="hint">Ce prompt sera utilisé pour générer les légendes des posts associés à ce module.</p>
          </div>

          <div class="form-actions">
            <BaseButton type="submit" variant="primary" block :loading="submitting">
              {{ isEditing ? 'Mettre à jour' : 'Créer le module' }}
            </BaseButton>
          </div>
        </form>
      </BaseModal>

      <!-- Confirmation Modal -->
      <BaseConfirmModal
        :show="confirmModal.show"
        :title="confirmModal.title"
        :message="confirmModal.message"
        :variant="confirmModal.variant"
        :confirm-text="confirmModal.confirmText"
        :loading="confirmModal.loading"
        @confirm="confirmModal.onConfirm"
        @cancel="confirmModal.show = false"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Plus, Trash2, Settings, FileText } from 'lucide-vue-next'
import BaseConfirmModal from '~/components/BaseConfirmModal.vue'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const loading = ref(true)
const submitting = ref(false)
const modules = ref<any[]>([])

const showModal = ref(false)
const isEditing = ref(false)
const currentModuleId = ref<number | null>(null)

// Confirmation Modal State
const confirmModal = reactive({
  show: false,
  title: '',
  message: '',
  variant: 'primary',
  confirmText: 'Confirmer',
  loading: false,
  onConfirm: () => {}
})

const form = reactive({
  name: '',
  script: ''
})

const fetchModules = async () => {
  loading.value = true
  try {
    modules.value = await $fetch('/api/modules')
  } catch (e) {
    console.error('Failed to fetch modules', e)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  currentModuleId.value = null
  form.name = ''
  form.script = ''
  showModal.value = true
}

const openEditModal = (module: any) => {
  isEditing.value = true
  currentModuleId.value = module.id
  form.name = module.name
  form.script = module.script
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEditing.value) {
      await $fetch(`/api/modules/${currentModuleId.value}`, {
        method: 'PATCH',
        body: form
      })
    } else {
      await $fetch('/api/modules', {
        method: 'POST',
        body: form
      })
    }
    await fetchModules()
    closeModal()
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Une erreur est survenue')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (module: any) => {
  confirmModal.title = 'Supprimer le module'
  confirmModal.message = `Êtes-vous sûr de vouloir supprimer le module "${module.name}" ? Les posts associés ne seront pas supprimés mais ne seront plus liés à ce module.`
  confirmModal.variant = 'danger'
  confirmModal.confirmText = 'Supprimer'
  confirmModal.onConfirm = async () => {
    confirmModal.loading = true
    try {
      await $fetch(`/api/modules/${module.id}`, { method: 'DELETE' })
      await fetchModules()
      confirmModal.show = false
    } catch (e: any) {
      alert(e.data?.statusMessage || 'Erreur lors de la suppression')
    } finally {
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
}

const truncateScript = (script: string) => {
  return script.length > 100 ? script.substring(0, 100) + '...' : script
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}

onMounted(() => {
  fetchModules()
})
</script>

<style scoped>
.modules-page {
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

.modules-table-container {
  overflow-x: auto;
  border-radius: 1.5rem;
  padding: 1rem;
}

.modules-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.modules-table th {
  padding: 1.25rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-glass);
}

.modules-table td {
  padding: 1.25rem 1rem;
  font-size: 0.9375rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.module-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.module-icon {
  width: 36px;
  height: 36px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.name {
  font-weight: 500;
}

.script-preview {
  color: var(--text-secondary);
  font-size: 0.875rem;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-count {
  font-size: 0.875rem;
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

.module-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-actions {
  margin-top: 1rem;
}

.base-textarea-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  color: var(--text-primary);
  padding: 0.75rem;
  width: 100%;
  outline: none;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.textarea:focus {
  border-color: var(--accent-primary);
}

.hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: -0.25rem;
}
</style>
