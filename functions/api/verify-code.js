/**
 * POST /api/verify-code — 验证码校验并重置密码
 */
export async function onRequest(context) {
    const { request, env } = context;
    const kv = env.SITE_DATA_KV;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    let body;
    try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: '无效的 JSON' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();

    if (!email || !code) {
        return new Response(JSON.stringify({ error: '参数不完整' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // 检查尝试次数限制
    const attemptsKey = 'pwd_attempts_' + email;
    const attempts = parseInt(await kv.get(attemptsKey) || '0');
    if (attempts >= 5) {
        return new Response(JSON.stringify({ error: '尝试次数过多，请 5 分钟后重试' }), {
            status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // 验证码校验
    const storedCode = await kv.get('pwd_code_' + email);
    if (!storedCode || storedCode !== code) {
        await kv.put(attemptsKey, String(attempts + 1), { expirationTtl: 300 });
        return new Response(JSON.stringify({ error: '验证码错误' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // 验证通过，重置密码
    const raw = await kv.get('site_data');
    if (raw) {
        try {
            const siteData = JSON.parse(raw);
            siteData._pwd = 'admin123';
            await kv.put('site_data', JSON.stringify(siteData));
        } catch {
            return new Response(JSON.stringify({ error: '数据异常，请重试' }), {
                status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
    }

    // 清理验证码和尝试记录
    await kv.delete('pwd_code_' + email);
    await kv.delete(attemptsKey);
    await kv.delete('pwd_cooldown_' + email);

    return new Response(JSON.stringify({ ok: true, password: 'admin123' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
