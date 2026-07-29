import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isInternalRoute } from "@/lib/auth/utils";
import { checkAndGrantReward } from "@/lib/auth/actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = isInternalRoute(rawNext) ? rawNext : "/";

  const providerError = searchParams.get("error");
  const providerErrorCode = searchParams.get("error_code");

  if (providerError) {
    if (providerErrorCode === "signup_disabled") {
      return NextResponse.redirect(`${origin}/auth/login?error=signup_disabled`);
    }
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
    }

    const email = user.email;
    const provider = (user.app_metadata?.provider as string) ?? "unknown";

    if (!email) {
      return NextResponse.redirect(
        `${origin}/auth/complete-registration?provider=${encodeURIComponent(provider)}&next=${encodeURIComponent(next)}`
      );
    }

    let profile: { registrationComplete: boolean } | null = null;
    try {
      profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { registrationComplete: true },
      });
    } catch {
      return NextResponse.redirect(
        `${origin}/auth/complete-registration?provider=${encodeURIComponent(provider)}&next=${encodeURIComponent(next)}`
      );
    }

    if (!profile || !profile.registrationComplete) {
      return NextResponse.redirect(
        `${origin}/auth/complete-registration?provider=${encodeURIComponent(provider)}&next=${encodeURIComponent(next)}`
      );
    }

    // Fire-and-forget: grant reward without blocking the redirect
    checkAndGrantReward(user.id).catch(() => {});

    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
  }
}
