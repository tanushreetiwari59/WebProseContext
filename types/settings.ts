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
  model: 'claude-3-5-sonnet-latest',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
};
