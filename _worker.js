// _worker.js - 用于托管 Hugo 静态文件的极简 Worker
export default {
  async fetch(request, env) {
    // 1. 获取请求的路径
    const url = new URL(request.url);
    let path = url.pathname;

    // 2. 默认首页
    if (path.endsWith('/')) {
      path += 'index.html';
    } else if (!path.includes('.')) {
      // 如果是没有扩展名的路径，也尝试添加 .html，或重定向到友好URL
      // 根据Hugo的页面渲染方式，这里直接尝试.html
      path += '.html';
    }

    // 3. 从 Pages 的构建输出中获取对应的静态文件
    // `env.ASSETS` 是 Cloudflare Pages 自动注入的、指向你 `public` 目录的对象
    try {
      const file = await env.ASSETS.fetch(new URL(path, url.origin));
      if (file.status !== 404) {
        return file;
      }
    } catch (e) {
      console.error(e);
    }

    // 4. 如果文件未找到，则返回 404 页面，如果存在的话
    try {
      const notFoundFile = await env.ASSETS.fetch(new URL('/404.html', url.origin));
      return new Response(notFoundFile.body, { ...notFoundFile, status: 404 });
    } catch (e) {
      // 如果连 404.html 都没有，返回一个简单的错误信息
      return new Response('页面未找到', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  }
};
