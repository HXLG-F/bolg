// _worker.js - 增强版，更好地处理 Hugo 生成的路径
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // 处理尾部斜杠：移除非根路径的斜杠
    if (pathname.endsWith('/') && pathname !== '/') {
      pathname = pathname.slice(0, -1);
    }

    // 策略1: 尝试访问 pathname/index.html (对应 /about/ 访问 /about/index.html)
    let response = await env.ASSETS.fetch(new URL(pathname + '/index.html', url.origin));
    
    // 策略2: 如果没找到，尝试直接访问原始路径 (对应 /favicon.ico)
    if (response.status === 404) {
      response = await env.ASSETS.fetch(new URL(pathname, url.origin));
    }
    
    // 如果找到了，直接返回
    if (response.status !== 404) {
      // 对于 HTML 文件，确保字符集正确
      if (response.headers.get('content-type')?.includes('text/html')) {
        const newHeaders = new Headers(response.headers);
        newHeaders.set('content-type', 'text/html; charset=utf-8');
        return new Response(response.body, { ...response, headers: newHeaders });
      }
      return response;
    }

    // 策略3: 如果都未找到，返回 404 页面
    const notFoundResponse = await env.ASSETS.fetch(new URL('/404.html', url.origin));
    if (notFoundResponse.status !== 404) {
      return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 });
    }

    // 策略4: 连 404.html 都没有，返回简单文本
    return new Response('页面未找到', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
};
