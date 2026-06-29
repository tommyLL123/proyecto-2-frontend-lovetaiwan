import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // Frontend-only fix for local development:
            // the browser calls http://localhost:5173/api/..., and Vite forwards it to Spring Boot.
            // This avoids CORS without changing the backend.
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false
            }
        }
    }
});
