import { NextRequest } from 'next/server';
import {
  adminSecurityHeaders,
  checkAdminRateLimit,
  geoBlockedResponse,
  isAustralianRequest,
  issueAdminSessionToken,
  rateLimitedResponse,
  verifyStaffKey,
} from '@/lib/admin-security';
import {
  admin2faConfigured,
  admin2faSetupHint,
  isAdmin2faEnabled,
  verifyAdminTotp,
} from '@/lib/admin-totp';

export async function GET(request: NextRequest) {
  try {
    if (!isAustralianRequest(request)) return geoBlockedResponse();
    const hint = await admin2faSetupHint();
    return Response.json(
      {
        requires_2fa: await isAdmin2faEnabled(),
        totp_configured: hint.configured,
        admin_count: hint.admin_count,
        issuer: hint.issuer,
      },
      { headers: adminSecurityHeaders() }
    );
  } catch (err: unknown) {
    console.error('admin auth GET', err);
    return Response.json(
      { error: 'server_error', message: 'Admin config unavailable.' },
      { status: 500, headers: adminSecurityHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAustralianRequest(request)) return geoBlockedResponse();
    if (!checkAdminRateLimit(request)) return rateLimitedResponse();

    let body: { staff_key?: string; totp_code?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: adminSecurityHeaders() });
    }

    const key = String(body?.staff_key || '').trim();
    if (!verifyStaffKey(key)) {
      return Response.json(
        { error: 'unauthorized', message: 'Invalid staff credentials.' },
        { status: 401, headers: adminSecurityHeaders() }
      );
    }

    if (await isAdmin2faEnabled()) {
      if (!(await admin2faConfigured())) {
        return Response.json(
          {
            error: '2fa_not_configured',
            message: 'ADMIN_TOTP_ADMINS must be set on the server before admin login is allowed.',
          },
          { status: 503, headers: adminSecurityHeaders() }
        );
      }
      if (!(await verifyAdminTotp(body?.totp_code))) {
        return Response.json(
          { error: 'invalid_2fa', message: 'Invalid or expired authenticator code.' },
          { status: 401, headers: adminSecurityHeaders() }
        );
      }
    }

    const session = await issueAdminSessionToken();
    return Response.json(
      {
        success: true,
        token: session.token,
        expires_at: session.expires_at,
        region: 'AU',
        mfa: true,
      },
      { headers: adminSecurityHeaders() }
    );
  } catch (err: unknown) {
    console.error('admin auth POST', err);
    return Response.json(
      { error: 'server_error', message: 'Admin login failed. Try again or contact support.' },
      { status: 500, headers: adminSecurityHeaders() }
    );
  }
}