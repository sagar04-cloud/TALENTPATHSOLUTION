#!/usr/bin/env python3
"""
Talent Path Solutions - Transparent Favicon & App Icon Generator
Generates multi-resolution transparent PNG and ICO favicons from master logo.
"""

import os
import sys
from pathlib import Path
from PIL import Image

def generate_favicons():
    root_dir = Path(__file__).resolve().parent.parent
    public_dir = root_dir / "public"

    # Select high-resolution transparent source logo
    candidates = [
        public_dir / "logo-transparent.png",
        public_dir / "logo-icon.png",
        public_dir / "favicon.png"
    ]

    source_path = None
    for candidate in candidates:
        if candidate.exists():
            source_path = candidate
            break

    if not source_path:
        print("❌ Error: No source logo found in public directory.", file=sys.stderr)
        sys.exit(1)

    print(f"🎨 Loading master logo from: {source_path.name}")
    with Image.open(source_path) as master:
        # Convert to RGBA ensuring alpha channel integrity
        master = master.convert("RGBA")

        # Trim transparent margins to center the emblem nicely
        bbox = master.getbbox()
        if bbox:
            cropped = master.crop(bbox)
            # Create a square canvas to preserve 1:1 aspect ratio
            max_side = max(cropped.width, cropped.height)
            square_img = Image.new("RGBA", (max_side, max_side), (0, 0, 0, 0))
            offset_x = (max_side - cropped.width) // 2
            offset_y = (max_side - cropped.height) // 2
            square_img.paste(cropped, (offset_x, offset_y), cropped)
            base_img = square_img
        else:
            base_img = master

        targets = [
            ("favicon-16x16.png", (16, 16)),
            ("favicon-32x32.png", (32, 32)),
            ("apple-touch-icon.png", (180, 180)),
            ("favicon.png", (512, 512)),
        ]

        print("⚙️  Generating optimized transparent PNG icons...")
        for filename, size in targets:
            out_path = public_dir / filename
            resized = base_img.resize(size, Image.Resampling.LANCZOS)
            resized.save(out_path, format="PNG", optimize=True)
            print(f"  • {filename} ({size[0]}x{size[1]}px) -> {out_path.stat().st_size:,} bytes")

        # Generate multi-size favicon.ico (16, 32, 48)
        ico_path = public_dir / "favicon.ico"
        ico_sizes = [(16, 16), (32, 32), (48, 48)]
        ico_images = [base_img.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
        ico_images[0].save(
            ico_path,
            format="ICO",
            sizes=ico_sizes,
            append_images=ico_images[1:]
        )
        print(f"  • favicon.ico (16x16, 32x32, 48x48) -> {ico_path.stat().st_size:,} bytes")

    print("\n✅ All transparent favicons and app icons generated successfully!")

if __name__ == "__main__":
    generate_favicons()

