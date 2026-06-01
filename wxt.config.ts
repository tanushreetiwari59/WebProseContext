import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'WebProse Context',
    description: 'Page-aware BYOK AI chat assistant.',
    permissions: ['storage'],
    action: {
      default_title: 'WebProse Context',
    },
  },
});
