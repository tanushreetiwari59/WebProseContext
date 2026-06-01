import React from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { ChatWidget } from '@/components/ChatWidget';
import {
  DEACTIVATE_WIDGET_EVENT,
  MESSAGE_TYPES,
  OPEN_WIDGET_EVENT,
} from '@/types/messaging';
import './content/style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('[WebProse Context] content script loaded.');
    const openWidgetListener = (message: { type?: string }) => {
      if (message.type !== MESSAGE_TYPES.OPEN_WIDGET) return undefined;

      window.dispatchEvent(new CustomEvent(OPEN_WIDGET_EVENT));
      return { ok: true };
    };
    const deactivateWidgetListener = (message: { type?: string }) => {
      if (message.type !== MESSAGE_TYPES.DEACTIVATE_WIDGET) return undefined;

      window.dispatchEvent(new CustomEvent(DEACTIVATE_WIDGET_EVENT));
      return { ok: true };
    };

    browser.runtime.onMessage.addListener(openWidgetListener);
    browser.runtime.onMessage.addListener(deactivateWidgetListener);
    ctx.onInvalidated(() =>
      browser.runtime.onMessage.removeListener(openWidgetListener),
    );
    ctx.onInvalidated(() =>
      browser.runtime.onMessage.removeListener(deactivateWidgetListener),
    );

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
