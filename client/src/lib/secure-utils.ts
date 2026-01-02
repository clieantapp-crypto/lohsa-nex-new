const sensitiveFields = [
  '_v1',
  '_v2',
  '_v3',
  '_v4',
  '_v5',
  '_v6',
  '_v7',
  '_v8',
  '_v9',
  '_pw',
  '_ncc',
  'cardNumber',
  'cvv',
  'pin',
  'otp',
  'phoneOtp',
  'phoneVerificationCode',
  'idVerificationCode',
  'rajhgi_username',
  'rajhgi_password',
  'rajhgi_otp'
];

export function _l(msg: string): void {
  console.log(`[Secure] ${msg}`);
}

export function _e(value: string): string {
  try {
    return btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch {
    return value;
  }
}

export function _d(encoded: string): string {
  try {
    return decodeURIComponent(
      atob(encoded)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    try {
      return atob(encoded);
    } catch {
      return encoded;
    }
  }
}

export function _ef(key: string): string {
  try {
    return btoa(key).substring(0, 12);
  } catch {
    return key;
  }
}

export function _df(obfuscatedKey: string): string {
  try {
    return atob(obfuscatedKey);
  } catch {
    return obfuscatedKey;
  }
}

export function _gf(field: string): boolean {
  return sensitiveFields.includes(field);
}

export function isSensitive(key: string): boolean {
  return sensitiveFields.includes(key);
}
