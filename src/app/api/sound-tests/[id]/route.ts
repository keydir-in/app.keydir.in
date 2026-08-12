import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { cloudinary } from '@/lib/cloudinary';
import { getCurrentUser } from '@/lib/auth/actions';
import { CACHE, invalidateTags } from '@/lib/cache';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile, currentUser] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    getCurrentUser(),
  ]);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const test = await prisma.soundTest.findUnique({
    where: { id },
    include: { product: { select: { slug: true } }, profile: { select: { username: true } } },
  });
  if (!test) {
    return NextResponse.json({ error: 'Sound test not found' }, { status: 404 });
  }

  const isAdmin = currentUser?.isAdmin ?? false;
  if (test.profileId !== profile.id && !isAdmin) {
    return NextResponse.json({ error: 'You can only delete your own sound tests' }, { status: 403 });
  }

  try {
    if (test.publicId) {
      await cloudinary.uploader.destroy(test.publicId, { resource_type: 'video' });
    }
    await prisma.soundTest.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  invalidateTags(CACHE.soundTests(test.product.slug));
  revalidatePath(`/products/${test.product.slug}`);
  revalidatePath(`/profile/${test.profile.username}`);
  return NextResponse.json({ ok: true });
}
