import React from 'react';
import ReactDOM from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { ChatWidget } from '@/components/ChatWidget';
import './content/style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('[WebProse Context] content script loaded.');

    const ui = await createShadowRootUi(ctx, {
      name: 'webprose-context-root',
      position: 'inline',
      isolateEvents: true,
      onMount(container) {
        const root = ReactDOM.createRoot(container);
        root.render(
          <React.StrictMode>
            <ChatWidget />
          </React.StrictMode>,
        );
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
