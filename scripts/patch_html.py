import sys
import pathlib
import shutil

if len(sys.argv) != 2:
    print("Usage: python patch_one.py <haiku.html>")
    sys.exit(1)

file_path = pathlib.Path(sys.argv[1])

if not file_path.exists() or not file_path.is_file():
    print(f"File not found: {file_path}")
    sys.exit(1)

# Read content
text = file_path.read_text(encoding="utf-8")

# Backup original
### backup_path = file_path.with_suffix(file_path.suffix + ".bak")
### shutil.copy(file_path, backup_path)
### print(f"Backup created: {backup_path}")

# Skip if already patched
if "<base href=" in text:
    print(f"Already patched: {file_path}")
    sys.exit(0)

# 1. Insert <base> after viewport meta
patched = text.replace(
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />\n  <base href="/yachiman/">'
)

# 2. Fix leading / in asset paths
patched = patched.replace('href="/assets/', 'href="assets/')
patched = patched.replace('src="/assets/', 'src="assets/')

# Write back patched version
file_path.write_text(patched, encoding="utf-8")
print(f"Patched: {file_path}")
