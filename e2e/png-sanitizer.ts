import { crc32, deflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const NORMALIZATION_ERROR = "curated screenshot PNG normalization failed";
const REDACTION_RGBA = Buffer.from([0xe5, 0xe7, 0xeb, 0xff]);

function failNormalization(): never {
  throw new Error(NORMALIZATION_ERROR);
}

function isPngChunkType(typeBytes: Buffer) {
  return typeBytes.length === 4 && [...typeBytes].every((byte) =>
    (byte >= 0x41 && byte <= 0x5a) || (byte >= 0x61 && byte <= 0x7a));
}

function pngChunk(type: "IHDR" | "IDAT" | "IEND", data: Buffer) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  return chunk;
}

/**
 * Encode a deterministic redaction surface without accepting any browser
 * pixels. A live page may preserve its safe viewport dimensions; unavailable
 * pages use the one-pixel default. No page, console, URL, error, scrollbar, or
 * learner data enters this image.
 */
export function createUniformRedactionPng(
  size: Readonly<{ width: number; height: number }> = { width: 1, height: 1 },
): Buffer {
  const { width, height } = size;
  if (
    !Number.isInteger(width)
    || !Number.isInteger(height)
    || width < 1
    || height < 1
    || width > 2_048
    || height > 2_048
  ) {
    failNormalization();
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const row = Buffer.alloc(1 + width * REDACTION_RGBA.length);
  for (let pixel = 0; pixel < width; pixel += 1) {
    REDACTION_RGBA.copy(row, 1 + pixel * REDACTION_RGBA.length);
  }
  const scanlines = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y += 1) row.copy(scanlines, y * row.length);
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Playwright can add encoder metadata to an otherwise text-free WebKit PNG.
 * Validate the complete source envelope in memory, discard every ancillary
 * chunk, and persist only the original critical chunks and their checked CRCs.
 */
export function stripPngAncillaryChunks(bytes: Buffer): Buffer {
  if (bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    failNormalization();
  }

  const retained = [bytes.subarray(0, 8)];
  let offset = 8;
  let sawHeader = false;
  let sawData = false;
  let dataClosed = false;
  let sawEnd = false;

  while (offset < bytes.length) {
    if (sawEnd || offset + 12 > bytes.length) failNormalization();

    const length = bytes.readUInt32BE(offset);
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    if (!isPngChunkType(typeBytes)) failNormalization();

    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (dataEnd < dataStart || chunkEnd > bytes.length) failNormalization();

    const expectedCrc = bytes.readUInt32BE(dataEnd);
    const actualCrc = crc32(bytes.subarray(offset + 4, dataEnd));
    if (actualCrc !== expectedCrc) failNormalization();

    const type = typeBytes.toString("ascii");
    if (type === "IHDR") {
      if (sawHeader || offset !== 8 || length !== 13) failNormalization();
      sawHeader = true;
      retained.push(bytes.subarray(offset, chunkEnd));
    } else if (type === "IDAT") {
      if (!sawHeader || dataClosed || sawEnd) failNormalization();
      sawData = true;
      retained.push(bytes.subarray(offset, chunkEnd));
    } else if (type === "IEND") {
      if (!sawHeader || !sawData || sawEnd || length !== 0 || chunkEnd !== bytes.length) {
        failNormalization();
      }
      sawEnd = true;
      retained.push(bytes.subarray(offset, chunkEnd));
    } else {
      const ancillary = (typeBytes[0] & 0x20) !== 0;
      if (!ancillary || !sawHeader || sawEnd) failNormalization();
      if (sawData) dataClosed = true;
    }

    offset = chunkEnd;
  }

  if (!sawHeader || !sawData || !sawEnd || offset !== bytes.length) failNormalization();
  return Buffer.concat(retained);
}
