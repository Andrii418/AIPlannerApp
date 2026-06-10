"""Generate app icon and splash assets from the brand source image."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "brand" / "source-promo.png"
BRAND = ROOT / "assets" / "brand"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_ICON = ROOT / "ios" / "SmartPlanner" / "Images.xcassets" / "AppIcon.appiconset"
IOS_SPLASH = ROOT / "ios" / "SmartPlanner" / "Images.xcassets" / "SplashLogo.imageset"

SPLASH_BG = "#003366"
ICON_BG = "#003366"


def crop_icon_square(img: Image.Image) -> Image.Image:
    width, height = img.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return img.crop((left, top, left + side, top + side))


def save_png(image: Image.Image, path: Path, size: int | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    output = image.resize((size, size), Image.Resampling.LANCZOS) if size else image
    output.save(path, format="PNG", optimize=True)


def build_master_icon(source: Image.Image) -> Image.Image:
    return crop_icon_square(source)


def build_splash_logo(icon: Image.Image, canvas_size: int = 1024, logo_scale: float = 0.62) -> Image.Image:
    logo_side = int(canvas_size * logo_scale)
    logo = icon.resize((logo_side, logo_side), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), SPLASH_BG)
    offset = (canvas_size - logo_side) // 2
    canvas.paste(logo, (offset, offset), logo if logo.mode == "RGBA" else None)
    return canvas.convert("RGB")


def build_adaptive_foreground(icon: Image.Image, size: int = 432, inset_ratio: float = 0.16) -> Image.Image:
    inset = int(size * inset_ratio)
    inner = size - inset * 2
    resized = icon.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, (inset, inset))
    return canvas


def generate_android_icons(icon: Image.Image) -> None:
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in densities.items():
        target = ANDROID_RES / folder
        save_png(icon, target / "ic_launcher.png", size)
        save_png(icon, target / "ic_launcher_round.png", size)

    foreground = build_adaptive_foreground(icon, 432)
    save_png(foreground, ANDROID_RES / "mipmap-xxxhdpi" / "ic_launcher_foreground.png")
    save_png(foreground.resize((288, 288), Image.Resampling.LANCZOS), ANDROID_RES / "mipmap-xxhdpi" / "ic_launcher_foreground.png")
    save_png(foreground.resize((192, 192), Image.Resampling.LANCZOS), ANDROID_RES / "mipmap-xhdpi" / "ic_launcher_foreground.png")
    save_png(foreground.resize((144, 144), Image.Resampling.LANCZOS), ANDROID_RES / "mipmap-hdpi" / "ic_launcher_foreground.png")
    save_png(foreground.resize((108, 108), Image.Resampling.LANCZOS), ANDROID_RES / "mipmap-mdpi" / "ic_launcher_foreground.png")


def generate_ios_icons(icon: Image.Image) -> None:
    mapping = {
        "Icon-App-20x20@2x.png": 40,
        "Icon-App-20x20@3x.png": 60,
        "Icon-App-29x29@2x.png": 58,
        "Icon-App-29x29@3x.png": 87,
        "Icon-App-40x40@2x.png": 80,
        "Icon-App-40x40@3x.png": 120,
        "Icon-App-60x60@2x.png": 120,
        "Icon-App-60x60@3x.png": 180,
        "Icon-App-1024x1024@1x.png": 1024,
    }
    IOS_ICON.mkdir(parents=True, exist_ok=True)
    images = []
    for filename, size in mapping.items():
        save_png(icon, IOS_ICON / filename, size)
        entry = {
            "filename": filename,
            "idiom": "ios-marketing" if size == 1024 else "iphone",
            "scale": "1x" if size == 1024 else ("2x" if size in {40, 58, 80, 120} else "3x"),
            "size": "1024x1024" if size == 1024 else f"{size // (2 if size in {40, 58, 80, 120} else 3)}x{size // (2 if size in {40, 58, 80, 120} else 3)}",
        }
        if size == 1024:
            entry = {"filename": filename, "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024"}
        elif size == 40:
            entry = {"filename": filename, "idiom": "iphone", "scale": "2x", "size": "20x20"}
        elif size == 60:
            entry = {"filename": filename, "idiom": "iphone", "scale": "3x", "size": "20x20"}
        elif size == 58:
            entry = {"filename": filename, "idiom": "iphone", "scale": "2x", "size": "29x29"}
        elif size == 87:
            entry = {"filename": filename, "idiom": "iphone", "scale": "3x", "size": "29x29"}
        elif size == 80:
            entry = {"filename": filename, "idiom": "iphone", "scale": "2x", "size": "40x40"}
        elif size == 120 and "40x40" in filename:
            entry = {"filename": filename, "idiom": "iphone", "scale": "3x", "size": "40x40"}
        elif size == 120:
            entry = {"filename": filename, "idiom": "iphone", "scale": "2x", "size": "60x60"}
        elif size == 180:
            entry = {"filename": filename, "idiom": "iphone", "scale": "3x", "size": "60x60"}
        images.append(entry)

    contents = {"images": images, "info": {"author": "xcode", "version": 1}}
    (IOS_ICON / "Contents.json").write_text(json.dumps(contents, indent=2), encoding="utf-8")


def generate_ios_splash(splash_logo: Image.Image) -> None:
    IOS_SPLASH.mkdir(parents=True, exist_ok=True)
    save_png(splash_logo, IOS_SPLASH / "splash-logo.png", 1024)
    save_png(splash_logo, IOS_SPLASH / "splash-logo@2x.png", 1024)
    save_png(splash_logo, IOS_SPLASH / "splash-logo@3x.png", 1024)
    contents = {
        "images": [
            {"filename": "splash-logo.png", "idiom": "universal", "scale": "1x"},
            {"filename": "splash-logo@2x.png", "idiom": "universal", "scale": "2x"},
            {"filename": "splash-logo@3x.png", "idiom": "universal", "scale": "3x"},
        ],
        "info": {"author": "xcode", "version": 1},
    }
    (IOS_SPLASH / "Contents.json").write_text(json.dumps(contents, indent=2), encoding="utf-8")


def generate_android_splash(splash_logo: Image.Image) -> None:
    save_png(splash_logo, ANDROID_RES / "drawable-nodpi" / "splash_logo.png", 1024)
    save_png(splash_logo, ANDROID_RES / "drawable" / "splash_logo.png", 512)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source image: {SOURCE}")

    source = Image.open(SOURCE).convert("RGBA")
    icon = build_master_icon(source)
    save_png(icon, BRAND / "app-icon-1024.png", 1024)

    splash_logo = build_splash_logo(icon)
    save_png(splash_logo, BRAND / "splash-logo.png", 1024)

    generate_android_icons(icon)
    generate_android_splash(splash_logo)
    generate_ios_icons(icon)
    generate_ios_splash(splash_logo)
    print("Brand assets generated successfully.")


if __name__ == "__main__":
    main()
