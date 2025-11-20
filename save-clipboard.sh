#!/bin/bash
# Save clipboard screenshot to eval_images folder for Claude to review

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="screenshot_${TIMESTAMP}.png"
OUTPUT_DIR="$(pwd)/eval_images"
OUTPUT_FILE="${OUTPUT_DIR}/${FILENAME}"
WIN_DIR=$(wslpath -w "$OUTPUT_DIR")

# Use PowerShell through WSL to save clipboard image
powershell.exe -command "
\$img = Get-Clipboard -Format Image
if (\$img) {
    \$path = Join-Path '$WIN_DIR' '$FILENAME'
    \$img.Save(\$path)
    Write-Host 'Screenshot saved'
} else {
    Write-Host 'No image found in clipboard'
    exit 1
}
"

if [ -f "$OUTPUT_FILE" ]; then
    echo "✓ Screenshot saved successfully: $OUTPUT_FILE"
    ls -lh "$OUTPUT_FILE"
else
    echo "✗ Failed to save screenshot"
    exit 1
fi
