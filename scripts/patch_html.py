import sys
import pathlib

if len(sys.argv) < 2:
    print("Usage: python patch_html.py <file1.html> [file2.html ...]")
    sys.exit(1)

for filename in sys.argv[1:]:
    file_path = pathlib.Path(filename)

    if not file_path.exists() or not file_path.is_file():
        print(f"Skipping, not found: {file_path}")
        continue

    text = file_path.read_text(encoding="utf-8")

    # 1. Normalize <base>
    text = text.replace('<base href="/yachiman/">', '<base href="/">')

    # 2. Fix asset references
    text = text.replace('href="assets/haiku.css"', 'href="/assets/haiku.css"')
    text = text.replace('src="assets/haiku-page.js"', 'src="/assets/haiku-page.js"')

    # Write back
    file_path.write_text(text, encoding="utf-8")
    print(f"Patched: {file_path}")
