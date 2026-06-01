import { browser } from 'wxt/browser';
import {
  MESSAGE_TYPES,
  type DeactivateWidgetRequest,
  type OpenWidgetRequest,
} from '@/types/messaging';

export async function openChatOnCurrentPage(): Promise<void> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id == null) {
    throw new Error('No active tab was found.');
  }

  if (isRestrictedUrl(tab.url)) {
    throw new Error(
      'This page cannot show the chat widget. Open a normal website tab and try again.',
    );
  }

  if (await sendOpenMessage(tab.id)) return;

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['/content-scripts/content.js'],
    });
  } catch {
    throw new Error(
      'Chrome blocked the chat widget on this page. Open a normal website tab and try again.',
    );
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await wait(100);
    if (await sendOpenMessage(tab.id)) return;
  }

  throw new Error('The chat widget was injected, but did not respond yet.');
}

export async function deactivateChatOnCurrentPage(): Promise<void> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id == null) {
    throw new Error('No active tab was found.');
  }

  if (isRestrictedUrl(tab.url)) {
    throw new Error('This page does not run the chat widget.');
  }

  try {
    await browser.tabs.sendMessage(tab.id, {
      type: MESSAGE_TYPES.DEACTIVATE_WIDGET,
    } satisfies DeactivateWidgetRequest);
  } catch {
    throw new Error('No active chat widget was found on this page.');
  }
}

async function sendOpenMessage(tabId: number): Promise<boolean> {
  try {
    await browser.tabs.sendMessage(tabId, {
      type: MESSAGE_TYPES.OPEN_WIDGET,
    } satisfies OpenWidgetRequest);
    return true;
  } catch {
    return false;
  }
}

function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('devtools://') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com/')
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
