<template>
  <NuxtLayout name="dashboard">
    <div class="post-details-page">
      <div class="page-header">
        <NuxtLink to="/dashboard/posts" class="back-link">
          <ChevronLeft :size="20" />
          Retour aux posts
        </NuxtLink>
        <div class="header-actions">
           <BaseButton variant="danger" size="sm" @click="handleDelete" :loading="deleting">
            <Trash2 :size="16" />
            Supprimer
          </BaseButton>
        </div>
      </div>

      <div v-if="loading" class="loading-state glass">
        <div class="spinner"></div>
        <p>Chargement du post...</p>
      </div>

      <div v-else-if="post" class="details-grid animate-fade-in">
        <!-- Editor Section -->
        <div class="editor-section">
          <BaseCard>
            <template #header>
              <div class="card-header-flex">
                <h3>Édition du Post</h3>
                <span class="status-pill" :class="post.status.toLowerCase()">{{ post.status }}</span>
              </div>
            </template>

            <div class="form-content">
              <div class="info-section">
                <div class="info-item">
                  <User :size="16" />
                  <span>Compte: <strong>{{ post.account?.name }}</strong></span>
                </div>
                <div class="info-item">
                  <Calendar :size="16" />
                  <span>Date: {{ formatDate(post.createdAt) }}</span>
                </div>
              </div>

              <!-- AI Caption Info -->
              <div class="section-divider"></div>
              
              <div class="caption-editor">
                <label>Légende</label>
                <div v-if="!post.aiCaption && !post.editedCaption" class="ai-generating glass">
                  <RefreshCw :size="32" class="spin" />
                  <p>L'IA génère votre légende... Elle apparaîtra ici automatiquement.</p>
                </div>
                <div v-else>
                   <textarea 
                    v-model="editedCaption"
                    class="custom-textarea"
                    rows="10"
                    placeholder="La légende apparaîtra ici..."
                  ></textarea>
                  <p class="hint">Modifiez la légende générée ci-dessus pour la personnaliser avant publication.</p>
                </div>
              </div>

              <!-- Scheduling Section -->
              <div v-if="post.status === 'draft' || post.status === 'scheduled'" class="scheduling-section">
                <div class="section-divider"></div>
                <div class="form-group">
                  <label>Date et heure de publication</label>
                  <input 
                    type="datetime-local" 
                    v-model="scheduledAt" 
                    class="custom-input"
                    :min="minDateTime"
                  />
                  <p class="hint">Sélectionnez le moment où vous souhaitez que ce post soit publié.</p>
                </div>
              </div>

              <div class="form-actions">
                <BaseButton @click="handleSave" :loading="saving" :disabled="!post.aiCaption && !post.editedCaption">
                  <Save :size="16" />
                  Enregistrer les modifications
                </BaseButton>
                <BaseButton 
                  variant="outline" 
                  v-if="post.status === 'draft'" 
                  @click="handleSchedule" 
                  :loading="scheduling"
                  :disabled="!scheduledAt || (!post.aiCaption && !post.editedCaption)"
                >
                  <Calendar :size="16" />
                  Programmer
                </BaseButton>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Preview Section -->
        <div class="preview-section">
           <h3 class="preview-title">Aperçu Final</h3>
           <div class="linkedin-preview glass">
              <div class="preview-header">
                <div class="preview-avatar">{{ post.account?.name[0] }}</div>
                <div class="preview-user-meta">
                  <div class="preview-name">{{ post.account?.name }}</div>
                  <div class="preview-sub">LinkedIn Automation • Maintenant</div>
                </div>
              </div>
              <div class="preview-body">
                <div class="preview-text">
                  {{ editedCaption || post.aiCaption || 'Légende en cours de génération...' }}
                </div>
                <div class="preview-image">
                  <img :src="post.imageUrl" alt="Post content" />
                </div>
              </div>
              <div class="preview-footer">
                <div class="footer-action"><ThumbsUp :size="14" /> J'aime</div>
                <div class="footer-action"><MessageSquare :size="14" /> Commenter</div>
                <div class="footer-action"><Share2 :size="14" /> Partager</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { 
  ChevronLeft, 
  Trash2, 
  User, 
  Calendar, 
  ThumbsUp, 
  MessageSquare, 
  Share2,
  RefreshCw,
  Save
} from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const post = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const scheduling = ref(false)
const deleting = ref(false)
const editedCaption = ref('')
const scheduledAt = ref('')

