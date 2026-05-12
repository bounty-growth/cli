const TOKEN_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /(access_token["']?\s*[:=]\s*["']?)[^"',\s}]+/gi,
  /(refresh_token["']?\s*[:=]\s*["']?)[^"',\s}]+/gi,
  /(accessToken["']?\s*[:=]\s*["']?)[^"',\s}]+/gi,
  /(refreshToken["']?\s*[:=]\s*["']?)[^"',\s}]+/gi,
];

export class BountyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = "BountyApiError";
  }
}

export function redactSensitiveText(value: unknown) {
  let text =
    typeof value === "string" ? value : (JSON.stringify(value, null, 2) ?? "");

  for (const pattern of TOKEN_PATTERNS) {
    text = text.replace(pattern, (match, prefix) => {
      if (typeof prefix === "string" && match.startsWith(prefix)) {
        return `${prefix}[redacted]`;
      }

      return "Bearer [redacted]";
    });
  }

  return text;
}

export function formatError(error: unknown) {
  if (error instanceof BountyApiError) {
    return redactSensitiveText(
      `${error.message} (${error.status})${
        error.body ? `\n${JSON.stringify(error.body, null, 2)}` : ""
      }`
    );
  }

  if (error instanceof Error) {
    return redactSensitiveText(error.message);
  }

  return redactSensitiveText(error);
}
