'use server';

/**
 * Server actions for banner CRUD, scheduling, and display rule management.
 * Supports multi-location placement, view/click tracking, and banner duplication.
 * Exports: createBanner, updateBanner, deleteBanner, toggleBanner, duplicateBanner, trackBannerView, trackBannerClick, getBannersForLocation
 */

import { requireAdmin } from '@/lib/admin/admin-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BANNERS_TAG, queryBannersForLocation } from '@/lib/services/catalog-banners';
import { invalidateTags } from '@/lib/cache';

const LOCATIONS = ['home', 'keyboards', 'switches', 'keycaps', 'mouse', 'vendors', 'builders', 'brands', 'search', 'guide', 'about'] as const;

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string) || '';
}

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on';
}

function opt(formData: FormData, key: string): string | null {
  const v = formData.get(key) as string;
  return v || null;
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const v = formData.get(key) as string;
  return v ? new Date(v) : null;
}

function getLocations(formData: FormData): string[] {
  return LOCATIONS.filter((l) => formData.get(`loc_${l}`) === 'on');
}

export async function createBanner(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const title = val(formData, 'title');
  if (!title) return { error: 'Title is required' };

  const locations = getLocations(formData);
  if (locations.length === 0) return { error: 'Select at least one placement' };

  await prisma.banner.create({
    data: {
      title,
      status: val(formData, 'status') || 'draft',
      priority: parseInt(val(formData, 'priority')) || 0,
      startDate: dateOrNull(formData, 'startDate'),
      endDate: dateOrNull(formData, 'endDate'),
      desktopImage: opt(formData, 'desktopImage'),
      mobileImage: opt(formData, 'mobileImage'),
      linkType: val(formData, 'linkType'),
      linkUrl: opt(formData, 'linkUrl'),
      openNewTab: checked(formData, 'openNewTab'),
      displayRule: val(formData, 'displayRule') || 'both',
      bannerType: val(formData, 'bannerType') || 'hero',
      locations: {
        create: locations.map((location) => ({ location })),
      },
    },
  });

  invalidateTags(BANNERS_TAG);
  revalidatePath('/admin/banners');
  redirect('/admin/banners');
}

export async function updateBanner(id: string, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const title = val(formData, 'title');
  if (!title) return { error: 'Title is required' };

  const locations = getLocations(formData);
  if (locations.length === 0) return { error: 'Select at least one placement' };

  await prisma.bannerLocation.deleteMany({ where: { bannerId: id } });

  await prisma.banner.update({
    where: { id },
    data: {
      title,
      status: val(formData, 'status') || 'draft',
      priority: parseInt(val(formData, 'priority')) || 0,
      startDate: dateOrNull(formData, 'startDate'),
      endDate: dateOrNull(formData, 'endDate'),
      desktopImage: opt(formData, 'desktopImage'),
      mobileImage: opt(formData, 'mobileImage'),
      linkType: val(formData, 'linkType'),
      linkUrl: opt(formData, 'linkUrl'),
      openNewTab: checked(formData, 'openNewTab'),
      displayRule: val(formData, 'displayRule') || 'both',
      bannerType: val(formData, 'bannerType') || 'hero',
      locations: {
        create: locations.map((location) => ({ location })),
      },
    },
  });

  invalidateTags(BANNERS_TAG);
  revalidatePath('/');
  revalidatePath('/keyboards');
  revalidatePath('/admin/banners');
  redirect('/admin/banners');
}

export async function deleteBanner(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.banner.delete({ where: { id } });
  invalidateTags(BANNERS_TAG);
  revalidatePath('/admin/banners');
}

export async function toggleBanner(id: string, status: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.banner.update({ where: { id }, data: { status } });
  invalidateTags(BANNERS_TAG);
  revalidatePath('/admin/banners');
}

export async function duplicateBanner(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const original = await prisma.banner.findUnique({
    where: { id },
    include: { locations: true },
  });
  if (!original) return;

  const { id: _, createdAt: _createdAt, updatedAt: _updatedAt, locations, ...rest } = original;
  await prisma.banner.create({
    data: {
      ...rest,
      title: `${rest.title} (Copy)`,
      status: 'draft',
      locations: {
        create: locations.map((l) => ({ location: l.location })),
      },
    },
  });

  invalidateTags(BANNERS_TAG);
  revalidatePath('/admin/banners');
}

export async function trackBannerView(id: string) {
  await prisma.banner.update({
    where: { id },
    data: { totalViews: { increment: 1 } },
  });
}

export async function trackBannerClick(id: string) {
  await prisma.banner.update({
    where: { id },
    data: { totalClicks: { increment: 1 } },
  });
}

export async function getBannersForLocation(location: string) {
  return queryBannersForLocation(location);
}
