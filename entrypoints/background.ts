import { getSettings } from '@/lib/storage/settings';
import {
  MESSAGE_TYPES,
  type RuntimeEvent,
  type RuntimeRequest,
  type StartChatRequest,
} from '@/types/messaging';
import { createProvider } from '@/lib/providers';
import type { ChatMessage } from '@/types/chat';

const activeRequests = new Map<string, AbortController>();

export default defineBackground(() => {
  console.log('[WebProse Context] background ready.', {
    id: browser.runtime.id,
  });

  browser.runtime.onMessage.addListener(async (message: RuntimeRequest, sender) => {
    switch (message.type) {
      case MESSAGE_TYPES.GET_SETTINGS_STATUS:
        try {
          const settings = await getSettings();
          return {
            ok: true,
            configured: Boolean(settings.apiKey),
            provider: settings.provider,
            model: settings.model,
            keyPreview: maskKey(settings.apiKey),
          };
        } catch (error) {
          return {
            ok: false,
            configured: false,
            error:
              error instanceof Error
                ? error.message
                : 'Local settings check failed.',
          };
        }
      case MESSAGE_TYPES.TEST_CONNECTION:
        try {
          const settings = await getSettings();
          const provider = createProvider(settings);
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
      case MESSAGE_TYPES.START_CHAT:
        void streamChat(message, sender.tab?.id);
        return { ok: true };
      case MESSAGE_TYPES.STOP_CHAT:
        activeRequests.get(message.requestId)?.abort();
        activeRequests.delete(message.requestId);
        return { ok: true };
    }
  });
});

async function streamChat(
  message: StartChatRequest,
  tabId: number | undefined,
): Promise<void> {
  const controller = new AbortController();
  activeRequests.set(message.requestId, controller);

  try {
    const settings = await getSettings();
    const provider = createProvider(settings);
    const messages = withSystemPrompt(message);

    for await (const chunk of provider.streamChat(messages, {
      signal: controller.signal,
    })) {
      await sendChatEvent(tabId, {
        type: MESSAGE_TYPES.CHAT_CHUNK,
        requestId: message.requestId,
        chunk,
      });
    }

    await sendChatEvent(tabId, {
      type: MESSAGE_TYPES.CHAT_DONE,
      requestId: message.requestId,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      await sendChatEvent(tabId, {
        type: MESSAGE_TYPES.CHAT_DONE,
        requestId: message.requestId,
      });
      return;
    }

    await sendChatEvent(tabId, {
      type: MESSAGE_TYPES.CHAT_ERROR,
      requestId: message.requestId,
      error: error instanceof Error ? error.message : 'Chat request failed.',
    });
  } finally {
    activeRequests.delete(message.requestId);
  }
}

function maskKey(key: string): string {
  if (!key) return '';
  return `**** ${key.slice(-4)}`;
}

function withSystemPrompt(message: StartChatRequest): ChatMessage[] {
  const context = message.context;
  const contextBlock = context
    ? [
        `Title: ${context.title}`,
        `URL: ${context.url}`,
        context.selection ? `User selection:\n${context.selection}` : '',
        `Page content:\n${context.content}`,
        context.truncated ? 'Note: Page content was truncated.' : '',
      ]
        .filter(Boolean)
        .join('\n\n')
    : 'No page context was attached for this request.';

  return [
    {
      role: 'system',
      content: `You are WebProse Context, a page-aware assistant inside a browser extension. Use the supplied page context to answer. If the context is missing or does not contain the answer, say so clearly. Keep answers concise unless the user asks for detail.\n\n${contextBlock}`,
    },
    ...message.messages,
  ];
}

async function sendChatEvent(
  tabId: number | undefined,
  event: RuntimeEvent,
): Promise<void> {
  if (tabId == null) return;

  await browser.tabs.sendMessage(tabId, event);
}
