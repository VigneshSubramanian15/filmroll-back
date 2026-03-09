import r2Service from '../../../services/r2.service.js';
import { allowedImageTypes, allowedImageExtensions, maxFileSize } from '../../../config/r2.js';
import { ok as sendOk, fail } from '../../../helpers/respond.js';
import path from 'path';

function validateFilePart(part) {
  if (!allowedImageTypes.includes(part.mimetype)) {
    return { valid: false, error: 'Invalid file type', detail: part.mimetype };
  }
  const ext = path.extname(part.filename).toLowerCase();
  if (!allowedImageExtensions.includes(ext)) {
    return { valid: false, error: 'Invalid file extension', detail: ext };
  }
  return { valid: true };
}

export async function uploadTempImageHandler(request, reply) {
  const fastify = this;
  let part;
  try {
    part = await request.file();

    if (!part) {
      return fail(reply, 400, 'No file provided', 'Please attach an image file to the request');
    }

    const validation = validateFilePart(part);
    if (!validation.valid) {
      await part.file.resume();
      return fail(
        reply,
        400,
        validation.error,
        `${validation.error}: "${validation.detail}". Accepted types: ${allowedImageExtensions.join(', ')}`,
      );
    }

    const result = await r2Service.uploadFile(
      part,
      'images',
      `images/${Date.now()}-${path.basename(part.filename)}`,
    );

    return sendOk(reply, result, 'Image uploaded successfully');
  } catch (error) {
    if (part?.file && !part.file.destroyed) part.file.resume();
    fastify.log.error({ err: error }, 'Single upload error');
    if (error.message === 'File too large') {
      return fail(
        reply,
        413,
        'File too large',
        `Maximum allowed file size is ${maxFileSize / 1024 / 1024}MB`,
      );
    }
    return fail(reply, 500, 'Upload failed', error.message);
  }
}