const minDateTime = computed(() => {
  const now = new Date()
  return now.toISOString().slice(0, 16)
})

const fetchPost = async () => {
  try {
    const data = await $fetch<any>(`/api/posts/${route.params.id}`)
    post.value = data
    editedCaption.value = data.editedCaption || data.aiCaption || ''
    if (data.scheduledAt) {
      scheduledAt.value = new Date(data.scheduledAt).toISOString().slice(0, 16)
    }
  } catch (e) {
    console.error('Failed to fetch post', e)
    navigateTo('/dashboard/posts')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    await $fetch(`/api/posts/${post.value.id}`, {
      method: 'PATCH',
      body: { 
        editedCaption: editedCaption.value,
        scheduledAt: scheduledAt.value ? new Date(scheduledAt.value).toISOString() : null
      }
    })
    alert('Modification enregistrée !')
  } catch (e) {
    alert('Erreur lors de la sauvegarde.')
  } finally {
    saving.value = false
  }
}

const handleSchedule = async () => {
  if (!scheduledAt.value) {
    alert('Veuillez sélectionner une date et heure.')
    return
  }

  scheduling.value = true
  try {
    await $fetch(`/api/posts/${post.value.id}`, {
      method: 'PATCH',
      body: { 
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt.value).toISOString(),
        editedCaption: editedCaption.value
      }
    })
    await fetchPost()
    alert('Post programmé !')
  } catch (e) {
    alert('Erreur lors de la programmation.')
  } finally {
    scheduling.value = false
  }
}

const handleDelete = async () => {
  if (confirm('Supprimer ce post définitivement ?')) {
    deleting.value = true
    try {
      await $fetch(`/api/posts/${post.value.id}`, { method: 'DELETE' })
      navigateTo('/dashboard/posts')
    } catch (e) {
      alert('Erreur lors de la suppression.')
    } finally {
      deleting.value = false
    }
  }
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString))
}

// Poll for AI caption if it's currently empty
let pollInterval: any = null
watchEffect(() => {
  if (post.value && !post.value.aiCaption && !pollInterval) {
    pollInterval = setInterval(fetchPost, 5000)
  } else if (post.value?.aiCaption && pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

onMounted(fetchPost)
</script>

<style scoped>
.post-details-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2.5rem;
  align-items: start;
}

.card-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-pill {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  text-transform: uppercase;
}

.status-pill.scheduled { color: var(--accent-primary); background: rgba(59, 130, 246, 0.1); }
.status-pill.published { color: var(--success); background: rgba(34, 197, 94, 0.1); }
.status-pill.draft { color: var(--text-secondary); background: rgba(255, 255, 255, 0.05); }

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section {
  display: flex;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.section-divider {
  height: 1px;
  background: var(--border-glass);
}

.caption-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.caption-editor label {
  font-weight: 500;
  font-size: 0.9375rem;
}

.ai-generating {
  padding: 2rem;
  border-radius: 0.75rem;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.spin {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.scheduling-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9375rem;
}

.custom-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  transition: all var(--transition-fast);
}

.custom-input:focus {
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.08);
}

.hint {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
}

/* Preview Styles */
.preview-title {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.linkedin-preview {
  background: rgba(255, 255, 255, 0.02);
}

.preview-header {
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
}

.preview-avatar {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
}

.preview-name {
  font-weight: 600;
  font-size: 0.9375rem;
}

.preview-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.preview-body {
  padding: 0 1rem 1rem;
}

.preview-text {
  font-size: 0.875rem;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.preview-image img {
  width: calc(100% + 2rem);
  margin-left: -1rem;
  display: block;
}

.preview-footer {
  display: flex;
  padding: 0.5rem;
  border-top: 1px solid var(--border-glass);
}

.footer-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  padding: 0.5rem;
}

.loading-state {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 
  0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
  50% { opacity: 1; transform: scaleX(1); }
}

@media (max-width: 1000px) {
  .details-grid { grid-template-columns: 1fr; }
}
</style>
