import type { ChatMessage, ProviderRequestOptions } from '@/types/chat';
import type { AppSettings } from '@/types/settings';
import { throwProviderError } from './errors';
import { parseSseStream } from './sse';
import type { Provider } from './types';

export class OpenAiCompatibleProvider implements Provider {
  constructor(private readonly settings: AppSettings) {}

  async *streamChat(
    messages: ChatMessage[],
    options: ProviderRequestOptions = {},
  ): AsyncIterable<string> {
    const response = await fetch(this.chatCompletionsUrl(), {
      method: 'POST',
      signal: options.signal,
      headers: this.headers(),
      body: JSON.stringify({
        model: this.settings.model,
        messages,
        stream: true,
        max_tokens: options.maxTokens ?? 1024,
      }),
    });

    if (!response.ok) await throwProviderError(response);

    for await (const event of parseSseStream(response)) {
      if (event.data === '[DONE]') return;
      const parsed = JSON.parse(event.data) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  }

  async testConnection(): Promise<void> {
    const response = await fetch(this.chatCompletionsUrl(), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: this.settings.model,
        messages: [{ role: 'user', content: 'Reply with OK.' }],
        stream: false,
        max_tokens: 8,
      }),
    });

    if (!response.ok) await throwProviderError(response);
  }

  private headers(): HeadersInit {
    return {
      authorization: `Bearer ${this.settings.apiKey}`,
      'content-type': 'application/json',
    };
  }

  private chatCompletionsUrl(): string {
    return `${this.settings.baseUrl.replace(/\/$/, '')}/chat/completions`;
  }
}
