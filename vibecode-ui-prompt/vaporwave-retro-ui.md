# Vaporwave Retro UI

Retro-futuristic vaporwave aesthetic with 3D perspective grids, film grain, Windows 95/98 frame styling, and nostalgic elegance.

## [1. The Essentials]

> Create a web interface with a 'Vaporwave Retro' aesthetic. The design must strictly follow these rules:
>
> **Background Aesthetic:** Use a retro-futuristic background featuring a 3D perspective grid (wireframe floor) and a large low-poly sun or geometric shapes.
>
> **Texture:** Apply a subtle 'film grain' or 'noise' overlay over the entire UI to give it a lo-fi, analog feel.
>
> **Typography:** Mix two styles: Use an elegant, classic Serif font (like 'Times New Roman' or 'Playfair Display') for headers, and a clean Monospace font for UI elements and body text.
>
> **UI Elements:** Use Windows 95/98 inspired window frames for cards, but with modern rounded corners (approx 8px). Include subtle 'glitch' hover effects on buttons.
>
> **Components:** Add scanline overlays (horizontal low-opacity lines) to images or specific containers to mimic old CRT monitors.

## [Option A: Light Mode]

> **Color Palette:** Use soft pastels—primarily 'Millennial Pink' (`#F3C6F1`), 'Pale Turquoise' (`#A0E7E5`), and 'Lemon Yellow' (`#FAFFC7`).
>
> **Glass Effect:** Use a 'Frosted Glass' effect for containers with a white tint (`rgba(255, 255, 255, 0.3)`) and a light blue glow.
>
> **Shadows:** Use soft, diffused shadows in a light purple or pink hue instead of black.
>
> **Text Color:** Deep indigo or retro blue for high legibility against the pastel backgrounds.

## [Option B: Dark Mode]

> **Color Palette:** Use a deep midnight blue or dark purple background (`#0B0E14`). Use high-saturation 'Electric Purple' (`#BF00FF`) and 'Hot Pink' (`#FF007F`) for accents.
>
> **Glow/Bloom:** Add a 'Neon Glow' (`box-shadow` and `text-shadow`) to all primary buttons and active states using cyan or magenta.
>
> **Glass Effect:** Containers should be dark semi-transparent (`rgba(15, 23, 42, 0.6)`) with a thin neon-colored border.
>
> **Text Color:** Crisp white or neon cyan for a sharp contrast that pops out from the darkness.

## Quick Tips

- The 3D perspective grid background can be created with CSS Grid or SVG—ensure it doesn't impact performance
- Film grain overlays should be extremely subtle (opacity 2-5%) to avoid readability issues
- The mix of elegant serif headers with monospace body text creates attractive contrast
- Windows 95/98 frame styling is nostalgic but shouldn't feel dated—balance with modern interactions
- Glitch effects on hover should be quick and responsive; keep them under 200ms
- Perfect for artistic portfolios, music/media projects, and sites celebrating internet nostalgia
