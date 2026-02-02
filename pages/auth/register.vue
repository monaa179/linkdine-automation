<template>
  <AuthLayout>
    <form class="auth-form" @submit.prevent="handleRegister">
      <div class="header">
        <h2>Créer un compte</h2>
        <p>Commencez à automatiser vos posts dès maintenant.</p>
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
        <BaseInput
          v-model="form.confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          :icon="ShieldCheck"
          required
        />
      </div>

      <div class="actions">
        <BaseButton type="submit" :loading="loading" block class="submit-btn">
          S'inscrire
        </BaseButton>
        <p class="footer-text">
          Déjà un compte ? 
          <NuxtLink to="/auth/login" class="link">Se connecter</NuxtLink>
        </p>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { Mail, Lock, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth']
})

const { register } = useAuth()
const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  loading.value = true
  error.value = ''
  
  const result = await register({
    email: form.email,
    password: form.password
  })
  
  if (result.success) {
    navigateTo('/dashboard')
  } else {
    error.value = result.error || "L'inscription a échoué"
    loading.value = false
  }
}
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
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
  gap: 1rem;
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
