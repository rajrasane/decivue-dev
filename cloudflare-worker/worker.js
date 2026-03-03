// Cloudflare Worker — Supabase Proxy for Decivue
// This worker proxies all requests to Supabase, bypassing ISP blocks in India.

const SUPABASE_URL = "https://wkreyohgmiokrbsaalky.supabase.co";

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // Build the target Supabase URL
        const targetUrl = SUPABASE_URL + url.pathname + url.search;

        // Clone headers and fix the Host header
        const headers = new Headers(request.headers);
        headers.set("Host", new URL(SUPABASE_URL).host);

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        // Forward the request to Supabase
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        });

        // Clone the response and add CORS headers
        const newResponse = new Response(response.body, response);
        newResponse.headers.set("Access-Control-Allow-Origin", "*");
        newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

        return newResponse;
    },
};
