import {
  ExternalLink,
  Loader2,
  MessageSquareText,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { openSettingsPage } from '@/lib/settingsPage';
import { sendRuntimeMessage } from '@/lib/messaging/runtime';
import { MESSAGE_TYPES, type SettingsStatusResponse } from '@/types/messaging';
import { openChatOnCurrentPage } from '@/lib/pageWidget';

function App() {
  const [status, setStatus] = useState<SettingsStatusResponse | null>(null);
  const [pageMessage, setPageMessage] = useState('');

  useEffect(() => {
    void sendRuntimeMessage({ type: MESSAGE_TYPES.GET_SETTINGS_STATUS }).then(
      (response) => setStatus(response as SettingsStatusResponse),
    );
  }, []);

  const isReady = Boolean(status?.ok && status.configured);

  return (
    <main className="w-80 bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-sky-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">WebProse Context</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {status ? (isReady ? 'Ready' : 'Setup needed') : 'Checking'}
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {status
            ? isReady
              ? `Using ${status.provider} with ${status.model}. Open the chat on a normal web page.`
              : 'Add a provider key before using page-aware chat.'
            : 'Checking local extension settings...'}
        </p>
        {status && !status.ok ? (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {status.error ?? 'Local settings check failed.'}
          </p>
        ) : null}
        {pageMessage ? (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {pageMessage}
          </p>
        ) : null}
        {isReady ? (
          <button
            type="button"
            onClick={() => {
              setPageMessage('');
              void openChatOnCurrentPage().catch((error) =>
                setPageMessage(
                  error instanceof Error
                    ? error.message
                    : 'Could not open chat on this page.',
                ),
              );
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <MessageSquareText className="h-4 w-4" />
            Open chat on this page
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => openSettingsPage()}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
            isReady
              ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900'
              : 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
          }`}
        >
          {status ? (
            <Settings className="h-4 w-4" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isReady ? 'Manage settings' : 'Open settings'}
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}

export default App;
