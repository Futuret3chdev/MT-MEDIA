import { authenticator } from 'otplib';
import { getSettingValue } from '@/lib/rewards-db';

authenticator.options = { window: 1 };

const ISSUER = 'MemeTorrent Admin';

let cachedSecrets: string[] | null = null;

function parseAdminTotpJson(json: string | null | undefined): string[] {
  const raw = json?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (parsed && typeof parsed === 'object') {
      return [...new Set(Object.values(parsed).map((s) => String(s).trim()).filter((s) => s.length >= 16))];
    }
  } catch {
    /* fall through */
  }
  return [];
}

function secretsFromEnv(): string[] {
  const fromAdmins = parseAdminTotpJson(process.env.ADMIN_TOTP_ADMINS);
  if (fromAdmins.length) return fromAdmins;

  const multi = process.env.ADMIN_TOTP_SECRETS?.trim();
  if (multi) {
    return [...new Set(multi.split(/[,\n]+/).map((s) => s.trim()).filter((s) => s.length >= 16))];
  }

  const single = process.env.ADMIN_TOTP_SECRET?.trim();
  return single && single.length >= 16 ? [single] : [];
}

export async function getAdminTotpSecrets(): Promise<string[]> {
  if (cachedSecrets) return cachedSecrets;

  const envSecrets = secretsFromEnv();
  if (envSecrets.length) {
    cachedSecrets = envSecrets;
    return cachedSecrets;
  }

  const dbJson = await getSettingValue('admin_totp_admins');
  cachedSecrets = parseAdminTotpJson(dbJson);
  return cachedSecrets;
}

export async function isAdmin2faEnabled(): Promise<boolean> {
  if (process.env.REQUIRE_ADMIN_2FA === 'false') return false;
  const secrets = await getAdminTotpSecrets();
  if (secrets.length > 0) return true;
  return process.env.NODE_ENV === 'production' || process.env.REQUIRE_ADMIN_2FA === 'true';
}

export async function admin2faConfigured(): Promise<boolean> {
  return (await getAdminTotpSecrets()).length > 0;
}

export async function verifyAdminTotp(code: string | null | undefined): Promise<boolean> {
  const secrets = await getAdminTotpSecrets();
  if (!secrets.length) {
    return process.env.NODE_ENV !== 'production' && process.env.REQUIRE_ADMIN_2FA !== 'true';
  }
  const token = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) return false;
  return secrets.some((secret) => {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  });
}

export async function admin2faSetupHint(): Promise<{ issuer: string; configured: boolean; admin_count: number }> {
  const secrets = await getAdminTotpSecrets();
  return { issuer: ISSUER, configured: secrets.length > 0, admin_count: secrets.length };
}