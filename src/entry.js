export default {
  async fetch(request, env, ctx) {
    const accept = request.headers.get('Accept') || '';

    if (accept.includes('text/markdown')) {
      return new Response('# Testudo Agent Trading Guide\n\nMarkdown negotiation is working.', {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return await env.ASSETS.fetch(request);
  },
};
