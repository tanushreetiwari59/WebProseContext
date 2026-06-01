import { browser } from 'wxt/browser';
import type {
  RuntimeEvent,
  RuntimeRequest,
  RuntimeResponse,
} from '@/types/messaging';

export async function sendRuntimeMessage(
  message: RuntimeRequest,
): Promise<RuntimeResponse> {
  return browser.runtime.sendMessage(message);
}

export function addRuntimeEventListener(
  listener: (event: RuntimeEvent) => void,
): () => void {
  const wrapped = (message: RuntimeEvent) => {
    listener(message);
  };

  browser.runtime.onMessage.addListener(wrapped);
  return () => browser.runtime.onMessage.removeListener(wrapped);
}
