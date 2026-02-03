<template>
  <div style="padding: 2rem;">
    <h1>Account ID: {{ $route.params.accountId }}</h1>
    <nav>
      <NuxtLink :to="`/dashboard/accounts/${$route.params.accountId}/feed`" style="color: blue; margin-right: 1rem;">Go to Feed</NuxtLink>
    </nav>
    <hr />
    <NuxtPage />
  </div>
</template>
