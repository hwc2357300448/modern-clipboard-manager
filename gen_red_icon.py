import base64
import zlib
import struct

def make_png(width, height, color):
    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('!I4sIIBBBBI', 13, b'IHDR', width, height, 8, 2, 0, 0, 0)
    ihdr += struct.pack('!I', zlib.crc32(ihdr) & 0xffffffff)
    png += ihdr
    row = b'\x00' + color * width
    data = row * height
    compressed = zlib.compress(data)
    idat = struct.pack('!I4s', len(compressed), b'IDAT') + compressed
    idat += struct.pack('!I', zlib.crc32(idat) & 0xffffffff)
    png += idat
    iend = struct.pack('!I4s', 0, b'IEND')
    iend += struct.pack('!I', zlib.crc32(iend) & 0xffffffff)
    png += iend
    return png

# Red Icon (R=255, G=0, B=0)
icon_bytes = make_png(32, 32, b'\xFF\x00\x00')
with open('src/main/red_tray.png', 'wb') as f:
    f.write(icon_bytes)
print("Red icon generated.")
