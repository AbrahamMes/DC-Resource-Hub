import axios from 'axios';
import config from '../config/config.js';

const REFRESH_SKEW_MS = 5 * 60 * 1000;

export async function refreshAutodeskTokens(sessionData) {
  if (!sessionData?.refreshToken) {
    const error = new Error('No saved Autodesk refresh token is available');
    error.needsAuth = true;
    throw error;
  }

  try {
    const response = await axios.post(
      config.aps.tokenUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: sessionData.refreshToken,
        client_id: config.aps.clientId,
        client_secret: config.aps.clientSecret
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    sessionData.accessToken = access_token;
    sessionData.refreshToken = refresh_token || sessionData.refreshToken;
    sessionData.expiresAt = new Date(Date.now() + Number(expires_in) * 1000).toISOString();
    return sessionData.accessToken;
  } catch (error) {
    if ([400, 401, 403].includes(error.response?.status)) {
      error.needsAuth = true;
    }
    throw error;
  }
}

export async function getValidAccessToken(sessionData) {
  const expiresAt = new Date(sessionData?.expiresAt || 0).getTime();
  const tokenIsUsable = sessionData?.accessToken &&
    Number.isFinite(expiresAt) && expiresAt > Date.now() + REFRESH_SKEW_MS;

  if (tokenIsUsable) return sessionData.accessToken;
  return refreshAutodeskTokens(sessionData);
}

export function tokenErrorMessage(error) {
  return error.response?.data?.developerMessage ||
    error.response?.data?.details ||
    error.response?.data?.message ||
    error.response?.data?.title ||
    error.message ||
    'Autodesk token refresh failed';
}

