# Pixel Art High-Bit

Modern pixel art aesthetic with sharp corners, double-border techniques, retro pixel-style fonts, and gameboy/arcade vibes.

## [1. The Essentials]

> Build a web interface with a Modern High-Bit Pixel Art aesthetic. The UI must strictly follow these rules:
>
> **Pixel Alignment:** All elements (containers, buttons, inputs) must have sharp, non-rounded corners. Use a 'stepped' corner effect if possible (simulated pixelated curves).
>
> **Borders:** Use thick, solid borders (at least 3px or 4px). Use a 'double-border' technique (an outer dark border and an inner highlight border) to give a 3D chunky feel.
>
> **Typography:** Use a high-quality pixel-style font like 'Press Start 2P', 'Silkscreen', or 'VT323' from Google Fonts. Headings should be all-caps.
>
> **Anti-Aliasing:** Ensure all images and icons have the CSS property `image-rendering: pixelated` to keep them crisp.
>
> **Interactive Elements:** Buttons should have a 'pressed' animation effect where the element moves down 4px and the shadow disappears when clicked.

## [Option A: Light Mode]

> **Color Palette:** Use a warm cream background (`#F4F4E4`). For primary accents, use 'Forest Green' (`#3E8948`) and 'Terracotta Red' (`#E0503E`).
>
> **Styling:** Elements should look like a classic RPG menu. Use a light parchment color for card backgrounds.
>
> **Shadows:** Use solid, non-transparent block shadows in a darker shade of the background color (not black).

## [Option B: Dark Mode]

> **Color Palette:** Use a deep midnight purple or navy background (`#1A1A2E`). For accents, use neon 'Cyber Cyan' (`#00F5FF`) and 'Electric Magenta' (`#FF00E5`).
>
> **Styling:** Elements should look like a retro arcade machine or a cyberpunk terminal. Use high-contrast border colors that 'pop' against the dark background.
>
> **Glow Effect:** Apply a subtle 'pixel-glow' (`box-shadow` without blur, just solid layers) to primary buttons to simulate neon lights.

## [2. Accessibility]

> **Color Contrast:** Pixel art palettes are often limited, making contrast challenging. Test background-text combinations with WCAG tools. Ensure primary text color has minimum 4.5:1 contrast. Avoid similar hues next to each other (e.g., cyan on light blue).
>
> **Focus States:** Pixel-art focus indicator should match aesthetic—use a pixelated border or simple outline shift (e.g., `outline: 2px solid`). Make it obvious and distinct from inactive state.
>
> **Size & Readability:** Pixel fonts can be small and hard to read. Ensure body text is at least 14-16px at desktop size, larger on mobile. Use sans-serif fallback for small text if pixel font becomes illegible.
>
> **Semantic HTML:** Use proper heading hierarchy. Buttons should be `<button>` elements. Form labels should be associated with inputs.
>
> **Text Alternatives:** Provide `alt` text for pixel art images. Decorative pixel patterns should not interfere with content using `z-index` or overlay opacity.

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Increase pixel size slightly for legibility. Stack layout vertically. Reduce animation frame rate or complexity (e.g., single-frame sprites instead of animated sequences). Padding 8-12px to preserve space.
> - **Tablet (481px - 1024px):** Moderate pixel size. Allow 2-column grid layouts. Simple sprite animations at normal speed. Padding 12-16px.
> - **Desktop (1025px+):** Full pixel detail visible. Multi-column layouts. Complex sprite animations and parallax effects active. Padding 16-20px.
>
> **Sprite Scaling:** Use `image-rendering: crisp-edges` or `image-rendering: pixelated` to maintain pixelated appearance when scaling. Avoid anti-aliasing that blurs pixels.
>
> **Typography Scaling:** Pixel fonts scale in jumps (8px, 16px, 24px) for authentic look. Use `line-height: 1.4` for tighter spacing typical of retro aesthetics.

## [4. Animation & Motion]

> **Sprite Animation:** Use sprite sheets with CSS `background-position` to cycle frames at fixed intervals (e.g., every 100-150ms per frame). Keep animation loops short (3-6 frames max).
>
> **Transition Timing:**
>
> - Sprite animation: 100-150ms steps() per frame
> - Hover effects: instant or 1-2 frame-based steps
> - Focus transitions: 150ms (or instant for authenticity)
>
> **Keyframe Example:**
>
> ```css
> @keyframes pixel-walk {
>   0% {
>     background-position: 0 0;
>   }
>   25% {
>     background-position: -32px 0;
>   }
>   50% {
>     background-position: -64px 0;
>   }
>   75% {
>     background-position: -96px 0;
>   }
>   100% {
>     background-position: 0 0;
>   }
> }
> ```
>
> **Motion Style:** Use `steps()` function for authentic pixel-perfect animation. Avoid easing—move in discrete jumps like old console games.

## [5. Concept & Context]

> **Design Philosophy:** High-Bit Pixel Art evokes retro video game & early computer aesthetics—celebrating low-resolution charm and digital nostalgia. It communicates indie authenticity, playfulness, and technical limitation-as-feature.
>
> **Best Use Cases:**
>
> - Indie games or game-adjacent web experiences
> - Retro/throwback brand marketing
> - Dev communities & hacker culture sites
> - Educational platforms with nostalgic appeal
> - Art galleries or creative portfolios emphasizing digital craft
>
> **When NOT to Use:**
>
> - Professional services (law, finance, healthcare)
> - Luxury/premium brand positioning
> - Content-heavy sites where pixel typography becomes unreadable
> - Mobile-only audiences unfamiliar with retro aesthetics
>
> **Limitations:** Readability challenges with small viewport sizes. Colors are limited—may restrict brand flexibility. Can feel cheap or unpolished if executed poorly. Niche appeal—not universally liked. Performance concern: complex sprite sheets & animations can slow mobile devices.

## Quick Tips

- Add a subtle scanline overlay using a repeating `linear-gradient` to mimic old CRT monitors, but keep it subtle for readability
- The double-border technique creates visual depth without complex shadows
- Perfect for gaming peripherals, retro apps, and nostalgic game-inspired interfaces
- The pressed animation on buttons provides satisfying mechanical feedback
- Pixel fonts must be large enough to be readable; minimum 14px for body text
