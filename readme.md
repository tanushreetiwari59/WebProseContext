# WebProse Context

WebProse Context is a Manifest V3 browser extension that adds a page-aware AI chat widget to web pages. It is BYOK, so you provide your own provider API key.

## Stack

- WXT
- React and TypeScript
- Tailwind CSS
- Mozilla Readability
- Chrome and Chromium first

## Run Locally

Install dependencies:

```sh
pnpm install
```

Start development mode:

```sh
pnpm dev
```

Build the extension:

```sh
pnpm build
```

Load the unpacked extension from:

```sh
.output/chrome-mv3
```

In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select that folder.

## Set An API Key

1. Click the extension action icon.
2. Open Settings.
3. Choose Anthropic or OpenAI compatible.
4. Enter a model and API key.
5. For OpenAI compatible providers, adjust the base URL if needed.
6. Click Save, then Test connection.

The key is stored in `chrome.storage.local` on this device. It is sent only from the background worker to the provider endpoint you configured.

## Supported Providers

- Anthropic Messages API
- OpenAI-compatible chat completions APIs
- Google Gemini API
- xAI Grok chat completions API

Custom OpenAI-compatible base URLs may request an exact origin permission before connection testing or chat.

## Widget

Open any web page and click the floating WebProse button. The widget can:

- Chat with streaming responses
- Include readable page context and selected text
- Turn page context on or off
- Run quick actions for summary, explanation, key points, rewrite, and translation
- Stop a streaming response
- Copy messages and code blocks
- Retry failed responses

## Scripts

```sh
pnpm typecheck
pnpm build
```
