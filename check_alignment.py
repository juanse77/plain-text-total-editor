import zipfile, struct, sys

path = sys.argv[1] if len(sys.argv) > 1 else r'c:\Users\juanse77\Documents\Proyectos\file-reader\TotalPlainTextEditor\android\app\build\outputs\apk\debug\app-debug.apk'
z = zipfile.ZipFile(path)
so_files = [f for f in z.namelist() if f.endswith('.so') and 'arm64' in f]

for so in so_files:
    data = z.read(so)
    if data[:4] == b'\x7fELF':
        ei_class = data[4]
        if ei_class == 2:
            e_phoff = struct.unpack_from('<Q', data, 32)[0]
            e_phentsize = struct.unpack_from('<H', data, 54)[0]
            e_phnum = struct.unpack_from('<H', data, 56)[0]
            max_align = 0
            for i in range(e_phnum):
                off = e_phoff + i * e_phentsize
                p_type = struct.unpack_from('<I', data, off)[0]
                if p_type == 1:
                    p_align = struct.unpack_from('<Q', data, off + 48)[0]
                    max_align = max(max_align, p_align)
            name = so.split('/')[-1]
            status = 'OK (16KB)' if max_align >= 16384 else f'FAIL ({max_align} bytes)'
            print(f'{name}: max LOAD p_align = {max_align} -> {status}')
