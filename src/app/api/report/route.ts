/**
 * User reporting API. Creates a report (page / product / sound test issue)
 * tied to the authenticated profile, with a 5-per-hour spam limit per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { ReportType } from '@prisma/client';

const REPORT_TYPES = new Set<ReportType>(['PAGE_ISSUE', 'PRODUCT_ISSUE', 'SOUND_TEST_ISSUE']);
const PRODUCT_REASONS = new Set(['INCORRECT_SPECS', 'MISSING_INFO', 'WRONG_PRICING', 'DUPLICATE_PRODUCT', 'BROKEN_LINKS', 'OTHER']);
const MAX_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_PAGE_URL = 2048;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reject oversized bodies before JSON.parse — content-length is untrusted
  // but a huge claim here only makes us refuse earlier than necessary.
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const type = String(body.type ?? '') as ReportType;
    const pageUrl = String(body.page_url ?? '').trim();
    const message = String(body.message ?? '').trim();
    const reason = body.reason ? String(body.reason) : null;
    const productId = body.product_id ? String(body.product_id) : null;
    const soundTestId = body.sound_test_id ? String(body.sound_test_id) : null;

    if (!REPORT_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
    if (!pageUrl) {
      return NextResponse.json({ error: 'Page URL is required' }, { status: 400 });
    }
    if (pageUrl.length > MAX_PAGE_URL) {
      return NextResponse.json({ error: 'Page URL is too long' }, { status: 400 });
    }
    if (type === 'PRODUCT_ISSUE') {
      if (!reason || !PRODUCT_REASONS.has(reason)) {
        return NextResponse.json({ error: 'Valid reason is required' }, { status: 400 });
      }
      if (reason === 'OTHER' && !message) {
        return NextResponse.json({ error: 'Message is required for this reason' }, { status: 400 });
      }
      if (message.length > 2000) {
        return NextResponse.json({ error: 'Message is too long (max 2000 chars)' }, { status: 400 });
      }
    } else if (!message || message.length > 2000) {
      return NextResponse.json({ error: 'Message is required (max 2000 chars)' }, { status: 400 });
    }
    if (type === 'PRODUCT_ISSUE' && !productId) {
      return NextResponse.json({ error: 'Product is required for this report type' }, { status: 400 });
    }
    if (type === 'SOUND_TEST_ISSUE' && !soundTestId) {
      return NextResponse.json({ error: 'Sound test is required for this report type' }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
    }

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 400 });
      }
    }
    if (soundTestId) {
      const test = await prisma.soundTest.findUnique({ where: { id: soundTestId }, select: { id: true } });
      if (!test) {
        return NextResponse.json({ error: 'Sound test not found' }, { status: 400 });
      }
    }

    const hourAgo = new Date(Date.now() - HOUR_MS);
    const recentCount = await prisma.report.count({
      where: { profileId: profile.id, createdAt: { gte: hourAgo } },
    });
    if (recentCount >= MAX_PER_HOUR) {
      return NextResponse.json({ error: 'Report limit reached — try again later' }, { status: 429 });
    }

    const report = await prisma.report.create({
      data: {
        type,
        productId,
        soundTestId,
        pageUrl,
        message,
        reason,
        profileId: profile.id,
      },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (e) {
    console.error('Report create failed', e);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
