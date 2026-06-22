# Cyra Design System

> Preloved Beauty Terkurasi

## 1. Brand Identity

- **Brand Name:** Cyra
- **Tagline:** Preloved Beauty Terkurasi
- **Tone:** Warm, trustworthy, aspirational, feminine
- **Language:** Indonesian (id)
- **Category:** Preloved fashion & beauty e-commerce
- **Target Audience:** Women 20-35, fashion-conscious, value-seeking

## 2. Color Palette

### Tokens (CSS custom properties from `app/globals.css`)

```css
--background: #FFFBF7
--foreground: #2D2A26
--card: #FFFFFF
--card-foreground: #2D2A26
--primary: #D4A373
--primary-foreground: #FFFFFF
--secondary: #F3E5E0
--secondary-foreground: #5C4A42
--muted: #F8F1EE
--muted-foreground: #6B5D57
--accent: #E8B4B8
--accent-foreground: #FFFFFF
--border: #E8DDD8
--ring: #D4A373
```

### Usage Rules

- **Primary (#D4A373):** CTAs, active states, key highlights — use sparingly for maximum impact
- **Secondary (#F3E5E0):** Subtle backgrounds, badge fills, section dividers
- **Accent (#E8B4B8):** Sale tags, hearts, playful accents, decorative elements
- **Muted (#F8F1EE):** Section backgrounds, card secondary backgrounds
- **Background (#FFFBF7):** Page background — warm off-white, never pure white
- **Border (#E8DDD8):** Cards, inputs, dividers — soft and warm

## 3. Typography

- **Headings:** Playfair Display (serif, CSS var `--font-playfair`)
- **Body:** Inter (sans-serif, CSS var `--font-inter`)
- **Scale:** As defined in Tailwind typography scale
- **Usage:** Playfair for all h1-h6 and decorative/section titles. Inter for body, buttons, labels, small text.
- **Line Height:** Heading 1.1, Body 1.6

## 4. Spacing & Layout

- **Grid:** 12-column, max-width 1280px (`max-w-7xl`)
- **Section padding:** py-16 md:py-24
- **Card padding:** p-6
- **Gap preference:** gap-6 md:gap-8 for grids
- **Border radius:** 0.625rem (--radius)

## 5. Component Specifications

### Buttons
- **Primary:** bg-primary text-primary-foreground, solid
- **Secondary/Outline:** transparent with border-border, border-2
- **Ghost:** no border, subtle hover bg
- **Size:** default h-11 px-6, sm h-9 px-4, lg h-12 px-8
- **Radius:** --radius

### Cards
- **Default:** bg-card, rounded-lg, border-border, shadow-sm
- **Elevated:** same + hover lift transition

### Badges
- bg-secondary, text-secondary-foreground, rounded-full, px-3 py-1, text-sm

### Avatars
- Brand primary background for fallback initials, --radius-full

### Icons
- lucide-react, size-4 default, size-5 for inline decorative, size-6+ for feature icons

## 6. Motion & Animation

- **Default easing:** ease-out (cubic-bezier)
- **Default duration:** 0.3s for interactions, 0.7s for entrances
- **Existing keyframes:**
  - `fadeInUp`: opacity 0→1 + translateY 30px→0, 0.7s
  - Delay classes: animate-delay-100 through animate-delay-400
- **GSAP (for bold animations):**
  - ScrollTrigger for section reveals
  - Staggered card entrances
  - Parallax on hero
- **Hover:**
  - Cards: translateY -4px, shadow increase
  - Icons: subtle scale/rotate (1.1)
  - Buttons: brightness 1.1

## 7. Voice & Content

- Warm and personal, not corporate
- Indonesian throughout, formal but friendly (Anda not kamu)
- Product descriptions: aspirational but honest about preloved condition
- CTAs: direct and action-oriented ("Lihat Koleksi", "Belanja Sekarang")
- Avoid: hype language, excessive exclamation, English mixing

## 8. Anti-Patterns

- ❌ Do not use pure white (#FFFFFF) as page background — always use #FFFBF7
- ❌ Do not use harsh shadows — prefer soft, warm-toned shadows
- ❌ Do not mix font families within the same text block
- ❌ Do not use primary color for body text — use foreground (#2D2A26)
- ❌ Do not use default Tailwind neutral colors — always use the custom palette
- ❌ Do not use images for decorative backgrounds where CSS gradients/patterns suffice
- ❌ Do not over-decorate — cards should breathe, content is hero

## 9. Data Sources

- **Categories:** Strapi CMS via `getCategories()` at `@/lib/categories` — shape: `{ id, documentId, name, slug, description?, image?, order? }`
- **Products:** Strapi CMS via `getFeaturedProducts()` at `@/lib/products` — shape: `{ id, documentId, name, slug, price, compareAtPrice?, images?, shortDescription?, categories? }`
- **Testimonials:** Hardcoded (static)
- **Hero, Value Props, Promo:** Static content

---

*Generated for Open Design enhancement. Last updated: June 2026.*
