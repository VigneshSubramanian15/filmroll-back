import r2Service from '../services/r2.service.js';
import { allowedImageTypes, allowedImageExtensions, maxFileSize } from '../config/r2.js';
import { ok as sendOk, fail } from '../helpers/respond.js';
import path from 'path';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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

export default async function uploadRoutes(fastify, options) {
  fastify.post('/upload/image', {
    schema: {
      description: 'Upload a single image file',
      tags: ['Upload'],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                filename: { type: 'string' },
                originalName: { type: 'string' },
                mimetype: { type: 'string' },
                url: { type: 'string' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        413: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
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
    },
  });

  fastify.post('/upload/images', {
    schema: {
      description: 'Upload multiple image files',
      tags: ['Upload'],
      consumes: ['multipart/form-data'],
      querystring: {
        type: 'object',
        required: ['systemId'],
        properties: {
          systemId: {
            type: 'string',
            minLength: 1,
            description: 'System identifier for the upload batch',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            uploaded: { type: 'number' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  filename: { type: 'string' },
                  originalName: { type: 'string' },
                  mimetype: { type: 'string' },
                  size: { type: 'number' },
                  url: { type: 'string' },
                },
              },
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  error: { type: 'string' },
                },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
        413: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      // systemId is guaranteed non-empty by querystring schema validation
      const { systemId } = request.query;
      const uploadTasks = [];
      const validationErrors = [];

      try {
        for await (const part of request.parts()) {
          if (part.type !== 'file') continue;

          const validation = validateFilePart(part);
          if (!validation.valid) {
            await part.file.resume();
            validationErrors.push({
              filename: part.filename,
              error: `${validation.error}: ${validation.detail}`,
            });
            continue;
          }

          const partRef = part;
          const ext = path.extname(partRef.filename);
          const baseName = path.basename(partRef.filename, ext);
          const customKey = `temp/${Date.now()}-${baseName}${ext}`;

          const task = r2Service
            .uploadFile(partRef, null, customKey)
            .then((result) => ({ ok: true, data: { ...result, label: partRef.filename } }))
            .catch((err) => {
              const isTooLarge = err.message === 'File too large';
              return {
                ok: false,
                filename: partRef.filename,
                error: isTooLarge
                  ? `File too large (max ${maxFileSize / 1024 / 1024}MB)`
                  : err.message,
              };
            });

          uploadTasks.push(task);
        }

        if (uploadTasks.length === 0 && validationErrors.length === 0) {
          return fail(reply, 400, 'No files provided', 'Please attach at least one image file');
        }

        const settled = await Promise.all(uploadTasks);
        const succeeded = settled.filter((r) => r.ok).map((r) => r.data);
        const uploadErrors = [
          ...validationErrors,
          ...settled.filter((r) => !r.ok).map((r) => ({ filename: r.filename, error: r.error })),
        ];

        if (succeeded.length === 0) {
          return fail(reply, 400, 'No files uploaded', 'All files failed validation or upload', {
            errors: uploadErrors,
          });
        }

        // Persist to temp_photos
        const client = await fastify.pg.connect();
        try {
          await Promise.all(
            succeeded.map((r) =>
              client.query(
                `INSERT INTO temp_photos (label, key, size, system_id)
               VALUES ($1, $2, $3, $4)`,
                [r.label, r.key, r.size, systemId],
              ),
            ),
          );
        } finally {
          client.release();
        }

        return sendOk(
          reply,
          {
            uploaded: succeeded.length,
            data: succeeded,
            errors: uploadErrors.length > 0 ? uploadErrors : undefined,
          },
          `${succeeded.length} image(s) uploaded successfully`,
        );
      } catch (error) {
        fastify.log.error({ err: error }, 'Multiple upload error');
        return fail(reply, 500, 'Upload failed', error.message);
      }
    },
  });
}
