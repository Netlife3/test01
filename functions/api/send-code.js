/**
 * POST /api/send-code — 发送密码重置验证码到绑定邮箱
 */
export async function onRequest(context) {
    const { request, env } = context;
    const kv = env.SITE_DATA_KV;
    const RESEND_KEY = 're_fNn9YP6h_BiFTWty1WK9jEauCVYLg6PVc';

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
    if (!email) {
        return new Response(JSON.stringify({ error: '请输入邮箱' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // 检查是否在冷却期（60秒内只能发一次）
    const cooldownKey = 'pwd_cooldown_' + email;
    const cooldown = await kv.get(cooldownKey);
    if (cooldown) {
        return new Response(JSON.stringify({ error: '请等待 60 秒后再试' }), {
            status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // 验证邮箱是否与站点数据中的邮箱匹配
    const raw = await kv.get('site_data');
    if (!raw) {
        return new Response(JSON.stringify({ error: '未找到站点数据' }), {
            status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    let siteData;
    try { siteData = JSON.parse(raw); } catch {
        return new Response(JSON.stringify({ error: '数据异常' }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    const savedEmail = (siteData.email || '').trim().toLowerCase();
    if (email !== savedEmail) {
        // 故意模糊错误信息，不暴露是否匹配
        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // 生成 6 位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 存入 KV，5 分钟过期
    await kv.put('pwd_code_' + email, code, { expirationTtl: 300 });

    // 设置冷却期
    await kv.put(cooldownKey, '1', { expirationTtl: 60 });

    // 通过 Resend 发送邮件
    try {
        const emailHtml = [
            '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#12121a;color:#f0f0f5;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">',
            '<h2 style="color:#a29bfe;margin:0 0 16px">密码重置</h2>',
            '<p style="color:#8888a0;line-height:1.7;margin:0 0 24px">你正在重置 n3tlife 网站的编辑密码。验证码如下：</p>',
            '<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">',
            '<span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#a29bfe">' + code + '</span>',
            '</div>',
            '<p style="color:#55556a;font-size:0.85rem;line-height:1.6;margin:0">验证码 5 分钟内有效。如果这不是你本人操作，请忽略。</p>',
            '</div>'
        ].join('');

        const resendResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + RESEND_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'n3tlife <noreply@resend.dev>',
                to: [email],
                subject: 'n3tlife 密码重置验证码',
                html: emailHtml,
            }),
        });

        if (!resendResp.ok) {
            // 发邮件失败但验证码已存，通知用户重试
            await kv.delete('pwd_code_' + email);
            await kv.delete(cooldownKey);
            return new Response(JSON.stringify({ error: '邮件发送失败，请稍后重试' }), {
                status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
    } catch (e) {
        await kv.delete('pwd_code_' + email);
        await kv.delete(cooldownKey);
        return new Response(JSON.stringify({ error: '邮件发送失败，请稍后重试' }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
