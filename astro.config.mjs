import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    // 切换到 edge 模式，绕过 Astro 6 在 Node Serverless 模式下的构建冲突
    // Edge 模式启动更快，且不需要 applyPolyfills
    target: 'edge',
    webAnalytics: {
      enabled: true,
    },
  }),
});
