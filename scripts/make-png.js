import fs from 'fs';
import zlib from 'zlib';

function createSolidPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // color type: RGB
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines: width * 3 bytes + 1 filter byte per line
  const rawData = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData.writeUInt8(0, offset++); // No filter
    for (let x = 0; x < width; x++) {
      // Create a nice gradient or badge feel
      const distFromCenter = Math.hypot(x - width / 2, y - height / 2);
      const isUrgentCenter = distFromCenter < (width * 0.35);
      if (isUrgentCenter) {
        rawData.writeUInt8(255, offset++);
        rawData.writeUInt8(255, offset++);
        rawData.writeUInt8(255, offset++);
      } else {
        rawData.writeUInt8(r, offset++);
        rawData.writeUInt8(g, offset++);
        rawData.writeUInt8(b, offset++);
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createSolidPNG(192, 192, 220, 38, 38));
fs.writeFileSync('./public/pwa-512x512.png', createSolidPNG(512, 512, 220, 38, 38));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createSolidPNG(512, 512, 185, 28, 28));
fs.writeFileSync('./public/apple-touch-icon.png', createSolidPNG(180, 180, 220, 38, 38));
fs.writeFileSync('./public/favicon.ico', createSolidPNG(32, 32, 220, 38, 38));

console.log('PWA PNG icons generated successfully.');
