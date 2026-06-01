import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            return (
              <code className="block overflow-x-auto rounded-md bg-slate-950 px-3 py-2 font-mono text-[12px] leading-5 text-slate-100">
                {children}
              </code>
            );
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
