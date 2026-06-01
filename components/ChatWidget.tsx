import {
  Bot,
  Check,
  Copy,
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
import {
  MESSAGE_TYPES,
  OPEN_WIDGET_EVENT,
  type RuntimeEvent,
} from '@/types/messaging';
import {
  addRuntimeEventListener,
  sendRuntimeMessage,
} from '@/lib/messaging/runtime';
import type { ChatMessage } from '@/types/chat';
import { QUICK_ACTIONS, REWRITE_TONES, type QuickAction } from './quickActions';
import { getSettings, setSettings } from '@/lib/storage/settings';
import type { AppSettings } from '@/types/settings';
import { openSettingsPage } from '@/lib/settingsPage';

interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'streaming' | 'error';
  retryContent?: string;
  retryAttachContext?: boolean;
}

const INITIAL_MESSAGE: WidgetMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ask a question about this page. Responses stream through your configured provider.\n\n```ts\nconst phase = 4;\n```',
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
  const [rewriteTone, setRewriteTone] = useState(REWRITE_TONES[0]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const activeRetryRef = useRef<{
    content: string;
    attachContext: boolean;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const placement = useWidgetPlacement(isOpen);

  useEffect(() => {
    void refreshSettings();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setContextPreview(extractPageContext({ tokenBudget: 500 }));
    void refreshSettings();
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

  useEffect(() => {
    const listener = () => {
      setIsOpen(true);
    };

    window.addEventListener(OPEN_WIDGET_EVENT, listener);
    return () => window.removeEventListener(OPEN_WIDGET_EVENT, listener);
  }, []);

  useEffect(() => {
    return addRuntimeEventListener((event) => {
      if (event.requestId !== activeRequestIdRef.current) return;
      handleRuntimeEvent(event);
    });
  }, []);

  async function submitMessage() {
    const content = input.trim();
    if (!content || activeRequestId) return;

    setInput('');
    await startChat(content, contextEnabled);
  }

  async function runQuickAction(action: QuickAction) {
    if (activeRequestId) return;

    const context = extractPageContext({ tokenBudget: 3000 });
    await startChat(action.buildPrompt(context, rewriteTone), true);
  }

  async function startChat(content: string, attachContext: boolean) {
    const currentSettings = await getSettings();
    setSettingsState(currentSettings);

    if (!currentSettings.apiKey) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Add an API key in settings before starting a chat. Your key is stored on this device.',
          status: 'error',
        },
      ]);
      return;
    }

    const userMessage: WidgetMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    const attachedContext = attachContext
      ? extractPageContext({ tokenBudget: 3000 })
      : null;
    const assistantId = crypto.randomUUID();
    const requestId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        status: 'streaming',
      },
    ]);
    setIsThinking(true);
    setActiveRequestId(requestId);
    activeRequestIdRef.current = requestId;
    activeAssistantIdRef.current = assistantId;
    activeRetryRef.current = { content, attachContext };

    const response = await sendRuntimeMessage({
      type: MESSAGE_TYPES.START_CHAT,
      requestId,
      messages: toChatMessages([...messages, userMessage]),
      context: attachedContext,
    });

    if (!response.ok) {
      completeWithError(response.error ?? 'Chat request failed.');
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    submitMessage();
  }

  async function stopStreaming() {
    if (!activeRequestId) return;

    await sendRuntimeMessage({
      type: MESSAGE_TYPES.STOP_CHAT,
      requestId: activeRequestId,
    });
    finishStreaming();
  }

  function handleRuntimeEvent(event: RuntimeEvent) {
    if (event.type === MESSAGE_TYPES.CHAT_CHUNK) {
      const assistantId = activeAssistantIdRef.current;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: message.content + event.chunk }
            : message,
        ),
      );
      return;
    }

    if (event.type === MESSAGE_TYPES.CHAT_ERROR) {
      completeWithError(event.error);
      return;
    }

    if (event.type === MESSAGE_TYPES.CHAT_DONE) {
      finishStreaming();
    }
  }

  function completeWithError(error: string) {
    const assistantId = activeAssistantIdRef.current;
    const retry = activeRetryRef.current;
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              content: error,
              status: 'error',
              retryContent: retry?.content,
              retryAttachContext: retry?.attachContext,
            }
          : message,
      ),
    );
    finishStreaming();
  }

  function finishStreaming() {
    const assistantId = activeAssistantIdRef.current;
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId && message.status === 'streaming'
          ? { ...message, status: undefined }
          : message,
      ),
    );
    setIsThinking(false);
    setActiveRequestId(null);
    activeRequestIdRef.current = null;
    activeAssistantIdRef.current = null;
    activeRetryRef.current = null;
  }

  async function refreshSettings() {
    const nextSettings = await getSettings();
    setSettingsState(nextSettings);
  }

  async function updateModel(model: string) {
    if (!settings) return;

    const nextSettings = { ...settings, model };
    setSettingsState(nextSettings);
    await setSettings(nextSettings);
  }

  async function copyMessage(message: WidgetMessage) {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1200);
  }

  async function retryMessage(message: WidgetMessage) {
    if (!message.retryContent || activeRequestId) return;
    await startChat(message.retryContent, Boolean(message.retryAttachContext));
  }

  return (
    <div
      className="fixed z-[2147483647] font-sans text-slate-950 dark:text-slate-50"
      style={{
        right: placement.right,
        bottom: placement.bottom,
      }}
    >
      <div
        ref={panelRef}
        className={`mb-3 flex h-[min(76vh,42rem)] w-[min(calc(100vw-2rem),28rem)] origin-bottom-right flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl transition duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 ${
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
                {settings?.model || 'No model selected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={settings?.model ?? ''}
              onChange={(event) => updateModel(event.target.value)}
              className="hidden max-w-32 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-sky-900 sm:block"
              aria-label="Model"
            >
              <option value={settings?.model ?? ''}>
                {settings?.model || 'Model'}
              </option>
              {modelSuggestions(settings).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
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
              disabled={Boolean(activeRequestId)}
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

        <div className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          {!settings?.apiKey ? (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <span>Add an API key to start chatting.</span>
              <button
                type="button"
                onClick={() => openSettingsPage()}
                className="shrink-0 rounded-md bg-amber-900 px-2 py-1 font-semibold text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
              >
                Settings
              </button>
            </div>
          ) : null}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => runQuickAction(action)}
                  disabled={Boolean(activeRequestId)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                  title={action.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              );
            })}
            <label className="ml-auto inline-flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              Tone
              <select
                value={rewriteTone}
                onChange={(event) => setRewriteTone(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-sky-900"
              >
                {REWRITE_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
                className={`max-w-[22rem] rounded-lg px-3 py-2 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                    : message.status === 'error'
                      ? 'border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                      : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                }`}
              >
                {message.content ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    Starting response...
                  </span>
                )}
                <div className="mt-2 flex items-center gap-1">
                  {message.content ? (
                    <button
                      type="button"
                      onClick={() => copyMessage(message)}
                      className="inline-grid h-7 w-7 place-items-center rounded-md text-current opacity-60 transition hover:bg-black/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:hover:bg-white/10"
                      aria-label="Copy message"
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : null}
                  {message.status === 'error' && message.retryContent ? (
                    <button
                      type="button"
                      onClick={() => retryMessage(message)}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-current opacity-70 transition hover:bg-black/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:hover:bg-white/10"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
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
              onClick={activeRequestId ? stopStreaming : submitMessage}
              disabled={!activeRequestId && !input.trim()}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-md text-white transition focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 ${
                activeRequestId
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-sky-600 hover:bg-sky-700'
              }`}
              aria-label={activeRequestId ? 'Stop response' : 'Send message'}
              title={activeRequestId ? 'Stop' : 'Send'}
            >
              {activeRequestId ? (
                <X className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
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

function toChatMessages(messages: WidgetMessage[]): ChatMessage[] {
  return messages
    .filter((message) => message.id !== INITIAL_MESSAGE.id && message.content)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function useWidgetPlacement(isOpen: boolean) {
  const [placement, setPlacement] = useState({ right: 16, bottom: 16 });

  useEffect(() => {
    function updatePlacement() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (viewportWidth < 520) {
        setPlacement({ right: 16, bottom: 16 });
        return;
      }

      const obstacle = findBottomRightObstacle();
      const panelWidth = Math.min(viewportWidth - 32, 448);
      const buttonSize = 56;
      const gap = 16;

      if (obstacle) {
        const candidateRight = Math.max(16, viewportWidth - obstacle.left + gap);
        const maxRight = Math.max(16, viewportWidth - panelWidth - gap);
        const fitsBesideObstacle = candidateRight <= maxRight;

        setPlacement({
          right: fitsBesideObstacle ? candidateRight : 16,
          bottom: fitsBesideObstacle
            ? 16
            : Math.min(
                Math.max(16, viewportHeight - obstacle.top + gap),
                Math.max(16, viewportHeight - 240),
              ),
        });
        return;
      }

      const bottomDock = findBottomDock();
      setPlacement({
        right: 16,
        bottom:
          bottomDock && !isOpen
            ? bottomDock + gap
            : Math.max(16, bottomDock - buttonSize),
      });
    }

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    const timer = window.setInterval(updatePlacement, 1500);

    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
      window.clearInterval(timer);
    };
  }, [isOpen]);

  return placement;
}

function findBottomRightObstacle(): DOMRect | null {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const candidates = Array.from(
    document.body.querySelectorAll<HTMLElement>('*'),
  );
  let best: DOMRect | null = null;

  for (const element of candidates) {
    if (element.closest('webprose-context-root')) continue;

    const style = window.getComputedStyle(element);
    if (style.position !== 'fixed' && style.position !== 'sticky') continue;
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width < 180 || height < 60) continue;
    if (rect.right < viewportWidth * 0.55) continue;
    if (rect.bottom < viewportHeight - 180) continue;

    if (!best || rect.left < best.left) best = rect;
  }

  return best;
}

function findBottomDock(): number {
  const viewportHeight = window.innerHeight;
  let dockHeight = 0;

  for (const element of Array.from(
    document.body.querySelectorAll<HTMLElement>('*'),
  )) {
    if (element.closest('webprose-context-root')) continue;

    const style = window.getComputedStyle(element);
    if (style.position !== 'fixed' && style.position !== 'sticky') continue;
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    const rect = element.getBoundingClientRect();
    if (rect.width < window.innerWidth * 0.4) continue;
    if (rect.height < 40 || rect.height > 180) continue;
    if (rect.bottom < viewportHeight - 24) continue;

    dockHeight = Math.max(dockHeight, viewportHeight - rect.top);
  }

  return dockHeight;
}

function modelSuggestions(settings: AppSettings | null): string[] {
  if (!settings) return [];

  const suggestionsByProvider: Record<AppSettings['provider'], string[]> = {
    anthropic: [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-20250514',
      'claude-3-5-haiku-20241022',
    ],
    'openai-compatible': ['gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini'],
    gemini: [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
    ],
    grok: ['grok-4.3', 'grok-4.20-0309-non-reasoning', 'grok-build-0.1'],
  };
  const suggestions = [...suggestionsByProvider[settings.provider], settings.model];

  return Array.from(new Set(suggestions.filter(Boolean))).filter(
    (model) => model !== settings.model,
  );
}
