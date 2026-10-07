import { crc32, deflateSync } from "node:zlib";

/**
 * A plain-colour PNG of the given size, for upload tests (a real image the
 * API accepts: it checks files by their content).
 */
export function solidPng(
  width: number,
  height: number,
  rgb: [number, number, number] = [200, 160, 120],
): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) row.set(rgb, 1 + x * 3);
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** A file for Playwright's setInputFiles. */
export const pngFile = (name: string, size = 400, rgb?: [number, number, number]) => ({
  name,
  mimeType: "image/png",
  buffer: solidPng(size, size, rgb),
});
