// Apple Sign In return endpoint for the ANDROID Chrome Custom Tabs flow.
//
// Apple hard-requires response_mode=form_post when the name/email scopes are
// requested, and a static HTML file cannot read a POST body — so this backend
// endpoint is the registered Return URL. It reads Apple's form POST
// (id_token, state=<deeplink scheme>, user JSON on FIRST auth only) and
// responds with a tiny HTML bridge page that deeplinks the token back into
// the app: scheme://oauth/auth?id_token=...&full_name=...
//
// This endpoint is intentionally public (Apple calls it, not the app). It only
// RELAYS the id_token — appleSignIn still cryptographically verifies it
// (JWKS signature, iss/aud/exp) before any account is touched.
//
// Register in the Apple Developer Console (Services ID → Return URLs):
//   domain: app.base44.com
//   return URL: https://app.base44.com/api/apps/<APP_ID>/functions/appleCallback

Deno.serve(async (req) => {
  try {
    // Collect params from the form POST (Apple) with a query/JSON fallback (testing).
    const data: Record<string, string> = {};
    if (req.method === 'POST') {
      const ct = req.headers.get('content-type') || '';
      if (ct.includes('json')) {
        const body = await req.json().catch(() => ({}));
        for (const k of Object.keys(body || {})) data[k] = String(body[k]);
      } else {
        const fd = await req.formData().catch(() => null);
        if (fd) for (const [k, v] of fd.entries()) data[k] = String(v);
      }
    }
    const q = new URL(req.url).searchParams;
    const idToken = data.id_token || q.get('id_token') || '';
    const error = data.error || q.get('error') || '';
    const scheme = data.state || q.get('state') || '';

    // Apple sends the user's name ONLY on the very first authorization, as a
    // JSON string in the `user` field of the form POST.
    let fullName = '';
    try {
      const u = JSON.parse(data.user || q.get('user') || '');
      if (u?.name) fullName = `${u.name.firstName || ''} ${u.name.lastName || ''}`.trim();
    } catch { /* no user payload — normal on every sign-in after the first */ }

    // Only relay to a sane custom scheme — this endpoint serves the native
    // deeplink handoff exclusively (iOS/web use the SDK popup, never this URL).
    if (!/^[a-z][a-z0-9+.-]*$/i.test(scheme)) {
      // Direct browser visits (no Apple POST) land here — show a styled page too.
      const invalidHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="dark" />
  <title>Sign-in callback</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      background: #0d0c10;
      color: #f4f2ee;
      font-family: ui-rounded, -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Segoe UI', Roboto, system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; }
    .badge {
      width: 52px; height: 52px; border-radius: 50%;
      background: rgba(255,92,31,.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    h1 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
    p { font-size: 14px; color: rgba(244,242,238,.55); max-width: 280px; line-height: 1.45; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="badge">&#128274;</div>
    <h1>Nothing to see here</h1>
    <p>This page only handles Sign in with Apple redirects from the app. You can close this tab.</p>
  </div>
</body>
</html>`;
      return new Response(invalidHtml, {
        status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const params = new URLSearchParams();
    if (idToken) {
      params.set('id_token', idToken);
      if (fullName) params.set('full_name', fullName);
    } else {
      params.set('error', error || 'no_token');
    }
    const deeplink = `${scheme}://oauth/auth?${params.toString()}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="dark" />
  <title>Signing you in…</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { height: 100%; }
    body {
      background: #0d0c10;
      color: #f4f2ee;
      font-family: ui-rounded, -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Segoe UI', Roboto, system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 24px; }
    .spinner {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,.14);
      border-top-color: #ff5c1f;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
    p { font-size: 14px; color: rgba(244,242,238,.55); max-width: 260px; line-height: 1.45; }
    #continue {
      display: none;
      margin-top: 8px;
      padding: 14px 28px;
      border-radius: 999px;
      background: linear-gradient(180deg, #ff7038, #f04e12);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: inset 0 1px 1px rgba(255,255,255,.45), 0 8px 20px rgba(255,92,31,.28);
    }
    #continue:active { transform: scale(.96); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner" aria-hidden="true"></div>
    <h1>Signing you in…</h1>
    <p>Returning you to the app. If nothing happens, tap the button below.</p>
    <a id="continue">Continue to app</a>
  </div>
  <script>
    var deeplink = ${JSON.stringify(deeplink)};
    location.href = deeplink;
    // Custom schemes can require a user gesture — offer a tappable fallback.
    var btn = document.getElementById('continue');
    btn.href = deeplink;
    setTimeout(function () { btn.style.display = 'inline-block'; }, 800);
  </script>
</body>
</html>`;

    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});