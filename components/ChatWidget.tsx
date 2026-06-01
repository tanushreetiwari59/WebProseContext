import {
  Bot,
  FileText,
  MessageSquareText,
  Minimize2,
  MousePointer2,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { MarkdownMessage } from './MarkdownMessage';
import { extractPageContext } from '@/lib/context/extractPageContext';
import type { PageContext } from '@/types/page-context';

interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: WidgetMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ask a question about this page. For now I will echo your message so you can test the widget flow.\n\n```ts\nconst phase = 2;\n```',
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<WidgetMessage[]>([
    INITIAL_MESSAGE,
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [contextEnabled, setContextEnabled] = useState(true);
  const [contextPreview, setContextPreview] = useState<PageContext | null>(
    null,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setContextPreview(extractPageContext({ tokenBudget: 500 }));
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isThinking]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function submitMessage() {
    const content = input.trim();
    if (!content || isThinking) return;

    const userMessage: WidgetMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    const attachedContext = contextEnabled
      ? extractPageContext({ tokenBudget: 3000 })
      : null;

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsThinking(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: buildEchoResponse(content, attachedContext),
        },
      ]);
      setIsThinking(false);
    }, 450);
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    submitMessage();
  }

  return (
    <div className="fixed bottom-4 right-4 z-[2147483647] font-sans text-slate-950 dark:text-slate-50">
      <div
        ref={panelRef}
        className={`mb-3 flex h-[min(70vh,42rem)] w-[min(calc(100vw-2rem),24rem)] origin-bottom-right flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl transition duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-3 scale-95 opacity-0'
        }`}
        role="dialog"
        aria-label="WebProse chat"
        aria-hidden={!isOpen}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sky-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                WebProse Context
              </h2>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {contextEnabled ? 'Page context on' : 'Page context off'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setContextEnabled((current) => !current)}
              className={`grid h-8 w-8 place-items-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                contextEnabled
                  ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-300'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
              }`}
              aria-label={
                contextEnabled ? 'Turn page context off' : 'Turn page context on'
              }
              title={contextEnabled ? 'Context on' : 'Context off'}
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              aria-label="Minimize chat"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMessages([INITIAL_MESSAGE])}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              aria-label="Clear chat"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          {contextEnabled && contextPreview ? (
            <>
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Page: {contextPreview.title}</span>
              </span>
              {contextPreview.selection ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  <MousePointer2 className="h-3.5 w-3.5" />
                  Selection attached
                </span>
              ) : null}
              {contextPreview.truncated ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Context truncated
                </span>
              ) : null}
            </>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              No page context attached
            </span>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                  message.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                    : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`max-w-[18rem] rounded-lg px-3 py-2 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                    : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                }`}
              >
                <MarkdownMessage content={message.content} />
              </div>
            </article>
          ))}

          {isThinking ? (
            <div className="flex items-center gap-2 pl-11 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
              Thinking
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-end gap-2 rounded-lg border border-slate-300 bg-white p-2 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-sky-900">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onComposerKeyDown}
              rows={1}
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 outline-none placeholder:text-slate-400"
              placeholder="Ask about this page"
            />
            <button
              type="button"
              onClick={submitMessage}
              disabled={!input.trim() || isThinking}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-sky-600 text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              aria-label="Send message"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-sky-600 text-white shadow-xl transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-900"
        aria-label={isOpen ? 'Close WebProse chat' : 'Open WebProse chat'}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquareText className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}

function buildEchoResponse(
  content: string,
  attachedContext: PageContext | null,
): string {
  if (!attachedContext) {
    return `Echo response:\n\n> ${content}\n\nPage context is off. Markdown is enabled, including lists, links, and code blocks.`;
  }

  const selectionLine = attachedContext.selection
    ? '\n- Selection is attached.'
    : '';
  const truncatedLine = attachedContext.truncated
    ? '\n- Page content was truncated to fit the token budget.'
    : '';

  return `Echo response:\n\n> ${content}\n\nAttached context:\n\n- Page: ${attachedContext.title}\n- URL: ${attachedContext.url}${selectionLine}${truncatedLine}\n- Estimated tokens: ${attachedContext.estimatedTokens} of ${attachedContext.tokenBudget}\n\nMarkdown is enabled, including lists, links, and code blocks.`;
}
