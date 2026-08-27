export class RiotApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'RiotApiError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRY_AFTER_MS = 130_000; // Riot resetea el bucket de 100 req/2min; no tiene sentido esperar más que eso

/** Cuánto esperar antes de reintentar un 429, según el header Retry-After de Riot (en segundos) si está presente. */
function getRetryDelayMs(response: Response, fallbackMs: number): number {
  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1000, MAX_RETRY_AFTER_MS);
  }
  return fallbackMs;
}

/**
 * Única responsabilidad: hacer requests HTTP a la API de Riot con el header de
 * autenticación, timeout y reintentos ante rate limit (429) o timeout de red.
 * Ningún conocimiento de qué endpoint de Riot se está llamando.
 */
export class RiotApiClient {
  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs = 5000,
    private readonly maxRetries = 2,
    private readonly retryDelayMs = 500
  ) {}

  async get<T>(url: string, retriesLeft = this.maxRetries): Promise<T> {
    if (!this.apiKey) {
      throw new RiotApiError('Falta configurar RIOT_API_KEY en el archivo .env');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (response.status === 429) {
        if (retriesLeft > 0) {
          await sleep(getRetryDelayMs(response, this.retryDelayMs));
          return this.get<T>(url, retriesLeft - 1);
        }
        throw new RiotApiError('Rate limit excedido después de reintentos', 429);
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const riotMessage = body?.status?.message ?? response.statusText;
        throw new RiotApiError(`[Riot ${response.status}]: ${riotMessage}`, response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof RiotApiError) throw error;

      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort && retriesLeft > 0) {
        await sleep(this.retryDelayMs);
        return this.get<T>(url, retriesLeft - 1);
      }
      if (isAbort) {
        throw new RiotApiError('Timeout esperando respuesta de la API de Riot');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
