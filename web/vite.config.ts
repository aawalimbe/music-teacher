import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port pinned per C:\Program Files\Ampps\www\PORT_REGISTRY.txt (Table 2, row: music_teacher).
// strictPort:true = fail loud if 5186 is taken rather than silently drifting to 5187+.
//
// base: GitHub Pages serves the site at https://<user>.github.io/music-teacher/,
// so asset URLs must be prefixed accordingly. Local dev uses '/' instead.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/music-teacher/' : '/',
  server: {
    port: 5186,
    strictPort: true,
  },
  preview: {
    port: 5186,
    strictPort: true,
  },
}))
