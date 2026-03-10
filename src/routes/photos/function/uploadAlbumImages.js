import r2Service from '../../../services/r2.service.js';
import { allowedImageTypes, allowedImageExtensions, maxFileSize } from '../../../config/r2.js';
import { ok as sendOk, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';
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

export async function uploadAlbumImagesHandler(request, reply) {
  const fastify = this;

  // 1. Auth — extract studioId from the JWT
  const auth = await requireAuth(request, reply);
  if (!auth) return;
  const { studioId } = auth;

  const projectId = Number(request.query.projectId);
  const folderId = request.query.folderId ? Number(request.query.folderId) : null;

  // 2. Verify the project belongs to this studio
  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      `SELECT id FROM projects WHERE id = $1 AND studio_id = $2 AND is_deleted = FALSE`,
      [projectId, studioId],
    );
    if (rows.length === 0) {
      return fail(
        reply,
        403,
        'Forbidden',
        'Project does not belong to your studio or does not exist',
      );
    }
    console.log(`Project ${projectId} verified for studio ${studioId}`, folderId);
    // Verify folder belongs to the project (if folderId is provided)
    if (folderId) {
      console.log(`test condition`, folderId);
      const { rows: folderRows } = await client.query(
        `SELECT id FROM project_folders WHERE id = $1 AND project_id = $2`,
        [folderId, projectId],
      );
      if (folderRows.length === 0) {
        return fail(
          reply,
          400,
          'Bad Request',
          'Folder does not exist or does not belong to this project',
        );
      }
    }

    // 3. Get the current max sequence_id for this project
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(sequence_id), 0) AS max_seq FROM photos WHERE project_id = $1`,
      [projectId],
    );
    let nextSeq = seqResult.rows[0].max_seq + 1;

    // 4. Stream and upload files
    const uploadTasks = [];
    const validationErrors = [];

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

      const r2Path = folderId ? `${folderId}` : `root`;
      const customKey = `studios/${studioId}/projects/${projectId}/${r2Path}/${Date.now()}-${baseName}${ext}`;
      const assignedSeq = nextSeq++;

      const task = r2Service
        .uploadFile(partRef, null, customKey)
        .then((result) => ({
          ok: true,
          data: {
            key: result.key,
            size: result.size,
            originalName: result.originalName,
            sequenceId: assignedSeq,
          },
        }))
        .catch((err) => {
          const isTooLarge = err.message === 'File too large';
          return {
            ok: false,
            filename: partRef.filename,
            error: isTooLarge ? `File too large (max ${maxFileSize / 1024 / 1024}MB)` : err.message,
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

    // 5. Insert each uploaded photo into the DB
    const insertQuery = `
      INSERT INTO photos (name, key, studio_id, project_id, folder_id, size, sequence_id, compressed_key, compressed_size)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL)
    `;
    for (const item of succeeded) {
      await client.query(insertQuery, [
        item.originalName,
        item.key,
        studioId,
        projectId,
        folderId,
        item.size,
        item.sequenceId,
      ]);
    }

    // 6. Generate signed URLs for each uploaded file
    const responseData = await Promise.all(
      succeeded.map(async (item) => ({
        url: await r2Service.getSignedUrl(item.key),
        label: item.originalName,
        mimetype: item.mimetype,
        size: item.size,
        sequenceId: item.sequenceId,
      })),
    );

    return sendOk(
      reply,
      {
        uploaded: responseData.length,
        data: responseData,
        errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      },
      `${responseData.length} image(s) uploaded successfully`,
    );
  } catch (error) {
    fastify.log.error({ err: error }, 'Album upload error');
    return fail(reply, 500, 'Upload failed', error.message);
  } finally {
    client.release();
  }
}
