import { Readability } from '@mozilla/readability';
import type { PageContext, PageContextOptions } from '@/types/page-context';

const CHARS_PER_TOKEN = 4;

export function extractPageContext(options: PageContextOptions): PageContext {
  const readable = readMainContent();
  const selection = readSelection();
  const budgetChars = options.tokenBudget * CHARS_PER_TOKEN;
  const truncatedContent = truncateText(readable.content, budgetChars);

  return {
    title: readable.title || document.title || 'Untitled page',
    url: window.location.href,
    content: truncatedContent.text,
    selection,
    truncated: truncatedContent.truncated,
    tokenBudget: options.tokenBudget,
    estimatedTokens: estimateTokens(
      `${readable.title}\n${window.location.href}\n${truncatedContent.text}\n${selection}`,
    ),
  };
}

function readMainContent(): { title: string; content: string } {
  try {
    const documentClone = document.cloneNode(true) as Document;
    const article = new Readability(documentClone).parse();

    if (article?.textContent?.trim()) {
      return {
        title: article.title || document.title,
        content: normalizeWhitespace(article.textContent),
      };
    }
  } catch (error) {
    console.warn('[WebProse Context] Readability extraction failed.', error);
  }

  return {
    title: document.title,
    content: normalizeWhitespace(document.body?.innerText ?? ''),
  };
}

function readSelection(): string {
  return normalizeWhitespace(window.getSelection()?.toString() ?? '');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function truncateText(
  text: string,
  maxChars: number,
): { text: string; truncated: boolean } {
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }

  const target = text.slice(0, maxChars);
  const paragraphBoundary = target.lastIndexOf('\n\n');
  const sentenceBoundary = target.lastIndexOf('. ');
  const cutAt =
    paragraphBoundary > maxChars * 0.6
      ? paragraphBoundary
      : sentenceBoundary > maxChars * 0.6
        ? sentenceBoundary + 1
        : maxChars;

  return {
    text: target.slice(0, cutAt).trim(),
    truncated: true,
  };
}

function estimateTokens(value: string): number {
  return Math.ceil(value.length / CHARS_PER_TOKEN);
}
