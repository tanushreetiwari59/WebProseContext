import {
  FileText,
  Highlighter,
  Languages,
  ListChecks,
  type LucideIcon,
  PenLine,
} from 'lucide-react';
import type { PageContext } from '@/types/page-context';

export type QuickActionScope = 'page' | 'selection';

export interface QuickAction {
  id: string;
  label: string;
  scope: QuickActionScope;
  icon: LucideIcon;
  buildPrompt: (context: PageContext, tone: string) => string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    scope: 'page',
    icon: FileText,
    buildPrompt: () =>
      'Summarize this page. Focus on the main argument, key facts, and what a reader should remember.',
  },
  {
    id: 'explain-selection',
    label: 'Explain selection',
    scope: 'selection',
    icon: Highlighter,
    buildPrompt: () =>
      'Explain the selected text in plain language. If no selection is attached, ask me to select text first.',
  },
  {
    id: 'key-points',
    label: 'Key points',
    scope: 'page',
    icon: ListChecks,
    buildPrompt: () =>
      'Extract the key points from this page as a concise bullet list.',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    scope: 'selection',
    icon: PenLine,
    buildPrompt: (_context, tone) =>
      `Rewrite the selected text in a ${tone} tone. Preserve the meaning. If no selection is attached, ask me to select text first.`,
  },
  {
    id: 'translate',
    label: 'Translate',
    scope: 'selection',
    icon: Languages,
    buildPrompt: () =>
      'Translate the selected text into English. If no selection is attached, translate the most relevant page excerpt.',
  },
];

export const REWRITE_TONES = ['clear', 'formal', 'friendly', 'concise'];
