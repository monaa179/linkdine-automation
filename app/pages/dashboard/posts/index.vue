<template>
  <NuxtLayout name="dashboard">
    <div class="posts-page">
      <ClientOnly>
        <div class="page-header">
          <div class="header-content">
            <h1 class="title">Mes Posts</h1>
            <p v-if="currentAccount" class="subtitle">Gérez vos publications LinkedIn pour <strong>{{ currentAccount.name }}</strong>.</p>
            <p v-else class="subtitle">Gérez vos publications LinkedIn programmées et publiées.</p>
          </div>
          <NuxtLink v-if="currentAccountId" to="/dashboard/posts/create">
            <BaseButton>
              <Plus :size="18" />
              Créer un Post
            </BaseButton>
          </NuxtLink>
        </div>
      </ClientOnly>

      <!-- No Account Selected Overlay -->
      <div v-if="!currentAccountId && !loading" class="account-selector-overlay glass-heavy animate-fade-in">
        <div class="overlay-content">
          <div class="overlay-icon"><User :size="48" /></div>
          <h2>Aucun compte sélectionné</h2>
          <p>Choisissez un compte pour voir ses publications associées.</p>
          <NuxtLink to="/dashboard/accounts">
            <BaseButton variant="primary" size="lg">Voir les comptes</BaseButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters glass">
        <div class="filter-group">
          <button 
            v-for="s in statuses" 
            :key="s.value"
            class="filter-btn"
            :class="{ active: status === s.value }"
            @click="status = s.value"
          >
            {{ s.label }}
          </button>
        </div>
        
        <div class="search-field">
          <Search :size="18" />
          <input type="text" v-model="search" placeholder="Rechercher..." />
        </div>
      </div>

      <div v-if="loading" class="loading-grid">
        <div v-for="i in 6" :key="i" class="skeleton-post glass"></div>
      </div>

      <div v-else-if="posts.length === 0" class="empty-state glass animate-fade-in">
        <div class="empty-icon"><FileText :size="60" /></div>
        <h2>Aucun post trouvé</h2>
        <p>Commencez à créer du contenu engageant pour LinkedIn.</p>
        <NuxtLink to="/dashboard/posts/create">
          <BaseButton variant="primary" size="lg">Créer mon premier post</BaseButton>
        </NuxtLink>
      </div>

      <div v-else class="posts-grid">
        <BaseCard v-for="post in posts" :key="post.id" class="post-card" interactive @click="viewPost(post)">
          <div class="post-image-wrapper">
            <img :src="post.imageUrl" :alt="post.aiCaption || 'LinkedIn post image'" class="post-image" />
            <div class="status-badge" :class="post.status.toLowerCase()">
              {{ post.status === 'draft' ? 'Brouillon' : post.status === 'scheduled' ? 'Programmé' : 'Publié' }}
            </div>
          </div>
          
          <div class="post-content">
            <div v-if="post.status === 'draft' && !post.aiCaption && !post.editedCaption" class="caption-loading">
              <RefreshCw :size="20" class="spin" />
              <span>Génération de la légende...</span>
            </div>
            <p v-else class="post-caption">{{ post.editedCaption || post.aiCaption }}</p>
            
            <div class="post-actions" v-if="post.status === 'draft'">
              <BaseButton variant="primary" size="sm" class="cta-btn">
                <Edit :size="14" />
                Editer & Programmer
              </BaseButton>
            </div>

            <div class="post-meta">
              <div class="meta-item">
                <Calendar :size="14" />
                <span>{{ post.scheduledAt ? formatDate(post.scheduledAt) : formatDate(post.createdAt) }}</span>
              </div>
              <div class="meta-item" v-if="post.account">
                <User :size="14" />
                <span>{{ post.account.name }}</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Plus, Search, FileText, Calendar, User, RefreshCw, Edit, Link2 } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const { currentAccountId, currentAccount, fetchCurrentAccount } = useCurrentAccount()
const loading = ref(true)
const posts = ref<any[]>([])
const status = ref('all')
const search = ref('')

const statuses = [
  { label: 'Tous', value: 'all' },
  { label: 'Programmés', value: 'scheduled' },
  { label: 'Publiés', value: 'published' },
  { label: 'Brouillons', value: 'draft' },
]

const fetchPosts = async (showLoading = true) => {
  if (showLoading) loading.value = true
  try {
    if (currentAccountId.value) {
      await fetchCurrentAccount()
      const data = await $fetch<any[]>(`/api/posts?accountId=${currentAccountId.value}`)
      posts.value = data
    } else {
      posts.value = []
    }
    
    // If any post is in draft and missing caption, start polling
    checkPolling()
  } catch (e) {
    console.error('Failed to fetch posts', e)
  } finally {
    if (showLoading) loading.value = false
  }
}

let pollInterval: any = null

const checkPolling = () => {
  const needsPolling = posts.value.some(p => p.status === 'draft' && !p.aiCaption && !p.editedCaption)
  
  if (needsPolling && !pollInterval) {
    pollInterval = setInterval(() => {
      fetchPosts(false)
    }, 5000)
  } else if (!needsPolling && pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

const viewPost = (post: any) => {
  navigateTo(`/dashboard/posts/${post.id}`)
}

watch([status], () => fetchPosts())

onMounted(fetchPosts)
</script>

<style scoped>
.posts-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--accent-primary);
  color: white;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.75rem;
  width: 250px;
}

.search-field input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
  width: 100%;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.post-card {
  padding: 0 !important;
}

.post-image-wrapper {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.post-card:hover .post-image {
  transform: scale(1.05);
}

.status-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-badge.scheduled { background: rgba(59, 130, 246, 0.8); color: white; }
.status-badge.published { background: rgba(34, 197, 94, 0.8); color: white; }
.status-badge.draft { background: rgba(0, 0, 0, 0.6); color: white; }

.post-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-caption {
  font-size: 0.9375rem;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 3em;
}

.caption-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 0;
  color: var(--accent-primary);
  font-size: 0.8125rem;
  min-height: 3em;
}

.spin {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.post-actions {
  margin-top: 0.5rem;
}

.cta-btn {
  width: 100%;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-glass);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skeleton-post {
  height: 300px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.account-selector-overlay {
  position: fixed;
  top: 100px;
  left: 310px;
  right: 30px;
  bottom: 30px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2rem;
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.4);
}

.overlay-content {
  text-align: center;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: 2rem;
}

.overlay-icon {
  width: 80px;
  height: 80px;
  background: var(--accent-gradient);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 0.5rem;
}

@media (max-width: 1024px) {
  .account-selector-overlay {
    left: 30px;
  }
}

.empty-state {
  padding: 5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  border: 1px dashed var(--border-glass);
}
</style>
