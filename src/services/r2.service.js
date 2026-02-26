import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { r2Config } from '../config/r2.js';
import { randomUUID } from 'crypto';
import { PassThrough } from 'stream';
import path from 'path';

class R2Service {
  constructor() {
    this.client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });
  }

  uploadFile(file, folder = 'uploads', key) {
    if (!key) throw new Error('Key is required for upload');

    return new Promise((resolve, reject) => {
      let size = 0;
      const pass = new PassThrough();

      file.file.on('data', (chunk) => {
        size += chunk.length;
      });

      // Fires when @fastify/multipart hits the fileSize limit — abort before
      // a partial/corrupt object is committed to R2
      file.file.once('limit', () => {
        pass.destroy(new Error('__truncated__'));
        reject(new Error('File too large'));
      });

      file.file.pipe(pass);

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: r2Config.bucketName,
          Key: key,
          Body: pass,
          ContentType: file.mimetype,
          Metadata: {
            originalName: encodeURIComponent(file.filename),
            uploadDate: new Date().toISOString(),
          },
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
        leavePartsOnError: false,
      });

      upload
        .done()
        .then(() =>
          resolve({
            key,
            filename: path.basename(key),
            originalName: file.filename,
            mimetype: file.mimetype,
            size,
            url: `https://${r2Config.publicPath}/${key}`,
          }),
        )
        .catch(reject);
    });
  }

  async deleteFile(key) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      }),
    );
  }
}

export default new R2Service();
