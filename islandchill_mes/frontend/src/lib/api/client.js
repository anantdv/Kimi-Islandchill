// Thin Frappe REST client with idempotency keys
let requestSeq = 0;

export async function call(method, args = {}, opts = {}) {
  const url = `/api/method/islandchill_mes.api.${method}`;
  const headers = {
    "Content-Type": "application/json",
  };
  if (window.csrf_token) {
    headers["X-Frappe-CSRF-Token"] = window.csrf_token;
  }

  const body = opts.get
    ? undefined
    : JSON.stringify({
        client_request_id: `web-${Date.now()}-${requestSeq++}`,
        ...args,
      });

  const res = await fetch(url, {
    method: opts.get ? "GET" : "POST",
    headers,
    body,
    credentials: "same-origin",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }

  const data = await res.json();
  if (data.exception) {
    throw new ApiError(500, data.exception);
  }
  return data.message;
}

export class ApiError extends Error {
  constructor(status, body) {
    super(`API ${status}`);
    this.status = status;
    this.body = body;
  }
}
