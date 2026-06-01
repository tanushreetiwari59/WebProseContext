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

## 2026-06-01 - Popup Chat Entry

- Added an "Open chat on this page" action to the popup once a key is configured.
- Added a content-script command that opens the Shadow DOM chat widget from the popup.
- Added a clear popup error when the current tab cannot host the widget, such as browser pages or extension pages.
- Kept "Manage settings" available as the secondary action after setup.

Known gaps:
- Restricted browser pages still cannot run extension content scripts by design.

## 2026-06-01 - On-Demand Widget Injection

- Added `activeTab` and `scripting` permissions so the popup can inject the content script into the active tab when it is missing.
- Changed the popup chat opener to try messaging first, inject the content script if needed, then retry opening the widget.
- Moved the widget-open message listener into the content script entrypoint to avoid React mount timing races.
- Kept restricted page detection for browser, extension, Web Store, and developer tool pages.

Known gaps:
- Chrome still blocks content scripts on restricted browser-owned pages by design.

## 2026-06-01 - Adaptive Widget Placement

- Increased the chat panel width so it stays closer to the GitHub-sized layout on pages with enough space.
- Added placement logic that detects fixed or sticky bottom-right page UI, such as site messaging docks.
- Moves the widget beside the obstacle when there is room, or above it on narrower pages.
- Keeps the floating button above full-width bottom docks when the panel is closed.

Known gaps:
- Page-level overlays vary widely, so unusual custom layouts may still need site-specific tuning.

## 2026-06-01 - Movable Resizable Soft UI

- Added drag support from the chat header so the panel can be placed anywhere within the viewport.
- Added a top-left resize handle with clamped width and height so dimensions stay usable.
- Added an expand toggle and double-click reset on the floating button.
- Persisted manual widget frame in page local storage.
- Shifted the widget, popup, and options page toward a softer palette: warm ivory surfaces, muted ink text, mist borders, and deep teal accents.

Known gaps:
- Position persistence is per site because it uses page local storage.

## 2026-06-01 - Widget Frame Fixes

- Fixed drag direction math for CSS bottom/right positioning.
- Clamped manual placement against panel height so the panel top cannot leave the viewport.
- Added grab and grabbing cursors plus a header title that explains dragging.
- Added `min-h-0` and overscroll containment to the panel and message list so chat history scrolls inside the widget.
- Fixed resize direction so dragging the top-left handle down reduces panel height instead of pushing the frame out of bounds.

Known gaps:
- Previously saved bad positions may need a double-click reset on the floating button once after reloading.

## 2026-06-01 - Auto Placement Clamp

- Clamped automatic obstacle-avoidance placement with the full rendered widget height.
- Fixed drag-down behavior so dragging the header down moves the widget down.
- Added a visible Drag grip label in the header so the movable region is obvious.
- Shared viewport margin, panel gap, and floating button size constants for placement math.

Known gaps:
- A stale stored frame from an older build may still need one double-click reset.

## 2026-06-01 - Page Deactivation

- Added a deactivate control inside the chat header that hides the widget on the current page.
- Added a popup action to hide the widget on the current page.
- The deactivated state is stored in page local storage.
- Opening chat from the popup reactivates the widget on that page.

Known gaps:
- Deactivation is per page origin because it uses page local storage.

## 2026-06-01 - Direct Drag Coordinates

- Switched manual widget positioning from CSS right/bottom math to direct left/top coordinates.
- Dragging now follows pointer movement naturally in both axes.
- Kept viewport clamping after movement and resize.
- Updated stored frame shape to use left/top with width/height.

Known gaps:
- Old saved right/bottom frame data will be ignored by the new clamp and may reset placement.
