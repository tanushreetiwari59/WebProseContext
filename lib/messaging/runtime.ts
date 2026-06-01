import { browser } from 'wxt/browser';
import type { RuntimeRequest, RuntimeResponse } from '@/types/messaging';

export async function sendRuntimeMessage(
  message: RuntimeRequest,
): Promise<RuntimeResponse> {
  return browser.runtime.sendMessage(message);
}
