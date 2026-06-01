import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ children, href }) {
          return (
            <a
              className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:decoration-sky-700"
              href={href}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          );
        },
        code({ children, className }) {
          const isBlock = className?.startsWith('language-');
          if (isBlock) {
            return <CodeBlock code={String(children).replace(/\n$/, '')} />;
          }

          return (
            <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[12px] text-slate-900 dark:bg-slate-800 dark:text-slate-100">
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <pre className="my-3 overflow-x-auto">{children}</pre>;
        },
        ul({ children }) {
          return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>;
        },
        ol({ children }) {
          return (
            <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
          );
        },
        p({ children }) {
          return <p className="my-2 first:mt-0 last:mb-0">{children}</p>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <span className="relative block">
      <button
        type="button"
        onClick={copyCode}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-slate-800 text-slate-200 opacity-80 transition hover:bg-slate-700 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-label="Copy code"
        title="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <code className="block overflow-x-auto rounded-md bg-slate-950 px-3 py-2 pr-11 font-mono text-[12px] leading-5 text-slate-100">
        {code}
      </code>
    </span>
  );
}
