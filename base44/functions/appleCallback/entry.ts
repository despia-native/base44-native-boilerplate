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
      return new Response('<!DOCTYPE html><html><body><p>Invalid sign-in state.</p></body></html>', {
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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing you in…</title>
</head>
<body style="margin:0;background:#0d0c10;color:#f4f2ee;font-family:-apple-system,sans-serif;text-align:center">
  <p style="margin-top:42vh;font-size:15px">Signing you in…</p>
  <p><a id="continue" style="display:none;color:#ff5c1f;font-size:16px;font-weight:600;text-decoration:none">Continue to app</a></p>
  <script>
    var deeplink = ${JSON.stringify(deeplink)};
    location.href = deeplink;
    // Custom schemes can require a user gesture — offer a tappable fallback.
    var btn = document.getElementById('continue');
    btn.href = deeplink;
    btn.style.display = 'inline-block';
  </script>
</body>
</html>`;

    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});