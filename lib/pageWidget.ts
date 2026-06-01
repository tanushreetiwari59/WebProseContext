import { browser } from 'wxt/browser';
import { MESSAGE_TYPES, type OpenWidgetRequest } from '@/types/messaging';

export async function openChatOnCurrentPage(): Promise<void> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id == null) {
    throw new Error('No active tab was found.');
  }

  try {
    await browser.tabs.sendMessage(tab.id, {
      type: MESSAGE_TYPES.OPEN_WIDGET,
    } satisfies OpenWidgetRequest);
  } catch {
    throw new Error(
      'Open or reload a normal web page, then try again. Browser pages and extension pages cannot show the chat widget.',
    );
  }
}
