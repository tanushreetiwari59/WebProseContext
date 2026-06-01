import type { AppSettings } from './settings';
import type { ChatMessage } from './chat';
import type { PageContext } from './page-context';

export const MESSAGE_TYPES = {
  TEST_CONNECTION: 'webprose:test-connection',
  START_CHAT: 'webprose:start-chat',
  STOP_CHAT: 'webprose:stop-chat',
  CHAT_CHUNK: 'webprose:chat-chunk',
  CHAT_DONE: 'webprose:chat-done',
  CHAT_ERROR: 'webprose:chat-error',
} as const;

export interface TestConnectionRequest {
  type: typeof MESSAGE_TYPES.TEST_CONNECTION;
  settings: AppSettings;
}

export interface TestConnectionResponse {
  ok: boolean;
  error?: string;
}

export interface StartChatRequest {
  type: typeof MESSAGE_TYPES.START_CHAT;
  requestId: string;
  messages: ChatMessage[];
  context: PageContext | null;
}

export interface StopChatRequest {
  type: typeof MESSAGE_TYPES.STOP_CHAT;
  requestId: string;
}

export interface ChatChunkEvent {
  type: typeof MESSAGE_TYPES.CHAT_CHUNK;
  requestId: string;
  chunk: string;
}

export interface ChatDoneEvent {
  type: typeof MESSAGE_TYPES.CHAT_DONE;
  requestId: string;
}

export interface ChatErrorEvent {
  type: typeof MESSAGE_TYPES.CHAT_ERROR;
  requestId: string;
  error: string;
}

export interface RuntimeAckResponse {
  ok: boolean;
  error?: string;
}

export type RuntimeRequest =
  | TestConnectionRequest
  | StartChatRequest
  | StopChatRequest;
export type RuntimeEvent = ChatChunkEvent | ChatDoneEvent | ChatErrorEvent;
export type RuntimeResponse = TestConnectionResponse | RuntimeAckResponse;
