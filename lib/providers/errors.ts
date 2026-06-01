export async function throwProviderError(response: Response): Promise<never> {
  const body = await response.text();
  const message = readProviderMessage(body);
  throw new Error(
    message || `Provider request failed with HTTP ${response.status}.`,
  );
}

function readProviderMessage(body: string): string | undefined {
  if (!body) return undefined;

  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string; type?: string };
      message?: string;
    };
    return parsed.error?.message ?? parsed.message ?? parsed.error?.type;
  } catch {
    return body.slice(0, 400);
  }
}
