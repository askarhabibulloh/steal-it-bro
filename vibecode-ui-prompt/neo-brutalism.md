# Neo-Brutalism

Clean, minimalist brutalism inspired by Saweria.co with thick black borders and hard shadows, centered layouts, and playful hover effects.

## [1. The Essentials]

> Create a web landing page using a Neo-Brutalist UI style similar to Saweria.co. Follow these specific design constraints:
>
> **Color Palette:** Use an off-white or cream background (e.g., `#FDFDFA`). Use vibrant, flat primary colors for accents (like cyan `#81E6D9` and orange `#F6AD55`).
>
> **Borders:** Every card, button, and input field must have a thick, solid black border (2px or 3px).
>
> **Shadows:** Use 'Hard Shadows' instead of soft/blurred ones. The shadow should be a solid black offset (e.g., `4px 4px 0px 0px #000`).
>
> **Buttons:** Buttons should have a hover effect where the button moves slightly or the shadow increases. Use bold, black text inside.
>
> **Typography:** Use a clean, bold sans-serif font. Headers should be large and prominent.
>
> **Layout:** Keep it clean, centered, and playful with enough white space.

## [Option A: Light Mode]

> **Background:** Warm off-white or cream (`#FDFDFA`) to soften the stark black borders.
>
> **Cards & Components:** White backgrounds with consistent 3px black borders.
>
> **Shadows:** Hard offset shadows (`4px 4px 0px #000`) without blur.
>
> **Text:** Deep black or charcoal for maximum contrast against light backgrounds.
>
> **Accents:** Use vibrant but flat colors sparingly (cyan, orange, lime green).

## [Option B: Dark Mode]

> **Background:** Deep charcoal or near-black (`#0F0F0F` or `#1A1A1A`).
>
> **Cards & Components:** Slightly lighter dark background (`#2A2A2A`) with white or light gray borders (2px to 3px).
>
> **Shadows:** Hard offset shadows using a lighter gray or white (`4px 4px 0px rgba(255,255,255,0.1)`).
>
> **Text:** Crisp white for headings, light gray for body text.
>
> **Accents:** Bright neon colors (electric cyan, hot pink) pop strongly against dark backgrounds.

## Quick Tips

- Hard shadows are key—always use solid offsets with no blur radius
- The playful hover animations (slight movement or shadow expansion) add delight without compromising minimalism
- Works beautifully for donation platforms, personal portfolios, and minimalist marketplaces
- Keep white space generous; brutalism doesn't mean cramped
- The centered, bold approach is excellent for drawing attention to key CTAs

## [2. Accessibility]

> **Color Contrast:** Light mode: black text on cream background meets WCAG AAA. Dark mode: white text on charcoal meets WCAG AA+. Test accent colors (cyan, orange) against backgrounds to ensure min 4.5:1 contrast ratio.
>
> **Semantic HTML:** Use semantic tags (`<header>`, `<nav>`, `<main>`, `<button>`, `<section>`) instead of divs. Ensure all buttons and interactive elements have clear focus states with the same hard shadow style (e.g., 2px solid border highlight).
>
> **Keyboard Navigation:** All interactive elements (buttons, inputs, links) must be keyboard-accessible. Use `:focus-visible` pseudo-class to show focus indicator that matches the hard shadow aesthetic.
>
> **Text Alternatives:** All images must have descriptive `alt` text. Icons that convey meaning should have aria-labels or screen reader text included.
>
> **Focus State Example:** `button:focus-visible { border: 3px solid #000; box-shadow: 6px 6px 0px 0px #000; outline: none; }`

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Stack all cards vertically. Reduce border thickness to 2px. Decrease shadow offset to 2px 2px. Use larger tap targets (min 44px height for buttons).
> - **Tablet (481px - 1024px):** Allow 2-column grid layouts where appropriate. Border thickness remains 3px. Scale typography: headings 24-32px.
> - **Desktop (1025px+):** Full 3-column grids possible. Maintain 3px borders and hard shadows. Headings 32-48px.
>
> **Fluid Typography:** Base font size scales between 14px (mobile) and 18px (desktop). Use CSS `clamp(14px, 2.5vw, 18px)` for flexible scaling.
>
> **Layout Adjustments:** On mobile, reduce padding/margin by 25%. Maintain white space hierarchy but compress vertical spacing. Cards should span full width on mobile with consistent 2px gaps.

## [4. Animation & Motion]

> **Hover Effects:** Buttons and cards move slightly on hover (e.g., `transform: translate(-2px, -2px)`) and shadow increases (from 4px 4px to 6px 6px). Use 150ms ease-out timing.
>
> **Transition Timing:**
>
> - Button interactions: 150ms ease-out
> - Focus states: 100ms linear
> - Shadow changes: 150ms cubic-bezier(0.34, 1.56, 0.64, 1)
>
> **Keyframe Example:**
>
> ```css
> @keyframes brutalist-pulse {
>   0% {
>     box-shadow: 4px 4px 0px #000;
>   }
>   50% {
>     box-shadow: 6px 6px 0px #000;
>   }
>   100% {
>     box-shadow: 4px 4px 0px #000;
>   }
> }
> ```
>
> **Easing:** Avoid smooth transitions; prefer sharp, instant visual feedback. Use `ease-out` for movement to feel snappy and intentional.

## [5. Concept & Context]

> **Design Philosophy:** Neo-Brutalism strips away ornament and applies digital constraints aggressively—think of it as brutalist architecture adapted for the web. It deliberately looks 'unrefined' to communicate directness and authenticity.
>
> **Best Use Cases:**
>
> - Donation platforms & fundraising sites (Saweria-style)
> - Personal portfolios for designers/developers who want bold presence
> - Minimalist e-commerce or indie product sites
> - Startups that want to signal "lean and direct" ethos
>
> **When NOT to Use:**
>
> - Enterprise SaaS needing a trustworthy, polished feel (may feel too rough)
> - Luxury or high-end brands (clashes with sophistication)
> - Accessibility-critical sites with large elderly audiences (hard shadows can feel jarring)
>
> **Limitations:** The hard shadows and black borders can feel harsh on small screens. Requires generous white space to avoid visual overwhelm. Niche appeal—not universally liked, suits specific brand identities.
