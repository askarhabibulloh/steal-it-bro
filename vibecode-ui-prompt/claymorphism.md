# Claymorphism

Soft, inflated 3D design with layered shadows creating depth, volume, and a playful squishy appearance.

## [1. The Essentials]

> Create a web interface using a Claymorphism design style. The UI must feel 'inflated', soft, and 3D. Follow these core technical specifications:
>
> **Shapes:** Use very large corner radiuses (e.g., 32px to 48px) to give all cards and buttons a rounded, organic, and 'puffy' look.
>
> **The 3D Effect (Crucial):** Every element must have a combination of shadows to create volume:
>
> - **Inner Shadow 1 (Top-Left):** A light/white highlight to simulate a light source hitting the top of the object.
> - **Inner Shadow 2 (Bottom-Right):** A darker, subtle shadow to create depth inside the shape.
> - **Outer Shadow:** A soft, large-spread drop shadow to make the element appear floating above the background.
>
> **Typography:** Use a rounded, bold, and friendly sans-serif font (e.g., 'Quicksand', 'Fredoka', or 'Nunito').
>
> **Interactions:** Buttons should feel 'squishy'—when hovered or clicked, they should slightly scale down or change shadow depth.

## [Option A: Light Mode]

> **Color Palette:** Use soft pastel background colors (e.g., Sky Blue `#E0F2FE`, Mint `#F0FDF4`, or Lavender `#F5F3FF`).
>
> **Element Colors:** Main cards should be white or very light pastel, while primary buttons use vibrant but soft colors (e.g., Soft Pink or Cyan).
>
> **Shadow Details:** Use white for top-left inner shadows and a slightly darker version of the element's color for the bottom-right inner shadow.
>
> **Text Color:** Use high-contrast dark gray or deep navy for readability.

## [Option B: Dark Mode]

> **Color Palette:** Use a deep, saturated dark background (e.g., Dark Indigo `#1E1B4B` or Deep Charcoal `#121212`).
>
> **Element Colors:** Use slightly lighter shades of the background for cards. For primary actions, use 'Neon-Clay' colors (like electric purple or bright salmon).
>
> **Shadow Details:** Use a subtle light-gray/white (low opacity) for the top-left inner highlight to maintain the 3D effect in the dark. Use black for the bottom-right inner shadow.
>
> **Text Color:** Use crisp white or light silver text.

## [2. Accessibility]

> **Color Contrast:** Claymorphism often uses soft, muted tones. Test text color against background to ensure 4.5:1 contrast minimum. Avoid using color/shadow alone to convey meaning—add text labels or icons.
>
> **Focus States:** Use a clear, contrasting outline or subtle shadow change to indicate focus. Example: `focus-visible: 3px solid #333` with background tint change.
>
> **Depth Cues:** The 3D clay effect relies on visual depth—ensure focus state doesn't get lost in shadow complexity. Use slight color shift or brightness change for focus to keep it pop.
>
> **Semantic HTML:** Use proper semantic structure. Buttons should be `<button>` elements. Ensure form fields have associated labels and clear input purposes.
>
> **Text on Clay:** Ensure text contrast is sufficient even with shadow/gradient effects applied. Use slightly darker text than glassmorphism would require due to clay effect adding visual weight.

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Reduce shadow depth (2-3px blur instead of 8-10px). Soften subtle gradients to avoid pixelation on small screens. Stack clay cards vertically. Padding 12-16px. Border radius 12-16px.
> - **Tablet (481px - 1024px):** Shadows moderate (4-6px). Allow 2-column layouts. Padding 16-20px. Border radius 16-20px.
> - **Desktop (1025px+):** Full shadow depth (8-12px). Multi-column grids possible. Larger padding (20-28px). Border radius 20-24px.
>
> **Gradient Scaling:** Ensure radial/linear gradients in clay materials scale responsively. Avoid hardcoded gradient positions—use percentage-based values.
>
> **Component Sizing:** Clay cards/buttons should feel organic size-wise—scale padding proportionally on mobile (reduce by 25-30%) without losing the clay aesthetic.

## [4. Animation & Motion]

> **Soft Hover:** Clay elements respond to interaction with subtle depth shift (slight shadow increase, very minor scale: 1.02). Use 200ms ease-out transition.
>
> **Press Animation:** Buttons/interactive elements can have "press" effect (shadow decreases, element moves very slightly down) on active state. Use 100ms linear or ease-in.
>
> **Transition Timing:**
>
> - Hover depth change: 200ms ease-out
> - Press active state: 100ms ease-in
> - Focus indicator fade: 150ms ease-out
>
> **Keyframe Example:**
>
> ```css
> @keyframes clay-depress {
>   0% {
>     box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
>     transform: translateY(0);
>   }
>   100% {
>     box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
>     transform: translateY(3px);
>   }
> }
> ```
>
> **Easing:** Prefer `ease-out` for natural object motion, `ease-in-out` for returning to resting state. Avoid sharp transitions—keep everything smooth and organic.

## [5. Concept & Context]

> **Design Philosophy:** Claymorphism takes inspiration from physical clay and modeling—soft, organic, forgiving shapes with subtle depth and tactile feel. It communicates friendliness, approachability, and modern playfulness while remaining sophisticated.
>
> **Best Use Cases:**
>
> - Consumer apps wanting warm, inviting aesthetic
> - Educational platforms & e-learning (approachable feel)
> - Health & wellness apps (soft, caring vibe)
> - Creative tools & design applications
> - Kids' products or family-oriented services
>
> **When NOT to Use:**
>
> - Enterprise/B2B services (too soft/playful)
> - High-security financial applications
> - Minimal/minimalist brand aesthetic
> - Performance-critical sites (shadow rendering can be expensive)
>
> **Limitations:** Complex shadows can slow rendering on mobile devices. Soft aesthetic may not align with bold/authoritative branding. Requires careful color selection—saturation choices impact clay feel. Over-use of gradients can make interface feel plastic rather than natural.

## Quick Tips

- The shadow layering is critical—test on various element sizes
- Works beautifully for playful apps, creative portfolios, and kid-friendly interfaces
- Maintain consistency in shadow offset distances across all elements
- The squishy interaction enhances user delight and engagement
