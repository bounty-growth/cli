import { BountyApiError } from "./errors";

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  fetchImpl?: typeof fetch;
};

export type RequestOptions = {
  method?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: HeadersInit;
};

export class BountyApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ApiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const headers = new Headers(options.headers);

    if (options.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const token = await this.resolveAccessToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const response = await this.fetchImpl(url, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      throw new BountyApiError(
        `Bounty API request failed: ${url.pathname}`,
        response.status,
        responseBody
      );
    }

    return responseBody as T;
  }

  private buildUrl(pathname: string, query?: RequestOptions["query"]) {
    const url = new URL(pathname, normalizeBaseUrl(this.options.baseUrl));

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    return url;
  }

  private async resolveAccessToken() {
    if (!this.options.getAccessToken) {
      return null;
    }

    return await this.options.getAccessToken();
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  return text;
}
