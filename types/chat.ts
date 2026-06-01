export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ProviderRequestOptions {
  signal?: AbortSignal;
  maxTokens?: number;
}
