function parsePublicUrl(name, value) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }
}

export function validateProductionPublicUrls({ frontendUrl, callbackUrl, allowInsecureHttp = false }) {
  const frontend = parsePublicUrl('FRONTEND_URL', frontendUrl);
  const callback = parsePublicUrl('APS_CALLBACK_URL', callbackUrl);

  for (const [name, url] of [['FRONTEND_URL', frontend], ['APS_CALLBACK_URL', callback]]) {
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
    if (!allowInsecureHttp && local) throw new Error(`${name} must not use localhost in secure production mode`);
    if (!allowInsecureHttp && url.protocol !== 'https:') {
      throw new Error(`${name} must use HTTPS unless ALLOW_INSECURE_HTTP=true`);
    }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`${name} must use HTTP or HTTPS`);
  }
  if (frontend.origin !== callback.origin) {
    throw new Error('FRONTEND_URL and APS_CALLBACK_URL must use the same public origin');
  }
}
