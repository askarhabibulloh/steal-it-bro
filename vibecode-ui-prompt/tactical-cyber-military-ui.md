# Tactical Cyber Military UI

Precision-focused tactical interface inspired by Valorant with zero rounding, aggressive geometry, sharp lines, and mechanical feedback.

## [1. The Essentials]

> Create a futuristic, tactical, game-inspired interface based on the 'Precision Functionalism' aesthetic of Valorant. The UI must strictly adhere to these core principles:
>
> **Zero Rounding:** All containers, buttons, input fields, and graphic elements must have sharp, non-rounded corners. All curves must be simulated with precise stepped or beveled cuts.
>
> **Geometric Geometry:** All layouts must use aggressive diagonals, trapezoids, skewed boxes, and sharp point-cuts to break up standard rectangular blocks.
>
> **Line Precision:** Use very thin, precise, geometric lines as frames and borders. Accentuate container corners with extra sharp-angled graphic details that 'clip' onto the main frame.
>
> **Typography:** Use a bold, technical, blocky sans-serif font family. Headers must be all-caps and large. Use large, dramatic status text (e.g., 'VICTORY', 'DEFEAT', 'MATCH FOUND').
>
> **Interface Depth:** The depth must be achieved through flat layering, sharp edge-glints, and precise, directional glow lines, not soft blurred shadows.
>
> **Components:** All interactive elements must be angular, frame-based constructions. Use a 'cutout' effect rather than a solid background. Provide precise mechanical feedback on interaction (e.g., a glitch effect or a mechanical shift in lines).

## [Option A: Light Mode]

> **Color Palette:** A pristine, sterile light gray or off-white background (`#F0F2F5`). Borders must be a precise dark charcoal or deep gray. Primary accents must be electric cyan (`#00E1FF`) and a deep tactical red (`#BF1616`).
>
> **Styling:** The containers should look like etched, precision-machined panels. Accents should be clean light-guides.
>
> **Typography Contrast:** All text must be high-contrast, deep dark gray or deep blue-gray against the white background.

## [Option B: Dark Mode]

> **Color Palette:** The base background must be a deep dark teal or midnight navy (`#0A1A1A` or `#101625`). Use borders of light gray or subtle glowing lines. Primary accents must be electric cyan, vibrant Valorant-Red (`#FF4655`), and warm amber.
>
> **Styling:** The interface should look like it's projected from a dark terminal. Use precise neon-line borders. Apply a subtle 'glitch' effect and glowing accents that emerge from the dark panels.
>
> **Typography Contrast:** Use crisp white and electric accent colors (cyan, red) for all text against the dark panels.

## [2. Accessibility]

> **Contrast & Military Colors:** Dark tactical colors (deep grays, blacks, dark olive) combined with bright accent lines (neon green, red, yellow) generally provide strong contrast. Test specific color combinations for WCAG compliance—some neon+dark combos may need adjustment.
>
> **Focus States:** Use bright accent color for focus (e.g., neon outline or tactical glow). Ensure focus indicator is unmissable in tactical layouts.
>
> **Semantic Structure:** Despite technical aesthetic, use semantic HTML. Buttons as `<button>` elements, proper heading hierarchy, form labels associated with inputs. Tactical doesn't mean semantically messy.
>
> **Reduced Motion:** Tactical designs can have staggered animations or scan effects. Provide `@media (prefers-reduced-motion: reduce)` to disable animations—layout remains clear and static.
>
> **Information Architecture:** Tactical layouts are information-dense. Ensure logical tab order and clear navigation paths. Use ARIA labels for obscure icons or abbreviated labels.

## [3. Responsive Design]

> **Breakpoints:**
>
> - **Mobile (320px - 480px):** Stack tactical elements vertically. Reduce accent line complexity—hide secondary data. Minimize animation effects. Padding 8-12px. Font sizes 12-14px for labels, 18-20px for headers.
> - **Tablet (481px - 768px):** 2-column tactical layouts possible. Moderate accent line complexity. Animation remains subtle. Padding 12-16px. Accent line width 1-2px.
> - **Desktop (1025px+):** Full tactical dashboard with multiple columns, complex HUD-like layouts. Accent lines 2-3px. Heavy animation and scan effects active. Padding 16-20px.
>
> **Grid & Layout:** Use CSS Grid for tactical layouts—allows complex arrangements that still reflow cleanly on mobile when converted to single-column.
>
> **Data Density:** On mobile, show only critical tactical data. On desktop, full information density with staggered readouts and status indicators.

## [4. Animation & Motion]

> **Scan Lines & Glyphs:** Subtle moving scan lines (1-2s cycle) add tactical vibe. Border/accent lines can have animated "charge" effect (color gradient sliding along line).
>
> **Status Pulse:** Active elements (buttons, alert states) can have pulsing glow in accent color. Use 1.5-2s cycle, low opacity pulse.
>
> **Transition Timing:**
>
> - Scan line animation: 2s infinite linear
> - Status pulse: 1.5s infinite ease-in-out
> - Hover effects: 150ms ease-out
> - Data updates: 300ms cubic-bezier(0.34, 1.56, 0.64, 1)
>
> **Keyframe Example:**
>
> ```css
> @keyframes tactical-charge {
>   0% {
>     background-position: 0 0;
>   }
>   100% {
>     background-position: 100% 0;
>   }
> }
> @keyframes tactical-pulse {
>   0%,
>   100% {
>     box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
>   }
>   50% {
>     box-shadow: 0 0 20px rgba(0, 255, 0, 0.7);
>   }
> }
> ```
>
> **Performance:** Multiple simultaneous animations can strain mobile. Limit active animations to max 3-4 per viewport. Disable animation on very small screens.

## [5. Concept & Context]

> **Design Philosophy:** Tactical Cyber-Military merges military/tactical aesthetic with cybersecurity & combat game aesthetics—functional, information-dense, high-alert ready. Communicates authority, precision, security, and high-stakes focus.
>
> **Best Use Cases:**
>
> - Security/threat monitoring dashboards
> - Military or defense tech websites
> - Tactical/strategy gaming interfaces
> - Cybersecurity company branding
> - Special operations or emergency response portals
> - Esports game interfaces or tournament platforms
>
> **When NOT to Use:**
>
> - Consumer products (too intimidating/aggressive)
> - Wellness, hospitality, or lifestyle brands
> - Accessibility-critical sites (high visual complexity)
> - Elderly audiences (niche appeal, unfamiliar aesthetic)
>
> **Limitations:** High visual intensity—exhausting for extended use. Information density can overwhelm casual users. Niche appeal—not suitable for general-audience sites. Heavy animation can impact performance. Color palette is narrow (greens, yellows, reds)—limited brand flexibility.

## Quick Tips

- All angles and cuts should be intentional and geometric—avoid accidental distortion
- The zero-rounding principle is strict and creates a very bold, recognizable aesthetic
- Excellent for gaming, competitive apps, and tactical software
- Glitch effects and line shifts provide mechanical and satisfying feedback on interaction
- The combination of flat layering with sharp angles creates a unique sense of depth
- Use transforms carefully to maintain pixel-perfect alignment
