import {
  ExternalLink,
  EyeOff,
  Loader2,
  MessageSquareText,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { openSettingsPage } from '@/lib/settingsPage';
import { sendRuntimeMessage } from '@/lib/messaging/runtime';
import { MESSAGE_TYPES, type SettingsStatusResponse } from '@/types/messaging';
import {
  deactivateChatOnCurrentPage,
  openChatOnCurrentPage,
} from '@/lib/pageWidget';

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
    <main className="w-80 bg-[#fbfaf7] p-4 text-[#172033] dark:bg-[#101827] dark:text-[#edf4f2]">
      <div className="rounded-lg border border-[#d9e4e2] bg-[#f3f6f3] p-4 shadow-sm dark:border-[#304258] dark:bg-[#121d2e]">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[#2f6f73] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">WebProse Context</p>
            <p className="text-xs text-[#667586] dark:text-[#9aaab1]">
              {status ? (isReady ? 'Ready' : 'Setup needed') : 'Checking'}
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#4f5f72] dark:text-[#b8c8c7]">
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
              void openChatOnCurrentPage()
                .then(() => window.close())
                .catch((error) =>
                  setPageMessage(
                    error instanceof Error
                      ? error.message
                      : 'Could not open chat on this page.',
                  ),
                );
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2f6f73] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285f62] focus:outline-none focus:ring-2 focus:ring-[#6a9d9a]"
          >
            <MessageSquareText className="h-4 w-4" />
            Open chat on this page
          </button>
        ) : null}
        {isReady ? (
          <button
            type="button"
            onClick={() => {
              setPageMessage('');
              void deactivateChatOnCurrentPage()
                .then(() => window.close())
                .catch((error) =>
                  setPageMessage(
                    error instanceof Error
                      ? error.message
                      : 'Could not hide chat on this page.',
                  ),
                );
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#c7d6d2] bg-[#fbfaf7] px-3 py-2 text-sm font-semibold text-[#29364a] shadow-sm transition hover:bg-[#edf4f2] focus:outline-none focus:ring-2 focus:ring-[#6a9d9a] dark:border-[#3b5165] dark:bg-[#101827] dark:text-[#edf4f2] dark:hover:bg-[#172033]"
          >
            <EyeOff className="h-4 w-4" />
            Hide chat on this page
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => openSettingsPage()}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
            isReady
              ? 'border border-[#c7d6d2] bg-[#fbfaf7] text-[#29364a] hover:bg-[#edf4f2] dark:border-[#3b5165] dark:bg-[#101827] dark:text-[#edf4f2] dark:hover:bg-[#172033]'
              : 'bg-[#172033] text-white hover:bg-[#29364a] dark:bg-[#edf4f2] dark:text-[#101827] dark:hover:bg-[#dce7e5]'
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
