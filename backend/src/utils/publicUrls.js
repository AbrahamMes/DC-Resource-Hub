function parsePublicUrl(name, value) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }
}

export function validateProductionPublicUrls({ frontendUrl, callbackUrl, allowInsecureLocalhost = false }) {
  const frontend = parsePublicUrl('FRONTEND_URL', frontendUrl);
  const callback = parsePublicUrl('APS_CALLBACK_URL', callbackUrl);
  if (allowInsecureLocalhost) return;

  for (const [name, url] of [['FRONTEND_URL', frontend], ['APS_CALLBACK_URL', callback]]) {
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
    if (local) throw new Error(`${name} must not use localhost in production`);
    if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS in production`);
  }
  if (frontend.origin !== callback.origin) {
    throw new Error('FRONTEND_URL and APS_CALLBACK_URL must use the same public origin');
  }
}
