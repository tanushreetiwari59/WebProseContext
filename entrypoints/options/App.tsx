import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Save,
  ServerCog,
} from 'lucide-react';
import { MESSAGE_TYPES } from '@/types/messaging';
import type { SettingsStatusResponse } from '@/types/messaging';
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type ProviderKind,
} from '@/types/settings';
import { sendRuntimeMessage } from '@/lib/messaging/runtime';
import { getSettings, setSettings } from '@/lib/storage/settings';
import { openSettingsPage } from '@/lib/settingsPage';

const PROVIDERS: Array<{
  id: ProviderKind;
  label: string;
  description: string;
  defaultModel: string;
  defaultBaseUrl: string;
}> = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Claude models through the Anthropic Messages API.',
    defaultModel: 'claude-haiku-4-5-20251001',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
  },
  {
    id: 'openai-compatible',
    label: 'OpenAI compatible',
    description: 'OpenAI, local gateways, and compatible hosted APIs.',
    defaultModel: 'gpt-4.1-mini',
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    description: 'Google Gemini models through the Gemini API.',
    defaultModel: 'gemini-2.5-flash-lite',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    id: 'grok',
    label: 'Grok',
    description: 'xAI Grok models through the chat completions API.',
    defaultModel: 'grok-4.3',
    defaultBaseUrl: 'https://api.x.ai/v1',
  },
];

type Status = { tone: 'idle' | 'success' | 'error'; message: string };

function App() {
  const [savedSettings, setSavedSettings] =
    useState<AppSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState<Status>({
    tone: 'idle',
    message: 'Settings are stored on this device.',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    void getSettings().then((settings) => {
      setSavedSettings(settings);
      setDraft(settings);
      setIsLoading(false);
    });
  }, []);

  const maskedKey = useMemo(
    () => maskKey(savedSettings.apiKey),
    [savedSettings.apiKey],
  );

  async function saveSettings(event?: FormEvent) {
    event?.preventDefault();
    const nextSettings = currentDraftSettings();

    await setSettings(nextSettings);
    setSavedSettings(nextSettings);
    setDraft(nextSettings);
    setKeyInput('');
    setStatus({ tone: 'success', message: 'Settings saved.' });
    return nextSettings;
  }

  async function testConnection() {
    setIsTesting(true);
    setStatus({ tone: 'idle', message: 'Testing connection...' });

    try {
      const settings = currentDraftSettings();
      await ensureProviderPermission(settings);
      await setSettings(settings);
      setSavedSettings(settings);
      setDraft(settings);
      setKeyInput('');
      const localStatus = await sendRuntimeMessage({
        type: MESSAGE_TYPES.GET_SETTINGS_STATUS,
      }) as SettingsStatusResponse;
      if (!localStatus.ok || !localStatus.configured) {
        setStatus({
          tone: 'error',
          message:
            localStatus.error ??
            'Settings saved, but the background worker could not read the key.',
        });
        return;
      }
      const response = await sendRuntimeMessage({
        type: MESSAGE_TYPES.TEST_CONNECTION,
      });
      setStatus(
        response.ok
          ? { tone: 'success', message: 'Connection works.' }
          : {
              tone: 'error',
              message: response.error ?? 'Connection test failed.',
            },
      );
    } catch (error) {
      setStatus({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  }

  function currentDraftSettings(): AppSettings {
    return normalizeSettings({
      ...draft,
      apiKey: keyInput.trim() || savedSettings.apiKey,
    });
  }

  function updateProvider(provider: ProviderKind) {
    const selected = PROVIDERS.find((item) => item.id === provider);
    setDraft((current) => ({
      ...current,
      provider,
      model: selected?.defaultModel ?? current.model,
      baseUrl: selected?.defaultBaseUrl ?? current.baseUrl,
    }));
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
              WebProse Context
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Provider settings
            </h1>
          </div>
          <button
            type="button"
            onClick={() => openSettingsPage()}
            className="inline-flex items-center gap-2 self-start rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" />
            Open page
          </button>
        </header>

        <form
          onSubmit={saveSettings}
          className="grid gap-6 lg:grid-cols-[1fr_22rem]"
        >
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <ServerCog className="mt-1 h-5 w-5 text-sky-600 dark:text-sky-300" />
              <div>
                <h2 className="text-lg font-semibold">Connection</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Choose a provider and model. The key is used only by the
                  background worker when it calls that provider.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {PROVIDERS.map((provider) => (
                  <button
                    type="button"
                    key={provider.id}
                    onClick={() => updateProvider(provider.id)}
                    className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      draft.provider === provider.id
                        ? 'border-sky-500 bg-sky-50 text-slate-950 dark:border-sky-400 dark:bg-sky-950 dark:text-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-medium">{provider.label}</span>
                      {draft.provider === provider.id ? (
                        <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                      ) : null}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {provider.description}
                    </span>
                  </button>
                ))}
              </div>

              {draft.provider === 'openai-compatible' ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Base URL</span>
                  <input
                    value={draft.baseUrl}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        baseUrl: event.target.value,
                      }))
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900"
                    placeholder="https://api.openai.com/v1"
                  />
                </label>
              ) : null}

              <label className="grid gap-2">
                <span className="text-sm font-medium">Model</span>
                <input
                  value={draft.model}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      model: event.target.value,
                    }))
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">API key</span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={keyInput}
                    onChange={(event) => setKeyInput(event.target.value)}
                    type="password"
                    className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900"
                    placeholder={
                      savedSettings.apiKey
                        ? 'Leave blank to keep saved key'
                        : 'Paste your provider key'
                    }
                  />
                </div>
                {maskedKey ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Saved key: {maskedKey}
                  </span>
                ) : null}
              </label>
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Status</h2>
            <p
              className={`mt-3 rounded-md border px-3 py-2 text-sm leading-6 ${
                status.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                  : status.tone === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              {status.message}
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                type="button"
                onClick={testConnection}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ServerCog className="h-4 w-4" />
                )}
                Test connection
              </button>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    model: settings.model.trim(),
    apiKey: settings.apiKey.trim(),
    baseUrl: settings.baseUrl.trim().replace(/\/$/, ''),
  };
}

async function ensureProviderPermission(settings: AppSettings): Promise<void> {
  if (settings.provider !== 'openai-compatible') return;

  const origin = new URL(settings.baseUrl).origin;
  if (
    origin === 'https://api.openai.com' ||
    origin === 'https://api.anthropic.com'
  ) {
    return;
  }

  const origins = [`${origin}/*`];
  const hasPermission = await browser.permissions.contains({ origins });
  if (hasPermission) return;

  const granted = await browser.permissions.request({ origins });
  if (!granted) {
    throw new Error(`Permission was not granted for ${origin}.`);
  }
}

function maskKey(key: string): string {
  if (!key) return '';
  const tail = key.slice(-4);
  return `**** ${tail}`;
}

export default App;
