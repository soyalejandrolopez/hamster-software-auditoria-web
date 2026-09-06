// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  nitro: {
    preset: process.env.NITRO_PRESET || (process.env.CF_PAGES ? 'cloudflare-pages' : undefined)
  },
  app: {
    head: {
      title: 'Hamster Software Auditoría Web - Monitor & Auditoría de Sitios Web',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Hamster Software Auditoría Web: Analiza SEO, Rendimiento, Accesibilidad WCAG, Seguridad, Dominio y Enlaces con planes de acción accionables.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'webauditor-super-secret-key-change-in-prod',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@monitor.local',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!*',
    pageSpeedApiKey: process.env.PAGESPEED_API_KEY || '',
    public: {
      appName: 'Hamster Software Auditoría Web'
    }
  }
})
