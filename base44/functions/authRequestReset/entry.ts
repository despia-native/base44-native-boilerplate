// Custom auth — request a password reset.
// Signs a short-lived reset JWT and emails a link. Always returns success (don't reveal if the email exists).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function b64url(bytes) {
  let str = typeof bytes === 'string' ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function signJwt(payload, secret, expiresInSec) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const enc = new TextEncoder();
  const data = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(body))}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64url(sig)}`;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
    }

    const { email, app_url } = await req.json();
    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();
    const base44 = createClientFromRequest(req);

    const accounts = await base44.asServiceRole.entities.Account.filter({ email: cleanEmail });
    const account = accounts?.[0];

    // Only send if the account exists AND has a password (Google-only accounts skip this),
    // but always return the same generic response.
    if (account && account.password_hash) {
      const secret = Deno.env.get('JWT_SECRET');
      // scope the token to password reset + bind to current hash so used/old links stop working after reset
      const resetToken = await signJwt(
        { sub: account.id, email: account.email, purpose: 'password_reset', ph: account.password_hash.slice(0, 16) },
        secret,
        60 * 30, // 30 minutes
      );

      const base = (app_url || '').replace(/\/$/, '');
      const link = `${base}/reset-password?token=${encodeURIComponent(resetToken)}`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: account.email,
        subject: 'Reset your password',
        body: `Hi ${account.full_name || ''},\n\nWe received a request to reset your password. Click the link below to choose a new one. This link expires in 30 minutes.\n\n${link}\n\nIf you didn't request this, you can safely ignore this email.`,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});