/**
 * Resend-based email delivery for KeyDir.
 *
 * Sends transactional emails (currently password-reset links) through Resend.
 * The API key is read from `RESEND_API_KEY` on the server only and is never
 * exposed to client bundles.
 *
 * Email rendering lives in Resend (Dashboard > Templates, "KeyDir Password
 * Reset"). This module only passes the dynamic variables (USER_NAME,
 * RESET_URL) and the template ID from `RESEND_PASSWORD_RESET_TEMPLATE_ID`.
 *
 * Development fallback: when no `RESEND_API_KEY` or template ID is configured
 * (or the send fails) and the app is NOT in production, the reset link is
 * appended to a gitignored file (`tmp/reset-links.log`) so the flow can be
 * tested locally. Reset tokens are never written to stdout/stderr logs and
 * never emitted in production.
 */
import { mkdirSync, appendFileSync } from 'node:fs';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// The from-domain must be verified in Resend. `keydir.in` is verified for this
// project; the `app.keydir.in` subdomain is not (sends from it return 403).
const EMAIL_FROM = process.env.EMAIL_FROM || 'KeyDir <noreply@keydir.in>';

const RESET_TEMPLATE_ID = process.env.RESEND_PASSWORD_RESET_TEMPLATE_ID;

function devFallback(to: string, url: string, reason: string) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[KeyDir] ${reason} — password reset email not sent.`);
    return;
  }
  mkdirSync('tmp', { recursive: true });
  appendFileSync(
    'tmp/reset-links.log',
    `${new Date().toISOString()} ${to} ${url}\n`,
  );
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name?: string;
  url: string;
}): Promise<void> {
  const { to, name, url } = params;

  // Safe diagnostics only — the recipient is masked and the reset URL/token
  // are never logged.
  const masked = maskEmail(to);

  if (!resend) {
    console.warn(`[KeyDir] reset email: RESEND_API_KEY not configured (recipient=${masked})`);
    devFallback(to, url, 'RESEND_API_KEY not configured');
    return;
  }

  if (!RESET_TEMPLATE_ID) {
    console.warn(`[KeyDir] reset email: RESEND_PASSWORD_RESET_TEMPLATE_ID not configured (recipient=${masked})`);
    devFallback(to, url, 'RESEND_PASSWORD_RESET_TEMPLATE_ID not configured');
    return;
  }

  console.info(`[KeyDir] reset email: Resend request started (recipient=${masked} from=${EMAIL_FROM.replace(/<[^>]+>/, '<redacted>')})`);
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Reset your KeyDir password',
      template: {
        id: RESET_TEMPLATE_ID,
        variables: {
          USER_NAME: name ?? 'there',
          RESET_URL: url,
        },
      },
    });
    if (error) {
      // Log the Resend delivery error (status + type + message) — none of it
      // contains the reset token, URL, or API key.
      console.warn(
        `[KeyDir] reset email: Resend response status=${error.statusCode ?? 'error'} type=${error.name} message=${error.message} (recipient=${masked})`,
      );
      devFallback(to, url, 'password reset email was rejected by Resend');
      return;
    }
    console.info(
      `[KeyDir] reset email: Resend response status=200 emailId=${data?.id ?? 'unknown'} (recipient=${masked})`,
    );
  } catch (err) {
    console.warn(
      `[KeyDir] reset email: Resend request failed type=${err instanceof Error ? err.name : 'unknown'} message=${err instanceof Error ? err.message : 'unknown'} (recipient=${masked})`,
    );
    devFallback(to, url, 'password reset email failed to send');
  }
}

function maskEmail(email: string): string {
  const idx = email.indexOf('@');
  if (idx <= 0) return '***';
  const local = email.slice(0, idx);
  const domain = email.slice(idx);
  const visible = local.slice(0, 2);
  const rest = local.slice(2);
  return `${visible}${'*'.repeat(Math.max(rest.length, 3))}${domain}`;
}
