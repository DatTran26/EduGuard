const ROLE_CLAIM_KEYS = [
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
  "role",
  "roles",
];

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function parseJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== "string") {
    return null;
  }

  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

export function getAccessTokenRoles(accessToken) {
  const payload = parseJwtPayload(accessToken);
  if (!payload) {
    return [];
  }

  const roles = new Set();

  for (const key of ROLE_CLAIM_KEYS) {
    const value = payload[key];
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((role) => roles.add(String(role)));
      continue;
    }

    roles.add(String(value));
  }

  return [...roles];
}

export function accessTokenHasAnyRole(accessToken, expectedRoles = []) {
  if (!expectedRoles.length) {
    return true;
  }

  const tokenRoles = getAccessTokenRoles(accessToken);
  return expectedRoles.some((role) => tokenRoles.includes(role));
}
