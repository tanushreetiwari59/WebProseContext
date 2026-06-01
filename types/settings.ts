export type ProviderKind =
  | 'anthropic'
  | 'openai-compatible'
  | 'gemini'
  | 'grok';

export interface AppSettings {
  provider: ProviderKind;
  model: string;
  apiKey: string;
  baseUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'anthropic',
  model: 'claude-haiku-4-5-20251001',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
};
