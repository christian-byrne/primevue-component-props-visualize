import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/primevue-component-playground/',
  server: {
    port: 3000,
    open: true
  }
})