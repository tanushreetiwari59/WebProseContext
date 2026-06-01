import { ExternalLink, Settings } from 'lucide-react';
import { browser } from 'wxt/browser';

function App() {
  return (
    <main className="w-80 bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold">WebProse Context</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Add your provider key to turn on page-aware chat in the next phases.
        </p>
        <button
          type="button"
          onClick={() => browser.runtime.openOptionsPage()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Settings className="h-4 w-4" />
          Open settings
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}

export default App;
