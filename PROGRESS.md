# Progress

## 2026-06-01 - Phase 0

- Scaffolded a WXT React TypeScript extension with pnpm.
- Added Tailwind CSS using PostCSS and configured it for popup and content script files.
- Mounted a hidden React probe inside a WXT Shadow DOM content-script UI with `cssInjectionMode: "ui"` so Tailwind CSS is scoped to the shadow root.
- Set a minimal MV3 manifest with only the `storage` permission and an action title.
- Added placeholder directories for components, providers, storage, messaging, context extraction, and shared types.

Known gaps:
- The content script currently only logs and mounts a hidden style probe. The visible in-page widget is planned for Phase 2.

## 2026-06-01 - Phase 1

- Added a polished options page for provider, model, API key, and OpenAI-compatible base URL settings.
- Added a popup action that opens the settings page.
- Stored BYOK settings in `browser.storage.local` through shared helpers, with an explicit local-plaintext hardening note.
- Added typed runtime messaging for connection tests.
- Added provider adapters for Anthropic and OpenAI-compatible chat APIs, including SSE parsing for future streaming chat.
- Routed connection tests through the background worker so provider network calls do not run in content scripts.
- Added provider host permissions for Anthropic and OpenAI, plus optional exact-origin requests for custom OpenAI-compatible base URLs.

Known gaps:
- Connection tests require real user API keys and provider access. The code path builds and typechecks, but no live provider key was available in this environment.

## 2026-06-01 - Phase 2

- Replaced the hidden content-script probe with a floating chat button and anchored chat panel inside the WXT Shadow DOM.
- Added a keyboard-accessible composer with Esc to close, Enter to send, and Shift+Enter for new lines.
- Added Markdown rendering for assistant and user messages, including links, lists, inline code, and fenced code blocks.
- Added a fake echo assistant response so the full message flow works without an API key.
- Kept styling isolated through `cssInjectionMode: "ui"` and the shadow root.

Known gaps:
- Cross-site visual checks need to be done in a browser with the unpacked extension loaded. Typecheck and production build pass in this environment.

## 2026-06-01 - Phase 3

- Added Mozilla Readability page extraction in the content script path.
- Captured page title, URL, readable body text, and current text selection.
- Added a token-budget heuristic with paragraph and sentence-aware truncation.
- Added context chips in the widget for page title, selection attachment, and truncation status.
- Added a context toggle so users can send messages without page context.
- Kept extraction tied to widget open and message send events instead of running on every page load.

Known gaps:
- Readability behavior still needs manual browser validation on real article, docs, and app pages.

## 2026-06-01 - Phase 4

- Replaced the fake echo flow with background-worker LLM chat.
- Added typed start, stop, chunk, done, and error runtime messages.
- Streamed provider chunks back to the content script and rendered them live in the assistant message.
- Added Stop support using AbortController through the provider fetch.
- Added a page-aware system prompt that includes title, URL, selection, readable page content, and truncation status.
- Preserved conversation history within the widget session.
- Rendered provider and settings errors as in-chat assistant errors.

Known gaps:
- Live provider behavior requires real API keys. Typecheck and production build pass, but streaming was not exercised against a live model in this environment.

## 2026-06-01 - Phase 5

- Added quick actions for Summarize, Explain selection, Key points, Rewrite, and Translate.
- Added a rewrite tone selector used by the Rewrite action.
- Centralized quick actions in one config array with label, icon, scope, and prompt template.
- Reused the same streaming chat pipeline as normal messages.
- Attached fresh page context when a quick action is triggered, including selection when present.

Known gaps:
- Action output quality requires live model validation with a real API key.

## 2026-06-01 - Phase 6

- Added an inline model picker to the widget header.
- Persisted model changes through the shared local settings helper.
- Added first-run guidance that opens settings when no API key is saved.
- Added copy-to-clipboard controls for messages and code blocks.
- Added retry controls for failed assistant responses.
- Reviewed manifest permissions. Active permissions are `storage`, Anthropic and OpenAI host access, and optional exact-origin host access for custom OpenAI-compatible providers.
- Added a README with local run, unpacked loading, key setup, supported providers, and privacy notes.

Known gaps:
- End-to-end provider validation still requires a real API key.

## 2026-06-01 - Provider Fixes

- Added the Anthropic browser access header required for extension fetches.
- Added Gemini as a first-class provider using the Gemini API streaming endpoint.
- Added Grok as a first-class provider using xAI's OpenAI-compatible API.
- Added fixed host permissions for Gemini and xAI.
- Updated provider options, model suggestions, and README provider coverage.

Known gaps:
- Gemini and Grok live validation require real API keys.

## 2026-06-01 - Settings Navigation and Model Defaults

- Replaced `openOptionsPage()` calls with a direct extension `options.html` tab opener.
- Set the options page manifest metadata to open in a normal tab.
- Updated default provider models toward current, lower-cost choices: Claude Haiku 4.5, GPT-4.1 mini, Gemini 2.5 Flash-Lite, and Grok 4.3.
- Updated widget model suggestions to avoid deprecated or older defaults.

Known gaps:
- Model availability can vary by account and region, so users may still need to enter a specific enabled model manually.

## 2026-06-01 - Local Connection Pipeline

- Added a background settings-status message that reads `chrome.storage.local` and reports whether a key is configured.
- Changed the provider connection test to use settings read by the background worker, matching the real chat path.
- Updated the popup from a setup-only screen to a state-aware status screen. After a key is saved, it shows the active provider and model and points users to the floating widget on web pages.
- Kept settings available as a secondary management action after setup.

Known gaps:
- The provider network test still requires a real key and provider account access.
