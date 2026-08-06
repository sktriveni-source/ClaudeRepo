export interface TeardownResponse {
  teardown: string;
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requestTeardown(idea: string): Promise<TeardownResponse> {
  const res = await fetch("/api/teardown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiRequestError(body.error || "Request failed", res.status);
  }
  return body as TeardownResponse;
}
