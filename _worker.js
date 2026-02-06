// _worker.js - 不使用 env.ASSETS 的版本
// 此版本假设所有静态文件已通过构建命令直接输出到部署根目录
export default {
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // 定义请求对应的实际文件路径映射规则
    let filePath;
    if (pathname === '/') {
      filePath = '/index.html';
    } else if (pathname.endsWith('/')) {
      // 处理类似 /about/ 的路径
      filePath = pathname + 'index.html';
    } else if (!pathname.includes('.')) {
      // 处理类似 /about 的路径 (Hugo生成的是 /about/index.html)
      filePath = pathname + '/index.html';
    } else {
      // 处理静态资源，如 /style.css, /favicon.ico
      filePath = pathname;
    }

    // 使用 fetch 直接获取当前域下的文件（这依赖于文件被正确部署）
    // 注意：这要求你的文件确实存在于部署环境中
    let response = await fetch(new URL(filePath, url.origin));

    // 如果没找到，尝试直接获取路径（作为备用）
    if (response.status === 404 && !filePath.endsWith('/index.html')) {
      response = await fetch(new URL(pathname, url.origin));
    }

    // 如果找到了，返回文件
    if (response.status === 200) {
      // 复制响应以修改 headers
      const newResponse = new Response(response.body, response);
      if (filePath.endsWith('.html')) {
        newResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
      }
      return newResponse;
    }

    // 最终返回 404
    return new Response('页面未找到', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};
