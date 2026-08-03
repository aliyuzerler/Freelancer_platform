import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/**
 * Serve user-uploaded files from STORAGE_LOCAL_DIR (default ./uploads).
 * Path-traversal safe: anything resolving outside the storage root is a 404.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const root = path.resolve(process.env.STORAGE_LOCAL_DIR ?? './uploads');
  const filePath = path.resolve(root, ...segments);

  if (!filePath.startsWith(root + path.sep) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    return new Response('Not found', { status: 404 });
  }

  const nodeStream = createReadStream(filePath);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk) =>
        controller.enqueue(typeof chunk === 'string' ? Buffer.from(chunk) : new Uint8Array(chunk)),
      );
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      // Avatar filenames carry a timestamp, so they're safe to cache forever.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
