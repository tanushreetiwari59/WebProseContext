import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'WebProse Context',
    description: 'Page-aware BYOK AI chat assistant.',
    permissions: ['storage'],
    host_permissions: [
      'https://api.anthropic.com/*',
      'https://api.openai.com/*',
    ],
    optional_host_permissions: ['<all_urls>'],
    action: {
      default_title: 'WebProse Context',
    },
  },
});
