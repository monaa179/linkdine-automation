<template>
  <div class="dashboard-layout">
    <Sidebar />
    
    <main class="main-content">
      <Navbar />
      
      <div class="page-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Ensuring user is loaded
const { user, fetchUser } = useAuth()

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-dark);
}

.main-content {
  flex: 1;
  margin-left: 280px; /* Sidebar width */
  display: flex;
  flex-direction: column;
}

.page-container {
  padding: 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
