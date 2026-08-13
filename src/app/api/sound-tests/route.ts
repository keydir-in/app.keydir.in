import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canUploadSoundTests } from '@/lib/auth/actions';
import { prisma } from '@/lib/prisma';
import { cloudinary } from '@/lib/cloudinary';
import { uploadSoundTest } from '@/lib/services/sound-test-service';
import { CACHE, invalidateTags } from '@/lib/cache';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
// Audio is capped at 2MB; allow headroom for the multipart form + text fields
// so a valid upload never bounces, but stop a multi-GB body before formData()
// buffers it all in memory.
const MAX_FORM_BYTES = 4 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/x-pn-wav', 'audio/x-m4a', 'audio/mp4']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'm4a']);
const SOUND_TEST_TYPES = new Set(['keyboards', 'switches']);

function optional(formData: FormData, key: string): string | null {
  const value = (formData.get(key) as string) || '';
  const trimmed = value.trim();
  return trimmed || null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const canUpload = await canUploadSoundTests(user.id, profile?.isVerified ?? false);
  if (!canUpload) {
    return NextResponse.json({ error: 'Complete your auth setup (password, Google & Discord) to upload sound tests' }, { status: 403 });
  }

  const existingCount = await prisma.soundTest.count({ where: { profileId: profile!.id } });
  if (existingCount >= 10) {
    return NextResponse.json({ error: 'Sound test limit reached — you can upload up to 10' }, { status: 400 });
  }

  try {
    // Reject oversized multipart bodies before formData() reads them into memory.
    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_FORM_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('audio') as File | null;
    const productId = (formData.get('productId') as string) || '';
    const switchId = optional(formData, 'switchId');
    const switchName = optional(formData, 'switchName');

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!AUDIO_TYPES.has(file.type) && !AUDIO_EXTS.has(ext ?? '')) {
      return NextResponse.json({ error: 'Only MP3, WAV, M4A allowed' }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 });
    }
    if (!switchId && !switchName) {
      return NextResponse.json({ error: 'Pick a switch or enter a switch name' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, slug: true, productType: true } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 });
    }
    if (!SOUND_TEST_TYPES.has(product.productType)) {
      return NextResponse.json({ error: 'Sound tests are only supported for keyboards and switches' }, { status: 400 });
    }

    // Keyboard products: name comes from the product itself. Switch products:
    // the switch is the product, so the user types the keyboard they tested.
    const keyboardName = optional(formData, 'keyboardName');
    if (product.productType === 'switches' && !keyboardName) {
      return NextResponse.json({ error: 'Keyboard name is required' }, { status: 400 });
    }

    let resolvedSwitch: { id: string; name: string } | null = null;
    if (switchId) {
      // A switch product links itself as the switch; a keyboard links a
      // switch product picked from the searchable list.
      resolvedSwitch = await prisma.product.findUnique({
        where: { id: switchId, productType: 'switches' },
        select: { id: true, name: true },
      });
      if (!resolvedSwitch) {
        return NextResponse.json({ error: 'Switch not found' }, { status: 400 });
      }
    }

    const { url, publicId, duration } = await uploadSoundTest(file, product.id, user.id);

    const record = await prisma.soundTest.create({
      data: {
        productId,
        profileId: profile!.id,
        audioUrl: url,
        publicId,
        duration,
        keyboardName: keyboardName ?? product.name,
        foamUsed: optional(formData, 'foamUsed'),
        pcbDetails: optional(formData, 'pcbDetails'),
        plate: optional(formData, 'plate'),
        switchId: resolvedSwitch?.id ?? null,
        switchName: resolvedSwitch ? null : switchName,
        springWeight: optional(formData, 'springWeight'),
        isLubed: formData.get('isLubed') === 'true',
        isFilmed: formData.get('isFilmed') === 'true',
        otherMods: optional(formData, 'otherMods'),
        keycapsName: optional(formData, 'keycapsName'),
        keycapsMaterial: optional(formData, 'keycapsMaterial'),
        keycapsProfile: optional(formData, 'keycapsProfile'),
        additionalMods: optional(formData, 'additionalMods'),
      },
      include: { profile: { select: { username: true } } },
    }).catch(async (e) => {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      throw e;
    });

    invalidateTags(CACHE.soundTests(product.slug));
    revalidatePath(`/products/${product.slug}`);
    revalidatePath(`/profile/${profile!.username}`);
    return NextResponse.json(
      {
        id: record.id,
        audioUrl: record.audioUrl,
        duration: record.duration,
        keyboardName: record.keyboardName,
        foamUsed: record.foamUsed,
        pcbDetails: record.pcbDetails,
        plate: record.plate,
        switchName: resolvedSwitch?.name ?? record.switchName,
        springWeight: record.springWeight,
        isLubed: record.isLubed,
        isFilmed: record.isFilmed,
        otherMods: record.otherMods,
        keycapsName: record.keycapsName,
        keycapsMaterial: record.keycapsMaterial,
        keycapsProfile: record.keycapsProfile,
        additionalMods: record.additionalMods,
        createdAt: record.createdAt.toISOString(),
        username: record.profile.username,
        profileId: record.profileId,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
