# VibeCode UI Prompt

Koleksi prompt desain UI yang siap pakai untuk AI code agents. Gunakan style ini bersama ChatGPT, Claude, atau AI builder lainnya untuk mengubah tema UI Anda dengan cepat.

## Cara Cepat

1. **Pilih style** dari daftar di bawah
2. **Buka file** `.md` yang sesuai
3. **Copy bagian yang dibutuhkan:**
   - `[1. The Essentials]` — Aturan inti desain (wajib)
   - `[Option A/B]` — Varian Light/Dark (sesuai kebutuhan)
   - `[2. Accessibility]` — Guidelines WCAG & focus states (recommended)
   - `[3. Responsive Design]` — Breakpoints & layout rules (recommended)
   - `[4. Animation & Motion]` — Transition timing & animation specs (optional)
   - `[5. Concept & Context]` — Kapan pakai/tidak pakai style ini (referensi)
4. **Paste ke AI agent Anda** beserta requirement UI Anda

Contoh instruksi:

```
"Build a login form using Glassmorphism style.
Follow these rules:
- [1. The Essentials] — Core design rules
- [Option B: Dark Mode] — Dark theme
- [3. Responsive Design] — Mobile, tablet, desktop specs
- [2. Accessibility] — WCAG AA contrast & focus states

Tambahan requirement: Add email validation feedback."
```

## Daftar Styles

- **Bento Grid Layout** — Grid responsif dengan rounded tiles besar dan spacing rapi. Cocok untuk dashboard dan landing page.
- **Claymorphism** — Desain lembut 3D dengan warna pastel atau vibrant. Terasa playful dan modern.
- **Cyber-Tech Noir HUD** — Aesthetic futuristik dengan neon glow dan monospace font. Cocok untuk dashboard teknis.
- **Cyber-Y2K Aero Frutiger** — Y2K retro dengan glossy surfaces dan warna aqua. Mix nostalgia dan tech-modern.
- **Glassmorphism** — Efek frosted glass dengan blur effect. Elegan dengan 3D background shapes.
- **Maximalist Brutalism Anti-Design** — Intentionally chaotic dengan thick borders dan bold typography. Edgy dan berani.
- **Modern Retro Y2K Grainy Texture** — Lo-fi Y2K dengan grain texture dan geometric shapes. Vintage vibes.
- **Neo-Brutalism** — Minimalis dengan thick black borders dan hard shadows. Clean dan playful.
- **Pixel Art High-Bit** — Modern pixel art dengan retro aesthetic. Cocok untuk gaming atau playful apps.
- **Tactical Cyber Military UI** — Precision & aggresif geometry, terinspirasi Valorant. Sharp dan mechanical.
- **Vaporwave Retro UI** — Retro-futuristik dengan 3D grid dan Windows 95 vibes. Nostalgic dan artistic.

## Struktur Setiap File Style

Setiap file style diorganisir dalam 5 section utama:

### [1. The Essentials]

**Apa:** Aturan inti desain (warna, border, shadow, typography, layout)  
**Gunakan untuk:** Instruksi dasar ke AI agent  
**Yang dicakup:** Color palette, border/shadow rules, typography, layout principles

### [Option A: Light Mode] & [Option B: Dark Mode]

**Apa:** Varian light dan dark dari style tersebut  
**Gunakan untuk:** Kombinasikan dengan Essentials sesuai kebutuhan tema  
**Yang dicakup:** Warna background, text, accents untuk setiap mode

### [2. Accessibility]

**Apa:** Panduan WCAG, contrast ratios, focus states, semantic HTML  
**Gunakan untuk:** Memastikan UI accessible & user-friendly  
**Yang dicakup:**

- Color contrast specs (WCAG AA/AAA ratios)
- Focus state & keyboard navigation
- Semantic HTML & ARIA labels
- Text readability guidelines

### [3. Responsive Design]

**Apa:** Breakpoints dan layout behavior untuk mobile/tablet/desktop  
**Gunakan untuk:** Memastikan UI responsive di semua device  
**Yang dicakup:**

- Breakpoints explicit (320-480px, 481-1024px, 1025px+)
- Layout adjustments per breakpoint
- Typography scaling
- Component sizing rules

### [4. Animation & Motion]

**Apa:** Timing, easing, keyframe examples, animation specs  
**Gunakan untuk:** Menambah interactivity & polish (opsional)  
**Yang dicakup:**

- Transition timing (ms)
- Keyframe examples (copy-paste ready)
- Easing functions
- Performance tips

### [5. Concept & Context]

**Apa:** Design philosophy, use cases, limitations  
**Gunakan untuk:** Memahami kapan style ini cocok/tidak cocok  
**Yang dicakup:**

