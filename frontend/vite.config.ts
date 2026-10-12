/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // 화면 테스트는 파일마다 jsdom을 새로 띄워서, 병렬 실행·콜드 스타트 부하에 기본 5초를 넘기는 경우가 있다
    testTimeout: 15_000,
  },
})
