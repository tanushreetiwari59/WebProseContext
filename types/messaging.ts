import type { AppSettings } from './settings';

export const MESSAGE_TYPES = {
  TEST_CONNECTION: 'webprose:test-connection',
} as const;

export interface TestConnectionRequest {
  type: typeof MESSAGE_TYPES.TEST_CONNECTION;
  settings: AppSettings;
}

export interface TestConnectionResponse {
  ok: boolean;
  error?: string;
}

export type RuntimeRequest = TestConnectionRequest;
export type RuntimeResponse = TestConnectionResponse;
