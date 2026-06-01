import type { AppSettings } from '@/types/settings';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAiCompatibleProvider } from './openai-compatible';
import type { Provider } from './types';

export function createProvider(settings: AppSettings): Provider {
  if (!settings.apiKey.trim()) {
    throw new Error('Add an API key before testing the connection.');
  }

  switch (settings.provider) {
    case 'anthropic':
      return new AnthropicProvider(settings);
    case 'openai-compatible':
      return new OpenAiCompatibleProvider(settings);
    case 'gemini':
      return new GeminiProvider(settings);
    case 'grok':
      return new OpenAiCompatibleProvider({
        ...settings,
        baseUrl: 'https://api.x.ai/v1',
      });
  }
}
