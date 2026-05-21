export default {
  async fetch(request, env) {
    const accept = request.headers.get('Accept') || '';

    // Markdown for Agents: if the client requests markdown, serve
    // the raw agent trading guide with proper Content-Type.
    if (accept.includes('text/markdown')) {
      const url = new URL(request.url);
      // Map common entry points to their markdown equivalents
      const markdownPaths = {
        '/': '/AGENT_TRADING.md',
        '/docs/': '/AGENT_TRADING.md',
        '/docs/11-agent-trading/': '/AGENT_TRADING.md',
      };
      const redirect = markdownPaths[url.pathname];
      if (redirect) {
        url.pathname = redirect;
        const mdRequest = new Request(url, request);
        const response = await env.ASSETS.fetch(mdRequest);
        return new Response(response.body, {
          status: response.status,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // Default: pass through to static assets
    return await env.ASSETS.fetch(request);
  },
};
