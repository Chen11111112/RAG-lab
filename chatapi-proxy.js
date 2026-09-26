export default {
    async fetch(request, env, ctx) {
      const targetBaseUrl = "https://chatapi.ntubimdbirc.tw";
      const url = new URL(request.url);
      const targetUrl = targetBaseUrl + url.pathname + url.search;
  
      const newHeaders = new Headers(request.headers);
      newHeaders.set("Host", "chatapi.ntubimdbirc.tw");
  
      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow"
      });
  
      try {
        const response = await fetch(modifiedRequest);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Proxy Error", details: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    },
  };