export interface PageContext {
  title: string;
  url: string;
  content: string;
  selection: string;
  truncated: boolean;
  tokenBudget: number;
  estimatedTokens: number;
}

export interface PageContextOptions {
  tokenBudget: number;
}
