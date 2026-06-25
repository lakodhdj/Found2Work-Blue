import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1',
    open: false,
    // Не фиксируем порт HMR: при занятом 5173 Vite поднимает 5174+ и иначе клиент
    // бесконечно переподключается к неверному порту → полная перезагрузка страницы.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
