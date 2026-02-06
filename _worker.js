// _worker.js - 增强调试版
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log(`[Worker] 请求路径: ${url.pathname}`);

    // 1. 确保 ASSETS 绑定存在
    if (!env || !env.ASSETS) {
      console.error('[Worker] 致命错误: env.ASSETS 未定义！');
      return new Response('服务器配置错误 (ASSETS缺失)', { status: 500 });
    }

    let pathname = url.pathname;
    console.log(`[Worker] 处理路径: ${pathname}`);

    // 2. 路径标准化：处理首页和尾部斜杠
    if (pathname === '/') {
      pathname = '/index.html';
    } else if (!pathname.includes('.')) { // 如果没有文件扩展名，假设是Hugo的页面
      // 处理类似 /about 的路径，Hugo会生成 /about/index.html
      if (!pathname.endsWith('/')) {
        pathname = pathname + '/index.html';
      } else {
        pathname = pathname + 'index.html';
      }
    }
    console.log(`[Worker] 尝试访问文件: ${pathname}`);

    // 3. 尝试获取静态文件
    try {
      // 构建一个相对于部署根目录的URL
      const assetUrl = new URL(pathname, url.origin);
      console.log(`[Worker] 获取资源: ${assetUrl.pathname}`);
      
      const response = await env.ASSETS.fetch(assetUrl);
      console.log(`[Worker] 资源获取状态: ${response.status}`);

      if (response.status >= 200 && response.status < 400) {
        // 成功找到文件，直接返回
        // 复制响应以便修改Header
        const newResponse = new Response(response.body, response);
        // 确保HTML文件有正确的字符集
        if (pathname.endsWith('.html')) {
          newResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
        }
        console.log(`[Worker] 成功返回文件: ${pathname}`);
        return newResponse;
      }
    } catch (error) {
      // 捕获并记录 fetch 过程中的任何异常
      console.error(`[Worker] 获取资源时异常:`, error);
      // 不立即返回，继续尝试 404 页面
    }

    // 4. 如果上述都失败，尝试返回 404.html
    console.log(`[Worker] 主资源未找到，尝试 404.html`);
    try {
      const notFoundResponse = await env.ASSETS.fetch(new URL('/404.html', url.origin));
      if (notFoundResponse.status === 200) {
        console.log(`[Worker] 返回自定义404页面`);
        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 });
      }
    } catch (e) {
      console.error(`[Worker] 获取404页面时异常:`, e);
    }

    // 5. 最终回退
    console.log(`[Worker] 返回基础404响应`);
    return new Response('页面未找到', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};
