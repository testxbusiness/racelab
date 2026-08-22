export type ProviderErrorCode = "authentication" | "http" | "validation" | "empty_session" | "network";

export class ProviderError extends Error {
  readonly name = "ProviderError";

  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly endpoint?: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export function toProviderError(error: unknown, endpoint?: string): ProviderError {
  if (error instanceof ProviderError) return error;
  if (error instanceof Error) return new ProviderError("network", error.message, endpoint);
  return new ProviderError("network", "OpenF1 request failed", endpoint);
}
