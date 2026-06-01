import type { ChatMessage, ProviderRequestOptions } from '@/types/chat';

export interface Provider {
  streamChat(
    messages: ChatMessage[],
    options?: ProviderRequestOptions,
  ): AsyncIterable<string>;
  testConnection(): Promise<void>;
}
