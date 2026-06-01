import type { ChatMessage, ProviderRequestOptions } from '@/types/chat';
import type { AppSettings } from '@/types/settings';
import { throwProviderError } from './errors';
import { parseSseStream } from './sse';
import type { Provider } from './types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicProvider implements Provider {
  constructor(private readonly settings: AppSettings) {}

  async *streamChat(
    messages: ChatMessage[],
    options: ProviderRequestOptions = {},
  ): AsyncIterable<string> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      signal: options.signal,
      headers: this.headers(),
      body: JSON.stringify(this.toRequestBody(messages, true, options)),
    });

    if (!response.ok) await throwProviderError(response);

    for await (const event of parseSseStream(response)) {
      if (event.data === '[DONE]') return;
      const parsed = JSON.parse(event.data) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };

      if (
        parsed.type === 'content_block_delta' &&
        parsed.delta?.type === 'text_delta' &&
        parsed.delta.text
      ) {
        yield parsed.delta.text;
      }
    }
  }

  async testConnection(): Promise<void> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(
        this.toRequestBody(
          [{ role: 'user', content: 'Reply with OK.' }],
          false,
          { maxTokens: 8 },
        ),
      ),
    });

    if (!response.ok) await throwProviderError(response);
  }

  private headers(): HeadersInit {
    return {
      'content-type': 'application/json',
      'x-api-key': this.settings.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    };
  }

  private toRequestBody(
    messages: ChatMessage[],
    stream: boolean,
    options: ProviderRequestOptions,
  ) {
    const system = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n');
    const conversation = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    return {
      model: this.settings.model,
      max_tokens: options.maxTokens ?? 1024,
      stream,
      ...(system ? { system } : {}),
      messages: conversation,
    };
  }
}
