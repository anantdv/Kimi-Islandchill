// Vercel serverless proxy to the public ERPNext backend.
// Set the environment variable ERPNext_API_URL in the Vercel dashboard,
// e.g. https://erpnext.yourdomain.com

const FORBIDDEN_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "content-length",
  "transfer-encoding",
]);

const FORBIDDEN_RESPONSE_HEADERS = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const baseUrl = (process.env.ERPNext_API_URL || process.env.VITE_ERP_API_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    res.status(500).json({ message: "ERPNext_API_URL environment variable is not set" });
    return;
  }

  const targetPath = req.query.__path || "/";
  const targetUrl = `${baseUrl}${targetPath}`;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (FORBIDDEN_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    if (value !== undefined) headers[key] = value;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    res.status(400).json({ message: "Failed to read request body" });
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      if (FORBIDDEN_RESPONSE_HEADERS.has(key.toLowerCase())) return;
      responseHeaders[key] = value;
    });

    const responseBody = Buffer.from(await response.arrayBuffer());

    res.status(response.status);
    for (const [key, value] of Object.entries(responseHeaders)) {
      res.setHeader(key, value);
    }
    res.send(responseBody);
  } catch (err) {
    res.status(502).json({ message: "ERPNext proxy error", error: err.message });
  }
}
