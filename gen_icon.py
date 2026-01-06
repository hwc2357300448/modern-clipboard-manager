import base64
import zlib
import struct

def make_png(width, height, color):
    # Very simple raw PNG generation for a solid color
    # Signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr = struct.pack('!I4sIIBBBBI', 13, b'IHDR', width, height, 8, 2, 0, 0, 0)
    ihdr += struct.pack('!I', zlib.crc32(ihdr) & 0xffffffff)
    png += ihdr
    
    # IDAT
    # Raw pixel data: (1 byte filter + 3 bytes RGB) * width * height ? No, we use mode 2 (Truecolor)
    # Width * Height * 3 bytes.
    # Scanline: 0 (filter) + R G B ...
    row = b'\x00' + color * width
    data = row * height
    compressed = zlib.compress(data)
    idat = struct.pack('!I4s', len(compressed), b'IDAT') + compressed
    idat += struct.pack('!I', zlib.crc32(idat) & 0xffffffff)
    png += idat
    
    # IEND
    iend = struct.pack('!I4s', 0, b'IEND')
    iend += struct.pack('!I', zlib.crc32(iend) & 0xffffffff)
    png += iend
    
    return png

# Generate 32x32 Blue icon (RGB: 0, 120, 215) -> Hex #0078D7 (Windows Blue)
icon_bytes = make_png(32, 32, b'\x00\x78\xd7')
b64 = base64.b64encode(icon_bytes).decode('utf-8')
print(f"data:image/png;base64,{b64}")
