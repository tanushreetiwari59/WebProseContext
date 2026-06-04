<div align="center">

# 🧩 WebProse Context 💬

### Bring your own AI to every page you read.

A Manifest V3 browser extension that drops a page-aware, streaming AI chat widget onto any website — powered by **your** provider key, with **your** data staying on **your** device.

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Built with WXT](https://img.shields.io/badge/Built%20with-WXT-67217a)](https://wxt.dev)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org)
[![BYOK](https://img.shields.io/badge/BYOK-Bring%20Your%20Own%20Key-success)](#-set-an-api-key)

</div>

---

## 🌟 Vision

The best context for an AI assistant is the page already in front of you. WebProse Context turns any tab into a conversation: ask about an article, summarize a docs page, rewrite a paragraph, or translate a selection — without copy-pasting into another app and without handing your reading history to a middleman.

Three principles guide it:

1. **Your key, your bill, your control.** Bring your own API key. There is no hosted backend, no account, and no telemetry.
2. **Context should be opt-in and visible.** You always see what page text is attached, and you can turn it off with one click.
3. **It should feel native to the page.** A floating widget that you can move, resize, and silence per site — not a clumsy popup.

---

## 🌱 Core Values

🔑 **BYOK by design** — You configure Anthropic, OpenAI-compatible, Gemini, or Grok with your own key. Keys live in `chrome.storage.local` on your device and are sent only from the background worker to the provider endpoint you chose.

🧠 **Page-aware, not page-hungry** — Readable page text is extracted with Mozilla Readability, budgeted to a token limit with sentence-aware truncation, and only attached when you ask. Extraction runs on widget-open and send — never on every page load.

🛡️ **Privacy as the default** — No analytics, no remote logging, no third-party servers. The only network calls are the provider requests you initiate.

🪶 **Light and isolated** — Styles are scoped inside a Shadow DOM so the widget never leaks CSS into (or inherits from) the host page. Minimal permissions: `storage`, `activeTab`, `scripting`, and host access for the four supported providers.

---

## ❓ Why This Exists

Most "AI on the web" tools are SaaS wrappers: you sign up, they proxy your prompts through their servers, and the page content — sometimes including things you didn't mean to share — flows through infrastructure you don't control. WebProse Context flips that. The extension is the whole product. You point it at a model you already pay for, and the page-to-prompt path never leaves your browser except to reach the provider you named.

---

## ✨ Features

| | |
|---|---|
| 💬 **Streaming chat** | Live token-by-token responses with a Stop button (backed by `AbortController`). |
| 📄 **Page context** | Title, URL, readable body text, and your current selection — attach or detach per message. |
| ⚡ **Quick actions** | One-click **Summarize**, **Explain selection**, **Key points**, **Rewrite** (with tone), and **Translate**. |
| 🔀 **Multi-provider** | Anthropic, OpenAI-compatible, Google Gemini, and xAI Grok — switch models from the widget header. |
| 🧰 **Markdown rendering** | Links, lists, inline code, and fenced code blocks, with copy buttons for messages and code. |
| 🪟 **Movable & resizable** | Drag from the header, resize, and persist the frame per site; deactivate the widget per page. |
| 🔁 **Resilient** | Retry failed responses and clear in-chat errors for provider/settings problems. |

---

## 🏗️ How It Works

```
┌─────────────────┐     readable text      ┌──────────────────┐
│  Content Script │ ──────────────────────▶│   Chat Widget    │
│  (Readability)  │   page title / URL /   │  (Shadow DOM UI) │
└─────────────────┘   selection / budget   └────────┬─────────┘
                                                     │ runtime message
                                                     ▼
                                          ┌──────────────────────┐
                                          │  Background Worker    │
                                          │  provider adapters +  │
                                          │  SSE streaming        │
                                          └──────────┬───────────┘
                                                     │ fetch (your key)
                                                     ▼
                                   Anthropic · OpenAI · Gemini · Grok
```

Provider network calls run **only** in the background worker — never in content scripts — so page origins never touch your key or the provider response stream directly.

**Project layout**

```
entrypoints/   background worker, content script, popup, options page
components/     ChatWidget, MarkdownMessage, quick actions
lib/providers/ adapters (anthropic, openai-compatible, gemini), SSE parsing
lib/context/   Readability extraction + token budgeting
lib/storage/   BYOK settings helpers
lib/messaging/ typed runtime messages
```

---

## 🚀 Getting Started

**Prerequisites:** Node, [pnpm](https://pnpm.io), and a Chromium-based browser.

```sh
# install dependencies
pnpm install

# start development mode (HMR)
pnpm dev

# or produce a production build
pnpm build
```

**Load the unpacked extension**

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select `.output/chrome-mv3`.

> Firefox builds are available too: `pnpm dev:firefox` / `pnpm build:firefox`.

---

## 🔑 Set An API Key

1. Click the extension action icon.
2. Open **Settings**.
3. Choose **Anthropic**, **OpenAI-compatible**, **Gemini**, or **Grok**.
4. Enter a model and your API key.
5. For OpenAI-compatible providers, adjust the base URL if needed.
6. Click **Save**, then **Test connection**.

Your key is stored in `chrome.storage.local` on this device. It is sent only from the background worker to the provider endpoint you configured. Custom OpenAI-compatible base URLs may request an exact-origin permission before the connection test or first chat.

---

## 🤖 Supported Providers

| Provider | API | Default model |
|---|---|---|
| Anthropic | Messages API | `claude-haiku-4-5-20251001` |
| OpenAI-compatible | Chat Completions | `gpt-4.1-mini` |
| Google Gemini | Gemini API | `gemini-2.5-flash-lite` |
| xAI Grok | OpenAI-compatible | `grok-4.3` |

Defaults favor current, lower-cost models. Model availability varies by account and region, so you can always enter a specific enabled model manually.

---

## 🛡️ Privacy

- **No backend.** There is no WebProse server. The extension talks directly to your chosen provider.
- **No telemetry.** No analytics or remote logging of any kind.
- **Local key storage.** Keys sit in `chrome.storage.local` in plaintext on your device — treat your machine accordingly.
- **Opt-in context.** Page text is attached only when you enable it, and you can see and toggle it per message.

---

## 🧱 Tech Stack

**WXT** · **React 19** + **TypeScript** · **Tailwind CSS** · **Mozilla Readability** · **react-markdown** + **remark-gfm** · Chrome / Chromium first, with Firefox build targets.

---

## 🤝 Contributing

Contributions are welcome. A good path in:

1. Read [`PROGRESS.md`](./PROGRESS.md) for the phase-by-phase history of how the extension was built.
2. Run `pnpm dev` and load the unpacked build.
3. Keep changes typed — `pnpm typecheck` must pass before opening a PR.

```sh
pnpm typecheck   # tsc --noEmit
pnpm build       # production build
```

Issues and pull requests for new providers, better context extraction, or UI polish are all appreciated.

<div align="center">

**Built for people who read the web and want to talk to it.**

</div>
