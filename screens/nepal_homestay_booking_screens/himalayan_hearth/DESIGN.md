---
name: Himalayan Hearth
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#5a413d'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#8e706c'
  outline-variant: '#e2beba'
  surface-tint: '#b32821'
  primary: '#680003'
  on-primary: '#ffffff'
  primary-container: '#900a0c'
  on-primary-container: '#ff998c'
  inverse-primary: '#ffb4aa'
  secondary: '#9a442d'
  on-secondary: '#ffffff'
  secondary-container: '#fd9174'
  on-secondary-container: '#752814'
  tertiary: '#003546'
  on-tertiary: '#ffffff'
  tertiary-container: '#134c61'
  on-tertiary-container: '#8abbd4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#910b0c'
  secondary-fixed: '#ffdbd2'
  secondary-fixed-dim: '#ffb4a1'
  on-secondary-fixed: '#3c0800'
  on-secondary-fixed-variant: '#7c2e18'
  tertiary-fixed: '#bee9ff'
  tertiary-fixed-dim: '#9ccee7'
  on-tertiary-fixed: '#001f2a'
  on-tertiary-fixed-variant: '#144c61'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
  surface-grain: '#fbf9f4'
  dhaka-red: '#b32821'
  earth-brown: '#5a413d'
  impact-teal: '#316479'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm-italic:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-xs-bold:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 20px
---

## Brand & Style
The brand identity centers on "Modern Heritage"—a sophisticated fusion of traditional Nepalese warmth and contemporary travel luxury. It targets the "conscious traveler" who seeks authentic cultural immersion without sacrificing refined aesthetics. 

The design style is **Tactile & Modern Heritage**. It utilizes organic textures (natural paper grains), traditional patterns (Dhaka weaving), and a warm, earthy color palette to evoke a sense of place and groundedness. The UI should feel like a well-crafted travel journal: tactile, personal, and deeply respectful of local craftsmanship while maintaining a high-performance, modern digital experience.

## Colors
The palette is rooted in the natural and cultural landscape of the Himalayas. 

*   **Primary (Deep Madder):** A rich, historic red derived from traditional dyes, used for brand presence and primary actions.
*   **Secondary (Terracotta):** Warm earth tones used for status indicators and decorative accents.
*   **Tertiary (Mountain Slate):** A cool, deep blue-grey that provides balance and represents the high-altitude environment.
*   **Neutral (Handmade Paper):** Instead of pure white, the system uses a warm, off-white "grainy surface" that mimics natural paper textures.

Use `surface-container` tiers to establish hierarchy, moving from darker "dim" tones for footers/bars to the "lowest" (pure white) for high-elevation cards.

## Typography
The system pairs **Be Vietnam Pro** for headlines—offering a friendly yet sturdy presence—with **Manrope** for body and UI labels to ensure modern clarity.

*   **Headlines:** Should feel authoritative but warm. Use tight letter-spacing on larger display sizes.
*   **Body:** Focuses on readability with generous line heights. Italic variants are used for secondary descriptors (e.g., host names).
*   **Labels:** Heavily utilize uppercase and tracking (letter-spacing) to create a "wayfinding" feel, reminiscent of premium travel maps or luggage tags.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Content is contained within a max-width of 1280px (`max-w-screen-xl`) with responsive horizontal margins that expand from 16px on mobile to 64px on desktop.

Spacing is governed by an 8px base unit. Vertical rhythm is established through `space-y-md` (24px) between major sections. A consistent 20px gutter is used for grid-based widgets. Use "Atmospheric Overflows" (horizontal scrolling with negative margins) for adventure cards and badges on mobile to imply a journey that continues beyond the screen.

## Elevation & Depth
Depth is conveyed through **Tonal Layering and Soft Tinted Shadows**. 

*   **Background:** The base layer uses the `grainy-surface` texture.
*   **Containers:** Elevated elements (cards) use `surface-container-lowest` (#ffffff) to pop against the textured background.
*   **Shadows:** Avoid harsh black shadows. Use extremely subtle, diffused shadows tinted with the primary color (e.g., `rgba(179, 40, 33, 0.05)`).
*   **Borders:** Use low-contrast outlines (`outline-variant`) at 30% opacity to define boundaries without creating visual noise.
*   **Dividers:** Use the "Dhaka Pattern" (a 1px height repeating linear gradient) as a structural divider to reinforce the heritage brand.

## Shapes
The shape language is **Generously Rounded**. Standard containers (cards, hero sections) use `rounded-xl` (1.5rem / 24px) to feel approachable and soft.

*   **Buttons:** Use `rounded-lg` (1rem / 16px) for a comfortable, "squishy" tactile feel.
*   **Badges/Chips:** Use full pill shapes (`rounded-full`) for high-contrast status indicators.
*   **Avatars/Icons:** Circles are preferred for personal identifiers, while square-rounded-lg (12px) is used for utility icons in impact reports.

## Components

### Buttons
*   **Primary:** Solid `primary` color, `on-primary` text, `label-sm` typography. High tactile response (scales to 0.95 on press).
*   **Secondary/Tonal:** `surface-container-highest` background with `primary` text. Bordered with a 20% opacity primary stroke.

### Cards
*   **Spotlight Card:** A horizontal layout on desktop, stacking on mobile. Features a "Dhaka Pattern" top border.
*   **Adventure Card:** Fixed width (280px) for horizontal scrolling. Uses a clear ratio (approx 2:1) for imagery.

### Progress & Badges
*   **Journey Tracker:** Uses a `primary` color fill on a `surface-container-highest` track.
*   **Impact Tiles:** Large, high-contrast numeric displays paired with `label-xs-bold` text and descriptive Material Symbols.

### Navigation
*   **Top Bar:** Sticky, semi-transparent (glassmorphism optional) with the paper texture preserved.
*   **Bottom Nav:** A floating-effect dock with `rounded-t-xl` and active states highlighted via the `secondary-container` background and filled icons.