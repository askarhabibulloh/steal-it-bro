# Bento Grid Layout

Responsive modern grid system with large rounded corner tiles, generous spacing, and clean typography.

## [1. The Essentials]

> Create a web interface using a Bento Grid layout system. The design must follow these core technical specifications:
>
> **Grid Structure:** Implement a responsive CSS Grid (or Bento-style grid) where content is divided into 'tiles' or 'cards' of varying sizes (span different column/row widths).
>
> **Corner Radius:** Every grid item must have large, pronounced rounded corners (e.g., `rounded-3xl` or 24px to 32px) to create a modern, soft look.
>
> **Spacing:** Maintain a consistent and generous 'gap' between tiles (e.g., `gap-4` or `gap-6`) to ensure the layout feels breathable.
>
> **Content Hierarchy:** Use the largest tiles for primary features/hero content and smaller tiles for secondary information or metrics.
>
> **Typography:** Use a clean, modern sans-serif font (like Inter or Geist) with clear bold headings inside each tile.

## [Option A: Light Mode]

> **Background:** Use a very subtle off-white or light gray background (e.g., `#F9FAFB`).
>
> **Tile Styling:** Grid tiles should be pure white (`#FFFFFF`) with a very thin, light gray border (1px solid `#E5E7EB`).
>
> **Shadows:** Apply a very soft 'soft-ui' shadow to each tile to give them a slight lift from the background without looking heavy.
>
> **Accents:** Use a single accent color (like a soft blue or indigo) for icons or small badges within the tiles.

## [Option B: Dark Mode]

> **Background:** Use a deep, dark neutral background (e.g., `#09090B` or `#0F172A`).
>
> **Tile Styling:** Grid tiles should have a slightly lighter dark background (e.g., `#18181B`).
>
> **Border Highlight:** Use a subtle 'inner-glow' or a thin border with low opacity (e.g., `border-white/10`).
>
> **Glow Effect:** (Optional) Add a very subtle radial gradient glow that follows the mouse or sits in the corner of the primary tiles to add depth.
>
> **Typography:** Crisp white text for headings and muted gray (`#A1A1AA`) for secondary text.

## [2. Accessibility]

> **Color Contrast:** Ensure text on colored bento boxes maintains WCAG AA+ contrast (4.5:1 min). Test combinations—especially light colors on light boxes and dark text on dark backgrounds.
>
> **Grid Semantics:** Use `<section>` or `<article>` tags for bento boxes rather than plain divs. Ensure heading hierarchy within boxes is logical. Use ARIA labels to describe grid purpose if needed.
>
> **Focus Management:** Each bento box or interactive element within grid should have visible focus state (outline or border change). Tab order should follow visual left-to-right, top-to-bottom flow.
>
> **Responsive Grid:** Grid must reflow logically at different breakpoints—not just shrink proportionally. Ensure reading order in reflow makes sense (use CSS `order` property if needed).
>
> **Text Sizing:** Ensure text inside small bento boxes remains readable. Use minimum 12px font size; larger when possible. Avoid text overflow—use text-overflow: ellipsis if needed.

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Switch to single-column or stacked layout. Each box becomes full-width or 2-column max. Minimal gap between boxes (8px). Padding reduced to 12px inside boxes.
> - **Tablet (481px - 1024px):** 2-3 column grid. Gap increases to 12-16px. Box padding 16px. Some boxes can span 2 rows/cols for visual interest.
> - **Desktop (1025px+):** Full multi-column bento grid (4-6 columns possible). Gap 16-20px. Boxes with varied sizes (some 2x2, some 1x2, some 1x1). Padding 20-24px.
>
> **CSS Grid Setup:**
>
> ```css
> @media (max-width: 480px) {
>   .bento-grid {
>     grid-template-columns: 1fr;
>   }
> }
> @media (min-width: 481px) and (max-width: 1024px) {
>   .bento-grid {
>     grid-template-columns: repeat(2, 1fr);
>   }
> }
> @media (min-width: 1025px) {
>   .bento-grid {
>     grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
>   }
> }
> ```
>
> **Box Sizing:** Use `aspect-ratio: auto` or define explicit heights to maintain visual balance. Ensure boxes don't collapse below minimum readable size.

## [4. Animation & Motion]

> **Hover Effects:** Individual bento boxes can lift slightly on hover (`transform: translateY(-4px)`) with shadow increase. Use 200ms ease-out.
>
> **Stagger Animation:** If grid loads with animation, use staggered entrance—each box animates in with slight delay (50ms offset). Creates visual flow without overwhelming.
>
> **Transition Timing:**
>
> - Hover elevation: 200ms ease-out
> - Grid reflow: 300ms ease-in-out (if animated)
> - Focus state: 150ms ease-out
>
> **Keyframe Example:**
>
> ```css
> @keyframes bento-enter {
>   from {
>     opacity: 0;
>     transform: translateY(8px);
>   }
>   to {
>     opacity: 1;
>     transform: translateY(0);
>   }
> }
> ```
>
> **Performance:** Limit simultaneous animations. Use `will-change: transform` sparingly. Ensure staggered animations don't exceed 1-2 seconds total.

## [5. Concept & Context]

> **Design Philosophy:** Bento-grid layout is named after Japanese bento boxes—compartmentalized, balanced, and visually rhythmic. It communicates organization, modularity, and modern design sensibility while maintaining playful visual interest through varied box sizing.
>
> **Best Use Cases:**
>
> - Portfolio showcases with varied project types
> - Product galleries or service feature displays
> - Dashboard layouts organizing diverse data
> - Creative agency or portfolio sites
> - App feature overviews with different-sized elements
>
> **When NOT to Use:**
>
> - Linear, sequential content (use traditional grid/list layout)
> - Accessibility-critical sites with complex layouts (reflow can confuse)
> - Mobile-first audiences on very small screens (single column becomes repetitive)
> - Data-heavy tables or lists needing consistent row alignment
>
> **Limitations:** Bento grids can feel visually complex—requires careful typography and spacing to avoid chaos. Reflow on mobile may reduce impact of varied sizing. CSS Grid browser support is strong but not universal in older devices. May require JavaScript for advanced interactions or masonry behavior on mobile.

## Quick Tips

- Bento grids are highly responsive—use media queries to adjust grid-template-columns for mobile
- The varying tile sizes create visual interest; plan your layout to balance large and small tiles
- Perfect for portfolios, product showcases, and modern SaaS dashboards
- Pairs well with photography or illustrated content within tiles
