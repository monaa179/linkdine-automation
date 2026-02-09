<template>
  <NuxtLayout name="dashboard">
    <div class="feed-page">
      <div class="page-header">
        <NuxtLink to="/dashboard/accounts" class="back-link">
          <ChevronLeft :size="20" />
          Retour aux comptes
        </NuxtLink>
        <h1 class="title">Feed : {{ account?.name }}</h1>
        <p class="subtitle">Visualisez et modifiez les publications générées par l'IA.</p>
      </div>

      <div v-if="loading" class="loading-grid">
        <div v-for="i in 3" :key="i" class="skeleton-post glass"></div>
      </div>

      <div v-else-if="feedPosts.length === 0" class="empty-feed glass">
        <LayoutPanelLeft :size="48" />
        <p>Votre feed est vide. Générez des captions depuis la galerie pour voir vos publications ici.</p>
        <NuxtLink :to="`/dashboard/accounts/${accountId}/gallery`">
          <BaseButton variant="primary">Aller à la Galerie</BaseButton>
        </NuxtLink>
      </div>

      <div v-else class="feed-list">
        <div v-for="post in feedPosts" :key="post.id" class="feed-item glass animate-fade-in">
          <div class="feed-image">
            <img :src="post.imageUrl" alt="Post image" />
          </div>
          <div class="feed-editor">
            <div class="editor-header">
              <div class="date-badge-container">
                <input 
                  type="datetime-local" 
                  class="date-input-hidden" 
                  :id="'date-' + post.id"
                  @change="(e) => updateDate(post, (e.target as HTMLInputElement).value)"
                />
                <label :for="'date-' + post.id" class="date-badge" :class="{ scheduled: post.scheduledAt, warning: !post.scheduledAt }">
                  <Calendar :size="14" />
                  <span>{{ post.scheduledAt ? 'Prévu le ' + formatDate(post.scheduledAt) : 'Non planifié' }}</span>
                  <Edit3 :size="12" class="edit-icon" />
                </label>
              </div>
              <div class="item-actions">
                 <button class="delete-icon" @click="deletePost(post.id)">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
            
            <BaseTextArea 
              v-model="post.editedCaption" 
              label="Légende (IA)" 
              placeholder="Modifier la légende..." 
              :rows="8"
            />
            
            <div class="editor-footer">
              <div class="footer-left">
                <span v-if="post.saving" class="saving-badge">Sauvegarde...</span>
                <span v-else-if="post.saved" class="saved-badge">Enregistré !</span>
              </div>

              <div class="footer-right">
                <BaseButton 
                  v-if="post.status !== 'published'"
                  size="sm" 
                  variant="primary"
                  @click="publishNow(post)" 
                  :loading="post.publishing"
                >
                  <Send :size="16" />
                  Publier
                </BaseButton>
                <div v-else class="published-tag">
                  <CheckCircle2 :size="16" />
                  Publié
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation Modals -->
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
import { 
  ChevronLeft, 
  LayoutPanelLeft, 
  Trash2, 
  Save, 
  CheckCircle2,
  Calendar,
  Send,
  Edit3
} from 'lucide-vue-next'
import BaseConfirmModal from '~/components/BaseConfirmModal.vue'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const accountId = parseInt(route.params.accountId as string)

const account = ref<any>(null)
const feedPosts = ref<any[]>([])
const loading = ref(true)

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

const fetchAccountData = async () => {
  loading.value = true
  try {
    account.value = await $fetch(`/api/accounts/${accountId}`)
    const allPosts = await $fetch<any[]>(`/api/posts?accountId=${accountId}`)
    // Feed = posts with AI caption
    feedPosts.value = allPosts
      .filter(p => p.aiCaption || p.editedCaption)
      .map(p => ({
        ...p,
        editedCaption: p.editedCaption || p.aiCaption || '',
        saving: false,
        saved: false,
        publishing: false
      }))
  } catch (e) {
    console.error('Failed to fetch account data', e)
  } finally {
    loading.value = false
  }
}

