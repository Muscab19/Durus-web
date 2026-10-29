import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
  // R2 requires path-style addressing for multer-s3
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export const R2_BUCKET = env.r2.bucketName;
export const R2_PUBLIC_URL = (env.r2.publicUrl || '').replace(/\/+$/, '');