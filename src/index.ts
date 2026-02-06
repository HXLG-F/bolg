export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response('你好!这里是哈西力工的博客');
  }
};
