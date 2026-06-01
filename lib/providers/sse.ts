export interface SseEvent {
  event?: string;
  data: string;
}

export async function* parseSseStream(
  response: Response,
): AsyncIterable<SseEvent> {
  if (!response.body) {
    throw new Error('Provider returned an empty response body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';

    for (const eventText of events) {
      const event = parseEvent(eventText);
      if (event) yield event;
    }
  }

  buffer += decoder.decode();
  const event = parseEvent(buffer);
  if (event) yield event;
}

function parseEvent(eventText: string): SseEvent | undefined {
  const lines = eventText.split(/\r?\n/);
  const data: string[] = [];
  let event: string | undefined;

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      data.push(line.slice('data:'.length).trimStart());
    }
  }

  if (data.length === 0) return undefined;
  return { event, data: data.join('\n') };
}