// Auto-save logic
watch(feedPosts, (newPosts) => {
  newPosts.forEach(post => {
    // We use a simple way to detect changes: if the post is not currently saving and not already saved
    // Actually, we need to track the individual values.
  })
}, { deep: true })

const saveCaption = async (post: any) => {
  if (post.saving) return
  post.saving = true
  post.saved = false
  try {
    await $fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      body: { 
        editedCaption: post.editedCaption,
        status: post.status // Maintain status
      }
    })
    post.saved = true
    setTimeout(() => { post.saved = false }, 3000)
  } catch (e) {
    console.error('Failed to save caption', e)
  } finally {
    post.saving = false
  }
}

// Add watchers for each post
watch(() => feedPosts.value, (newVal, oldVal) => {
  newVal.forEach((post, index) => {
    const oldPost = oldVal && oldVal[index]
    if (oldPost && post.editedCaption !== oldPost.editedCaption) {
      saveCaption(post)
    }
  })
}, { deep: true })

const updateDate = async (post: any, newDate: string) => {
  if (!newDate) return
  try {
    const data = await $fetch<any>(`/api/posts/${post.id}`, {
      method: 'PATCH',
      body: { 
        scheduledAt: new Date(newDate).toISOString(),
        status: 'scheduled'
      }
    })
    post.scheduledAt = data.scheduledAt
    post.status = 'scheduled'
  } catch (e) {
    console.error('Failed to update date', e)
  }
}

const publishNow = (post: any) => {
  confirmModal.title = 'Publier sur LinkedIn'
  confirmModal.message = 'Voulez-vous vraiment publier ce post maintenant sur LinkedIn ? Cette action est immédiate.'
  confirmModal.variant = 'success'
  confirmModal.confirmText = 'Publier maintenant'
  confirmModal.onConfirm = async () => {
    confirmModal.loading = true
    post.publishing = true
    try {
      const data = await $fetch<any>(`/api/posts/${post.id}/publish`, {
        method: 'POST'
      })
      post.status = 'published'
      post.publishedAt = data.publishedAt
      confirmModal.show = false
    } catch (e) {
      console.error('Failed to publish', e)
      alert('Erreur lors de la publication. Vérifiez le scénario Make.com.')
    } finally {
      post.publishing = false
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
}

const deletePost = (id: number) => {
  confirmModal.title = 'Supprimer la publication'
  confirmModal.message = 'Êtes-vous sûr de vouloir supprimer cette publication du feed ?'
  confirmModal.variant = 'danger'
  confirmModal.confirmText = 'Supprimer'
  confirmModal.onConfirm = async () => {
    confirmModal.loading = true
    try {
      await $fetch(`/api/posts/${id}`, { method: 'DELETE' })
      await fetchAccountData()
      confirmModal.show = false
    } catch (e) {
      alert('Erreur lors de la suppression.')
    } finally {
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString))
}

onMounted(fetchAccountData)
</script>

<style scoped>
.feed-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--accent-primary);
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.feed-item {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  padding: 1.5rem;
  border-radius: 1.5rem;
  overflow: hidden;
}

.feed-image {
  border-radius: 1rem;
  overflow: hidden;
  height: 350px;
}

.feed-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feed-editor {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-badge-container {
  position: relative;
}

.date-input-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-badge:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.date-badge.scheduled {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-primary);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.date-badge.warning {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.edit-icon {
  opacity: 0.5;
  margin-left: 0.25rem;
}

.published-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
}

.date-badge span {
  font-weight: 500;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.delete-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all var(--transition-fast);
}

.delete-icon:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}


.saved-badge {
  color: var(--accent-primary);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.empty-feed {
  padding: 5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  color: var(--text-secondary);
}

.loading-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-post {
  height: 380px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

@media (max-width: 900px) {
  .feed-item {
    grid-template-columns: 1fr;
  }
  .feed-image {
    height: 300px;
  }
}
</style>
