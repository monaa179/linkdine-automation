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
              <span class="date">{{ formatDate(post.createdAt) }}</span>
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
              <BaseButton 
                size="sm" 
                @click="saveCaption(post)" 
                :loading="post.saving"
              >
                <Save :size="16" />
                Enregistrer
              </BaseButton>
              <span v-if="post.saved" class="saved-badge">Enregistré !</span>
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
  LayoutPanelLeft, 
  Trash2, 
  Save, 
  CheckCircle2 
} from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const accountId = parseInt(route.params.accountId as string)

const account = ref<any>(null)
const feedPosts = ref<any[]>([])
const loading = ref(true)

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
        saved: false
      }))
  } catch (e) {
    console.error('Failed to fetch account data', e)
  } finally {
    loading.value = false
  }
}

const saveCaption = async (post: any) => {
  post.saving = true
  post.saved = false
  try {
    await $fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      body: { 
        editedCaption: post.editedCaption
      }
    })
    post.saved = true
    setTimeout(() => { post.saved = false }, 3000)
  } catch (e) {
    alert('Erreur lors de la sauvegarde.')
  } finally {
    post.saving = false
  }
}

const deletePost = async (id: number) => {
  if (!confirm('Supprimer cette publication du feed ?')) return
  try {
    await $fetch(`/api/posts/${id}`, { method: 'DELETE' })
    await fetchAccountData()
  } catch (e) {
    alert('Erreur lors de la suppression.')
  }
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

.date {
  font-size: 0.875rem;
  color: var(--text-secondary);
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

.editor-footer {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: auto;
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
