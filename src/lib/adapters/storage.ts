/**
 * Storage adapter interface. Default is local filesystem (zero external deps);
 * an S3/MinIO adapter implements the same shape for production/self-host.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface StorageAdapter {
  /** Persist bytes and return a URL/path the app can serve or redirect to. */
  put(key: string, data: Buffer, contentType: string): Promise<{ url: string }>;
  remove(key: string): Promise<void>;
}

const LOCAL_DIR = process.env.STORAGE_LOCAL_DIR ?? './uploads';

export const localStorageAdapter: StorageAdapter = {
  async put(key, data) {
    const safeKey = `${randomUUID()}-${path.basename(key)}`;
    const dest = path.join(LOCAL_DIR, safeKey);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
    // Served by a lightweight /api/files route (out of scope for v0.1 seed).
    return { url: `/api/files/${safeKey}` };
  },
  async remove(key) {
    await fs.rm(path.join(LOCAL_DIR, key), { force: true });
  },
};

export function getStorageAdapter(): StorageAdapter {
  switch (process.env.STORAGE_DRIVER) {
    // case 's3': return s3StorageAdapter;
    case 's3':
      // FZ-15: a silent fall-through to the local driver used to write S3-bound
      // uploads onto the container filesystem — data quietly stored somewhere
      // the operator believes it isn't, lost on the next redeploy. Fail loudly
      // instead: an unimplemented driver is a configuration error.
      throw new Error(
        "STORAGE_DRIVER='s3' is not implemented yet. Implement an s3StorageAdapter " +
          "in src/lib/adapters/storage.ts or set STORAGE_DRIVER='local'.",
      );
    case 'local':
    default:
      return localStorageAdapter;
  }
}
