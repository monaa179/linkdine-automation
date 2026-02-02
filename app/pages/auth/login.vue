<template>
  <AuthLayout>
    <form class="auth-form" @submit.prevent="handleLogin">
      <div class="header">
        <h2>Bon retour !</h2>
        <p>Connectez-vous pour gérer vos posts.</p>
      </div>

      <div v-if="error" class="error-alert">{{ error }}</div>

      <div class="fields">
        <BaseInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="votre@email.com"
          :icon="Mail"
          required
        />
        <BaseInput
          v-model="form.password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          :icon="Lock"
          required
        />
      </div>

      <div class="actions">
        <BaseButton type="submit" :loading="loading" block class="submit-btn">
          Se connecter
        </BaseButton>
        <p class="footer-text">
          Pas encore de compte ? 
          <NuxtLink to="/auth/register" class="link">S'inscrire</NuxtLink>
        </p>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { Mail, Lock } from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth']
})

const { login } = useAuth()
const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  const result = await login(form)
  
  if (result.success) {
    navigateTo('/dashboard')
  } else {
    error.value = result.error || 'Connexion échouée'
    loading.value = false
  }
}
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.header p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.error-alert {
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--error);
  color: var(--error);
  border-radius: 0.75rem;
  font-size: 0.875rem;
}

.footer-text {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.link {
  color: var(--accent-primary);
  font-weight: 500;
}

.submit-btn {
  width: 100%;
}
</style>
