import type { ChatMessage, ProviderRequestOptions } from '@/types/chat';
import type { AppSettings } from '@/types/settings';
import { throwProviderError } from './errors';
import { parseSseStream } from './sse';
import type { Provider } from './types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiProvider implements Provider {
  constructor(private readonly settings: AppSettings) {}

  async *streamChat(
    messages: ChatMessage[],
    options: ProviderRequestOptions = {},
  ): AsyncIterable<string> {
    const response = await fetch(
      `${this.modelUrl('streamGenerateContent')}?alt=sse`,
      {
        method: 'POST',
        signal: options.signal,
        headers: this.headers(),
        body: JSON.stringify(this.toRequestBody(messages, options)),
      },
    );

    if (!response.ok) await throwProviderError(response);

    for await (const event of parseSseStream(response)) {
      const parsed = JSON.parse(event.data) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = parsed.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('');
      if (text) yield text;
    }
  }

  async testConnection(): Promise<void> {
    const response = await fetch(
      this.modelUrl('generateContent'),
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(
          this.toRequestBody(
            [{ role: 'user', content: 'Reply with OK.' }],
            { maxTokens: 8 },
          ),
        ),
      },
    );

    if (!response.ok) await throwProviderError(response);
  }

  private modelUrl(method: 'generateContent' | 'streamGenerateContent') {
    return `${GEMINI_API_BASE}/models/${encodeURIComponent(
      this.settings.model,
    )}:${method}`;
  }

  private headers(): HeadersInit {
    return {
      'content-type': 'application/json',
      'x-goog-api-key': this.settings.apiKey,
    };
  }

  private toRequestBody(
    messages: ChatMessage[],
    options: ProviderRequestOptions,
  ) {
    const systemText = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n');
    const contents = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));

    return {
      ...(systemText
        ? { systemInstruction: { parts: [{ text: systemText }] } }
        : {}),
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 1024,
      },
    };
  }
}
