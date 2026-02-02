<template>
  <div class="gateway-container">
    <div class="loader"></div>
  </div>
</template>

<script setup lang="ts">
const { user, fetchUser } = useAuth()

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }

  if (user.value) {
    navigateTo('/dashboard')
  } else {
    navigateTo('/auth/login')
  }
})
</script>

<style scoped>
.gateway-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-dark);
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
