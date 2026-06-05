import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // 将输出模式改为 'server'，以支持运行时 API 接口和 Supabase 身份验证
  output: 'server',
  // 使用 Vercel 适配器
  adapter: vercel({
    // 强制使用 Edge Functions 或者 Serverless Functions
    // 对于抓取任务，Serverless Functions (node) 通常更兼容 fetch
    webAnalytics: {
      enabled: true,
    },
  }),
});
