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

## [2. Accessibility]

> **Pastel & Contrast:** Vaporwave's soft pastels (pinks, purples, cyans) can struggle with contrast. Test text colors with WCAG tools—pale text on pale background fails. Ensure text is dark enough (charcoal/navy on pastels) or use bold fonts.
>
> **Focus States:** Use higher-saturation version of accent color for focus indicator, or switch to contrasting color. Example: `focus-visible: 3px solid #FF1493` (bold) on pastel background.
>
> **Retro Semantics:** Despite nostalgic aesthetic, ensure semantic HTML structure (proper heading hierarchy, semantic tags like `<header>`, `<nav>`, `<article>`, `<section>`).
>
> **Animation Sensitivity:** Vaporwave often uses parallax, gradients, and smooth animations. Provide `@media (prefers-reduced-motion: reduce)` to disable parallax and heavy animations for motion-sensitive users.
>
> **Text & Gradient Readability:** Text over soft gradients can be hard to read. Use slight background opacity overlay (`rgba(255,255,255,0.1)`) behind text or add subtle text-shadow for legibility.

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Disable parallax effects (static backgrounds). Simplify gradient complexity. Stack layout vertically. Reduce animation intensity (slower frame updates). Padding 12-16px. Font sizes 14-16px.
> - **Tablet (481px - 1024px):** Light parallax (5-10px offset). Soft gradients visible. 2-column layouts where appropriate. Padding 16-20px. Font sizes 16-18px.
> - **Desktop (1025px+):** Full parallax effect (10-20px offset). Complex subtle gradients and layering. Multi-column layouts. Large, immersive typography. Padding 20-28px. Font sizes 18-24px.
>
> **Gradient Scaling:** Use CSS gradients that scale responsively (`radial-gradient` with percentages). Ensure gradients don't shift unexpectedly on viewport changes.
>
> **Image Scaling:** Retro imagery (VHS glitch, scan overlays) should scale gracefully. Use `background-size: cover` for full coverage. Test on small screens to ensure images don't become distorted.

## [4. Animation & Motion]

> **Parallax Scrolling:** Background layers move at different speeds on scroll (slower than foreground). Use `transform: translateY()` with `data-*` attributes or scroll event listeners. Offset range: 20-40px typical.
>
> **Subtle Glitch:** Vaporwave can incorporate slight glitch effects (RGB offset, scan line flicker). Keep effect minimal (1-2px offset, low opacity) and apply to specific elements, not entire page.
>
> **Transition Timing:**
>
> - Parallax scroll effect: continuous based on scroll
> - Hover effects: 250-300ms ease-out
> - Glitch/flicker: 100-200ms steps (if included)
> - Fade transitions: 400-600ms ease-in-out
>
> **Keyframe Example:**
>
> ```css
> @keyframes vaporwave-float {
>   0%,
>   100% {
>     transform: translateY(0px);
>   }
>   50% {
>     transform: translateY(-15px);
>   }
> }
> @keyframes subtle-glitch {
>   0%,
>   100% {
>     clip-path: inset(0);
>   }
>   20% {
>     clip-path: inset(0 0 0 0);
>     transform: translateX(-2px);
>   }
> }
> ```
>
> **Easing:** Prefer smooth, dreamy curves—`ease-in-out`, `cubic-bezier()` with gentle motion. Avoid sharp transitions; everything should float/drift rather than snap.

## [5. Concept & Context]

> **Design Philosophy:** Vaporwave channels 1980s-90s aesthetics through digital abstraction—soft pastels, layered gradients, retro imagery (statues, palms, VHS), parallax depth. It communicates nostalgia, melancholy, contemplation, and digital escapism.
>
> **Best Use Cases:**
>
> - Experimental/art project websites
> - Music (artists, producers, ambient listening platforms)
> - Fashion/streetwear (retro-forward brands)
> - Creative portfolios (designers, digital artists)
> - Wellness/meditation apps (soft, dreamy aesthetic)
>
> **When NOT to Use:**
>
> - Professional/corporate services (too niche/artistic)
> - High-performance sites (parallax & animations add overhead)
> - Accessibility-critical applications
> - International/global brands (trends are Western-centric)
> - Mobile-performance sensitive projects
>
> **Limitations:** Parallax effects are performance-heavy on mobile—avoid on low-end devices. Soft pastel colors limit contrast. Can feel dated—trend value uncertain long-term. Very specific aesthetic—high barrier to entry for brands outside music/art sphere. Pastel colors may not align with corporate brand guidelines.

## Quick Tips

- The 3D perspective grid background can be created with CSS Grid or SVG—ensure it doesn't impact performance
- Film grain overlays should be extremely subtle (opacity 2-5%) to avoid readability issues
- The mix of elegant serif headers with monospace body text creates attractive contrast
- Windows 95/98 frame styling is nostalgic but shouldn't feel dated—balance with modern interactions
- Glitch effects on hover should be quick and responsive; keep them under 200ms
- Perfect for artistic portfolios, music/media projects, and sites celebrating internet nostalgia
