import { redirect } from 'next/navigation';

/**
 * Old route for the forgot-password page. The current route is top-level
 * `/forgot-password`; this keeps any old links/redirects working.
 */
export default function LegacyForgotPasswordPage() {
  redirect('/forgot-password');
}
