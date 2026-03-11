# Glassmorphism

Frosted glass aesthetic with backdrop blur, semi-transparent containers, and vibrant 3D background shapes.

## [1. The Essentials]

> Create a modern web interface using a Glassmorphism design style. The UI must follow these core technical specifications:
>
> **Glass Container:** Use a semi-transparent background with `backdrop-filter: blur(12px)` to create a frosted glass effect.
>
> **Border/Stroke:** Apply a very thin (1px) subtle border to the glass cards to define the edges, using a low-opacity white or light color.
>
> **Background:** The page background must feature vibrant, colorful floating 3D shapes (spheres or organic blobs) and a mesh gradient to make the glass transparency visible and 'pop'.
>
> **Shadows:** Use soft, large-spread shadows to create a sense of depth and layered elevation.
>
> **Components:** All buttons and input fields should also inherit a subtle glass effect or a high-contrast solid color for clear CTA (Call to Action).

## [Option A: Light Mode]

> **Color Palette:** Use a bright, pastel-colored mesh gradient for the background (e.g., soft pinks, light purples, and cyans).
>
> **Glass Tint:** The glass containers should have a white tint with low opacity, such as `rgba(255, 255, 255, 0.2)`.
>
> **Typography:** Use dark, high-contrast text (dark navy or charcoal) for maximum readability against the bright background.

## [Option B: Dark Mode]

> **Color Palette:** Use a deep, dark background (e.g., `#0F172A` or deep midnight blue) with high-saturation neon blobs (vibrant purple, electric blue, or orange) behind the glass.
>
> **Glass Tint:** The glass containers should have a subtle dark or neutral tint with very low opacity, such as `rgba(255, 255, 255, 0.05)`.
>
> **Typography:** Use crisp white or light gray text. Use a vibrant accent color (like neon yellow or cyan) for active links or primary buttons.

## Quick Tips

- Ensure blur effect is hardware-accelerated for smooth performance
- Test glass effect on different background complexities
- Maintains excellent readability when layering multiple glass elements
- Great for premium, modern dashboards and SaaS products

## [2. Accessibility]

> **Color Contrast:** Light mode: dark text on semi-transparent white glass must maintain 4.5:1 contrast against the gradient background. Dark mode: white text on dark glass meets WCAG AAA. Always test text readability with background shapes visible.
>
> **Focus States:** Glass elements need visible focus indicators. Use a 2px colored border (light mode: dark border, dark mode: neon color) that contrasts against the glass and background gradient.
>
> **Semantic HTML:** Use proper semantic tags. Buttons should be `<button>` elements, not divs. Ensure glass containers have proper ARIA landmarks.
>
> **Reduced Motion:** Provide `@media (prefers-reduced-motion: reduce)` media query to dial down animation/parallax effects for users sensitive to motion.
>
> **Text Readability:** Ensure sufficient opacity and contrast. A 0.2 glass tint is the maximum opacity for readability; go lower (0.05-0.15) if background complexity increases.

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Reduce blur amount to 8px (heavier blur on small screens helps readability). Stack glass cards vertically. Reduce padding inside glass containers to 16px. Backgrounds (3D shapes) should be simplified or hidden to reduce visual noise.
> - **Tablet (481px - 1024px):** Blur can increase to 10px. Allow 2-column layouts. Padding increases to 20px. Background animation should be subtle.
> - **Desktop (1025px+):** Full blur effect at 12px. Multi-column layouts with layered glass cards. Padding 24-32px. Complex background shapes and gradients visible.
>
> **Glass Tint Adjustments:** On mobile with small viewport, increase glass opacity slightly (0.25 instead of 0.2) for better contrast against busy backgrounds.
>
> **Background Gradient Scaling:** 3D shapes and mesh gradients should scale and reposition responsively—use `background-size: cover` and `background-position: center`.

## [4. Animation & Motion]

> **Subtle Parallax:** Glass containers can have very mild parallax movement on scroll (10-20px offset max at desktop, 0px on mobile). Keep it gentle so it doesn't feel jarring.
>
> **Transition Timing:**
>
> - Hover effects: 200ms ease-out
> - Blur adjustments: 300ms ease-in-out
> - Focus/interaction: 150ms ease-out
>
> **Keyframe Example:**
>
> ```css
> @keyframes glass-float {
>   0%,
>   100% {
>     transform: translateY(0px);
>   }
>   50% {
>     transform: translateY(-8px);
>   }
> }
> ```
>
> **Performance:** Ensure blur is GPU-accelerated using `will-change: filter` sparingly. Limit number of blurred elements on screen at once (max 5-6) to maintain 60 FPS.

## [5. Concept & Context]

> **Design Philosophy:** Glassmorphism merges physical transparency with digital depth—frosted glass over vibrant, dynamic backgrounds. It communicates modernity, layering, and premium feel. Think of it as a "window into digital elegance."
>
> **Best Use Cases:**
>
> - Premium SaaS dashboards & analytics tools
> - Modern web applications (design tools, creative platforms)
> - Portfolio sites showcasing creative work
> - Marketing sites for tech/design products
>
> **When NOT to Use:**
>
> - Content-heavy sites requiring maximum legibility (blur reduces clarity)
> - Sites targeting older audiences unfamiliar with glassmorphism
> - Accessibility-critical applications where visual complexity must be minimal
> - Low-powered devices (blur effect expensive to render)
>
> **Limitations:** Performance-dependent—blur effects require modern browser support. Not ideal for text-heavy pages where readability is paramount. Animated backgrounds can cause motion sickness for sensitive users. Fewer color combinations work well with glass effect.
