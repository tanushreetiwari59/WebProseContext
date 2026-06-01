import { MESSAGE_TYPES, type RuntimeRequest } from '@/types/messaging';
import { createProvider } from '@/lib/providers';

export default defineBackground(() => {
  console.log('[WebProse Context] background ready.', {
    id: browser.runtime.id,
  });

  browser.runtime.onMessage.addListener(async (message: RuntimeRequest) => {
    if (message.type !== MESSAGE_TYPES.TEST_CONNECTION) return undefined;

    try {
      const provider = createProvider(message.settings);
      await provider.testConnection();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Connection test failed.',
      };
    }
  });
});
