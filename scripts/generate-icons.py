#!/usr/bin/env python3
"""
Generate all required icon formats for electron-builder from a source PNG.
"""

import os
from PIL import Image

# Icon sizes for Windows ICO - must include 256x256 for electron-builder
ICO_SIZES = [16, 32, 48, 64, 128, 256]

def generate_icons():
    """Generate all required icon formats from the source icon.png"""
    
    # Paths
    build_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'build')
    source_icon = os.path.join(build_dir, 'icon.png')
    ico_output = os.path.join(build_dir, 'icon.ico')
    
    print(f"Reading source icon: {source_icon}")
    
    # Load source image
    img = Image.open(source_icon)
    
    # Ensure it's in RGBA mode for transparency support
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    print(f"Source image size: {img.size}")
    
    # Verify source is at least 256x256
    if img.size[0] < 256 or img.size[1] < 256:
        print(f"⚠ Warning: Source image is smaller than 256x256, this may cause build issues")
    
    # Generate Windows ICO (contains multiple sizes)
    print("\nGenerating Windows ICO file...")
    icon_sizes = []
    for size in ICO_SIZES:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        # Ensure RGBA mode for each size
        if resized.mode != 'RGBA':
            resized = resized.convert('RGBA')
        icon_sizes.append(resized)
        print(f"  - Added {size}x{size}")
    
    # Save as ICO with multiple sizes - start with largest for better compatibility
    icon_sizes[-1].save(
        ico_output,
        format='ICO',
        sizes=[(s, s) for s in ICO_SIZES],
        append_images=icon_sizes[:-1]
    )
    print(f"✓ Created: {ico_output}")
    
    # Verify the ICO was created correctly
    try:
        ico_test = Image.open(ico_output)
        print(f"✓ Verified ICO file can be opened")
        print(f"  Main icon size: {ico_test.size}")
    except Exception as e:
        print(f"⚠ Warning: Could not verify ICO file: {e}")
    
    # Verify the source PNG is good for macOS/Linux (should be at least 512x512)
    if img.size[0] >= 512 and img.size[1] >= 512:
        print(f"\n✓ Source icon.png ({img.size[0]}x{img.size[1]}) is suitable for macOS and Linux")
    else:
        print(f"\n⚠ Warning: icon.png ({img.size[0]}x{img.size[1]}) should be at least 512x512 for best results")
        # Optionally create a larger version
        if img.size[0] < 512:
            print("  Creating 512x512 version...")
            larger = img.resize((512, 512), Image.Resampling.LANCZOS)
            larger.save(source_icon)
            print(f"  ✓ Upscaled icon.png to 512x512")
    
    print("\n✓ All icons generated successfully!")
    print("\nGenerated files:")
    print(f"  - {ico_output} (Windows)")
    print(f"  - {source_icon} (macOS/Linux)")

if __name__ == '__main__':
    generate_icons()

