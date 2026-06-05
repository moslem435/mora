import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Astro 5.x 稳定支持 server 模式
  output: 'server',
  adapter: vercel({
    // 在 Astro 5 中，默认的 serverless 模式非常稳定
    webAnalytics: {
      enabled: true,
    },
  }),
});
