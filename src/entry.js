export default {
  async fetch(request, env, ctx) {
    const accept = request.headers.get('Accept') || '';
    const url = new URL(request.url);

    // Markdown for Agents: intercept Accept: text/markdown and serve
    // the raw agent trading guide regardless of URL path.
    if (accept.includes('text/markdown')) {
      const mdRequest = new Request(new URL('/AGENT_TRADING.md', url), request);
      const response = await env.ASSETS.fetch(mdRequest);
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Default: pass through to static assets
    return await env.ASSETS.fetch(request);
  },
};