- Design philosophy & inspiration
- Best use cases
- When NOT to use
- Technical limitations

## Contoh Instruksi

## Contoh Instruksi

### Contoh 1: Dashboard Stats (Cyberpunk) — LENGKAP

```
"Build a 'Character Stats' dashboard component.

Design Requirements:
- Use Cyber-Tech Noir HUD style:
  * [1. The Essentials] — Core neon glow & monospace rules
  * [Option B: Dark Mode] — Dark techno aesthetic
  * [3. Responsive Design] — Mobile: 320px-480px, Tablet: 481-1024px, Desktop: 1025px+
  * [2. Accessibility] — WCAG AA contrast, focus glow effect

Functionality:
- Display 5 stats: Health, Armor, Ammo, Experience, Level
- Live counter updates when stat changes
- Mobile responsive (stack stats vertically on mobile)
- Accessible keyboard navigation

Additional notes: Make numbers glow neon green, add subtle scan line animation."
```

### Contoh 2: Landing Page (Modern) — MINIMAL

```
"Create a product landing page using Neo-Brutalism style.
Follow [1. The Essentials] + [Option A: Light Mode].
Sections: Hero, Features (3x), Testimonials (2x), CTA.
Make it bold and playful with thick black borders."
```

### Contoh 3: Portfolio (Retro) — MEDIUM

```
"Build a personal portfolio website using Modern Retro Y2K Grainy Texture style.

Style sections to use:
- [1. The Essentials] — Grain texture & geometric shapes
- [2. Accessibility] — Ensure text readable over grain (text-shadow tips)
- [3. Responsive Design] — Reduce grain intensity on mobile

Content: Hero image + bio, 6 project showcase cards (use bento grid), contact form."
```

### Contoh 4: E-commerce Cards (Premium) — FULL FEATURE

```
"Design product listing cards using Glassmorphism style.

Style Rules:
- [1. The Essentials] — Frosted glass, backdrop blur, vibrant backgrounds
- [Option B: Dark Mode] — Dark premium aesthetic
- [3. Responsive Design] — Handle mobile (reduce blur), tablet, desktop layouts
- [4. Animation & Motion] — Subtle hover lift effect (200ms ease-out)
- [2. Accessibility] — Glass opacity visibility check, focus state clarity

Functionality:
- Product image, title, price, rating, Add to Cart button
- Hover: slight lift + shadow increase
- Mobile: full-width cards, simplified layout
- Dark mode ready

Additional: Grid should show 1 column mobile, 2 columns tablet, 3 columns desktop."
```

## Tips & Best Practices

### Penggunaan yang Efektif

1. **Mulai dari [1. The Essentials]** — Setiap style dimulai dari sini, aturan dasarnya solid.
2. **Tambahkan Accessibility untuk produksi** — Jika ini untuk production code, selalu include [2. Accessibility] untuk WCAG compliance.
3. **Responsive Design wajib untuk mobile** — Copy [3. Responsive Design] section ke AI agent agar layout responsive di semua device.
4. **Animation opsional untuk polish** — Jika ingin interactive feel, gunakan [4. Animation & Motion]. Tapi jika simple static page, bisa skip.
5. **Baca [5. Concept & Context]** — Pahami kapan style cocok pakai supaya hasil maksimal.

### Tips Praktis

- **Combine styles:** Bisa mix 2 styles untuk aesthetic unik (contoh: Neo-Brutalism borders + Glassmorphism glass effect)
- **Copy-paste ready:** Semua CSS & code examples siap copy. Paste langsung ke AI agent atau code editor.
- **Responsive by default:** Setiap style punya responsive guideline, gunakan untuk mobile-first workflow.
- **Test hasil:** Setiap hasil dari AI agent, test di browser untuk memastikan glow effects, animations, blur bekerja proper.
- **Accessibility checklist:**
  - Contrast ratio check (use WebAIM Contrast Checker)
  - Keyboard navigation test (Tab through all elements)
  - Focus state visibility
  - Screen reader compatibility (semantic HTML)

### Ketika Memilih Style

**Lihat [5. Concept & Context]** di setiap file untuk:

- ✅ Best use cases (cocok/tidak cocok untuk project type)
- ⚠️ Limitations (keterbatasan teknis & visual)
- 🎨 Design philosophy (kenapa style ini look seperti itu)

Contoh:

- **Glassmorphism** → Good: Premium SaaS dashboards. Bad: Content-heavy text sites.
- **Pixel Art** → Good: Gaming/retro projects. Bad: Enterprise services, accessibility-critical apps.
- **Maximalist Brutalism** → Good: Creative/artistic projects. Bad: Healthcare, finance, corporate.
