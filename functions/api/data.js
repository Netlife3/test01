/**
 * Cloudflare Pages Function — 数据持久化 API
 *
 * 使用前需要在 Cloudflare Dashboard 创建 KV namespace：
 *   Pages 项目 → Settings → Functions → KV Namespace Bindings
 *   变量名: SITE_DATA_KV
 *
 * GET  /api/data  → 读取数据
 * POST /api/data  → 保存数据
 */

export async function onRequest(context) {
    const { request, env } = context;
    const kv = env.SITE_DATA_KV;

    // CORS headers (允许所有来源)
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS' || request.method === 'HEAD') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET') {
        const raw = await kv.get('site_data');
        const data = raw ? JSON.parse(raw) : null;
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    if (request.method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(JSON.stringify({ error: '无效的 JSON' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
        await kv.put('site_data', JSON.stringify(body));
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
