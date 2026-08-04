const UPSTREAM = "https://gateway.umami.is/api/send";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Umami-Website-Id, X-Umami-Hostname, X-Umami-Cache",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const headers = new Headers();
  for (const name of ["content-type", "accept", "accept-language", "user-agent", "x-umami-website-id", "x-umami-hostname", "x-umami-cache"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstream = await fetch(UPSTREAM, {
    method: "POST",
    headers,
    body: await request.arrayBuffer(),
  });

  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: upstream.status,
    headers: {
      ...corsHeaders,
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
