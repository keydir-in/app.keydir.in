/**
 * Cloudinary sound test upload service. Audio is uploaded with
 * `resource_type: 'video'` (Cloudinary's category for audio), which
 * returns a `duration` in seconds that we store on the SoundTest row.
 */
import { cloudinary } from '@/lib/cloudinary';
import { soundTestsFolder } from '@/lib/cloudinary-folders';

export interface SoundTestUploadResult {
  url: string;
  publicId: string;
  duration: number;
}

export async function uploadSoundTest(
  file: File,
  productId: string,
  userId: string,
): Promise<SoundTestUploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<SoundTestUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: soundTestsFolder(),
        public_id: `sound_${productId}_${userId}_${Date.now()}`,
        resource_type: 'video',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: typeof result.duration === 'number' ? result.duration : 0,
        });
      },
    );

    uploadStream.end(buffer);
  });

  return result;
}
