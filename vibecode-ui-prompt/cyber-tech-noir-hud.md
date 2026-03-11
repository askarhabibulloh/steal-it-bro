# Cyber-Tech Noir HUD

High-tech futuristic aesthetic with neon glow effects, technical HUD elements, angular containers, and monospace typography.

## [1. The Essentials]

> Design a high-tech website using a 'Cyber-Tech Noir' aesthetic. The UI must strictly follow these technical constraints:
>
> **Neon Glow:** Every primary accent, button border, and status indicator must have a 'bloom' or 'glow' effect (e.g., `box-shadow: 0 0 15px #39FF14`).
>
> **Technical HUD Elements:** Incorporate subtle background elements like thin dot-grid patterns, scanlines, or abstract circuit-line vector art to create a sense of digital depth.
>
> **Angular Containers:** Use sharp-edged cards with occasional beveled corners (45-degree cuts on one or two corners) to mimic a military or hacker terminal.
>
> **Typography:** Use a wide, geometric sans-serif font for headers (e.g., 'Orbitron', 'Rajdhani', or 'Michroma') and a crisp monospace font for data/labels (e.g., 'JetBrains Mono' or 'Roboto Mono').
>
> **Data Visualization:** Use large, bold numbers for stats and thin, high-precision lines for dividers and progress bars.

## [Option A: Light Mode]

> **Color Palette:** Use a pure white or very light gray background (`#FAFAFA`). Borders and lines should be a mix of light gray (`#E0E0E0`) and vibrant Neon Green (`#00D100`).
>
> **Styling:** The 'glow' should be subtle and colored, making the green elements look like LEDs on a white machine.
>
> **Typography:** Use deep charcoal gray text (`#1A1A1A`) for readability, while maintaining neon green for icons and call-to-action buttons.

## [Option B: Dark Mode]

> **Color Palette:** Use a deep pitch-black background (`#000000`) or an extremely dark forest green (`#020A05`). All primary accents must be a vivid 'Matrix' Green or Neon Lime (`#39FF14`).
>
> **Styling:** Create an immersive 'terminal' feel. Use semi-transparent dark overlays (glassmorphism with 0.1 opacity) for cards to let background grid patterns peek through.
>
> **Typography:** All primary text should be white or very light silver, with headings and highlights in Neon Green.

## Quick Tips

- Use `text-shadow` with the same glow color as `box-shadow` for consistent neon effects
- Scanlines and grid patterns should be subtle—use low opacity SVGs or CSS patterns
- Perfect for security dashboards, system monitoring tools, and sci-fi inspired apps
- Ensure text remains readable despite glow effects; adjust opacity if needed

## [2. Accessibility]

> **Color Contrast:** Light mode: neon green (`#00D100`) on white may fail contrast—test with tools like WebAIM. Add a dark text shadow or outline. Dark mode: neon green on black background exceeds WCAG AA (10.7:1 ratio). Primary text must always be white or light silver for readability.
>
> **Glow & Readability:** Strong glow effects can reduce text legibility. Use `text-shadow` in addition to `box-shadow` to ensure text stands out. Example: `text-shadow: 0 0 10px rgba(57, 255, 20, 0.5)`.
>
> **Focus States:** Use glow effect itself as focus indicator (e.g., increased glow radius on focus). Ensure keyboard-only users can navigate all interactive elements.
>
> **Semantic HTML:** Use `<button>` for buttons, proper heading hierarchy (`<h1>`, `<h2>`), and `<label>` elements for form inputs. ARIA labels for icons.
>
> **Scanline Pattern Opacity:** Keep background grid/scanline opacity below 5% to avoid visual noise that impacts readability.

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Reduce glow blur-radius proportionally (glow-radius: 8px instead of 15px). Simplify HUD elements—hide tertiary data. Stack cards vertically. Reduce monospace font size slightly (12px instead of 14px).
> - **Tablet (481px - 1024px):** Glow radius 12px. Allow 2-column HUD layouts. Scanline pattern opacity increases slightly to 3%.
> - **Desktop (1025px+):** Full glow effect (15px blur). Multi-column data displays. Complex circuit patterns and grid backgrounds visible. Monospace labels at 14-16px.
>
> **Typography Scaling:** Headers use geometric sans-serif at 24-48px. Data/labels in monospace at 12-16px. Ensure contrast remains strong at all sizes.
>
> **HUD Layout:** On mobile, show only critical metrics. On desktop, full dashboard with stats, gauges, and graphs visible.

## [4. Animation & Motion]

> **Glow Pulse Animation:** Subtle pulsing glow on hover or for attention (e.g., alerts). Use 1s cycle time with sine-wave easing.
>
> **Transition Timing:**
>
> - Glow effects: 200ms ease-in-out
> - Hover state: 150ms ease-out
> - Data updates (counters, progress bars): 300ms linear
>
> **Keyframe Example:**
>
> ```css
> @keyframes cyber-glow {
>   0%,
>   100% {
>     box-shadow: 0 0 10px #39ff14;
>   }
>   50% {
>     box-shadow:
>       0 0 20px #39ff14,
>       0 0 30px #39ff14;
>   }
> }
> ```
>
> **Scanline Effect:** Use CSS animation or video element for subtle moving scanlines (drift vertically every 2-3s). Keep it extremely subtle (opacity 2-3%) so it doesn't distract.

## [5. Concept & Context]

> **Design Philosophy:** Cyber-Tech Noir harnesses the aesthetic of retro-futurism mixed with terminal interfaces—think 90s sci-fi hacker movies meets modern dashboard design. It communicates technical authority, precision, and high-alert readiness.
>
> **Best Use Cases:**
>
> - Security monitoring dashboards & threat detection tools
> - System administration panels
> - Sci-fi/gaming web experiences
> - Cryptocurrency/blockchain platforms wanting a "technical" vibe
> - Developer tools & IDE-like interfaces
>
> **When NOT to Use:**
>
> - E-commerce or consumer marketing sites (too niche/intense)
> - Luxury brands or hospitality (feels cold/utilitarian)
> - Medical or healthcare apps needing warmth and trust
> - Audiences unfamiliar with sci-fi aesthetics
>
> **Limitations:** High visual stimulation—can feel exhausting with extended viewing. Glow effects require GPU acceleration (may struggle on older devices). Niche appeal—not suitable for general-audience websites. Can feel dated quickly as sci-fi trends evolve.
