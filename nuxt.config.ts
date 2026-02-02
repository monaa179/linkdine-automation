// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: false
  },

  runtimeConfig: {
    // Server-side only (not exposed to client)
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    linkedinClientId: process.env.LINKEDIN_CLIENT_ID,
    linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    linkedinRedirectUri: process.env.LINKEDIN_REDIRECT_URI,
    makeWebhookSecret: process.env.MAKE_WEBHOOK_SECRET,
    cronSecret: process.env.CRON_SECRET,
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  nitro: {
    publicAssets: [
      {
        baseURL: '/uploads',
        dir: './uploads',
        maxAge: 60 * 60 * 24 * 7 // 7 days cache
      }
    ]
  }
})
