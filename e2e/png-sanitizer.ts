import { crc32 } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const NORMALIZATION_ERROR = "curated screenshot PNG normalization failed";

function failNormalization(): never {
  throw new Error(NORMALIZATION_ERROR);
}

function isPngChunkType(typeBytes: Buffer) {
  return typeBytes.length === 4 && [...typeBytes].every((byte) =>
    (byte >= 0x41 && byte <= 0x5a) || (byte >= 0x61 && byte <= 0x7a));
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
