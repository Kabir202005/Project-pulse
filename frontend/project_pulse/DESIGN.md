---
name: Project Pulse
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 260px
  card-gap: 20px
---

## Brand & Style
The design system for this project embodies a "High-Precision Intelligence" aesthetic tailored for the construction and engineering sector. The brand personality is authoritative, technical, and forward-looking, moving away from traditional "rugged" construction tropes toward a sophisticated, data-driven enterprise identity.

The visual style is **Modern Corporate with Glassmorphism influences**. It utilizes deep obsidian surfaces layered with semi-transparent "glass" cards to create a sense of depth and hierarchy without clutter. This approach ensures that complex analytical data feels organized and high-value. The interface prioritizes clarity, utilizing high-contrast accents against a dark foundation to direct attention to critical project risks and KPIs.

## Colors
The color palette is architected for a dark-first experience that reduces eye strain during long periods of data analysis.

- **Foundations:** The core background uses a near-black obsidian (#050505). Secondary background areas (like sidebars or workspace regions) transition to a deep charcoal (#0F1115).
- **Surfaces:** Analytical cards and interactive containers use a dark slate (#1A1D23).
- **Semantic Accents:** 
  - **Electric Blue (#3B82F6):** Used for primary actions, active states, and general AI-driven insights.
  - **Success Green (#10B981):** Indicates "On Budget," "Safe," or "Completed."
  - **Warning Amber (#F59E0B):** Indicates schedule slips or medium-risk delays.
  - **Risk Red (#EF4444):** Reserved for critical budget overruns or safety hazards.

## Typography
The typography system balances the technical precision of **Geist** with the universal readability of **Inter**. 

- **Geist** is utilized for headlines, KPIs, and labels to provide a distinct, monospaced-influenced technical feel that suits engineering data.
- **Inter** is reserved for body copy and long-form data tables to ensure maximum legibility at smaller scales.
- All labels use a slight tracking (letter-spacing) increase and uppercase styling to differentiate them from interactive text.
- Headlines utilize tight tracking to maintain a compact, "engineered" appearance.

## Layout & Spacing
The layout follows a **structured grid model** designed for high information density without visual crowding. 

- **Sidebar:** A persistent 260px left-hand navigation sidebar provides quick access to project modules.
- **Grid:** A 12-column system is used for the main content area. Analytical cards typically span 3, 4, 6, or 12 columns depending on data complexity.
- **Spacing:** A 4px base unit drives all dimensions. Dashboard views use a standard 24px outer margin and 20px gap between analytical cards to maintain a breathable yet dense environment.
- **Reflow:** On tablet, the 12-column grid collapses to 6, and the sidebar transitions to a collapsed icon-only state. On mobile, the grid becomes a single column with 16px margins.

## Elevation & Depth
This design system avoids heavy drop shadows in favor of **Tonal Layering and Glassmorphism**.

- **Depth Levels:**
  - **Level 0 (Base):** Deepest layer (#050505). Used for the main application background.
  - **Level 1 (Sub-base):** (#0F1115). Used for sidebar backgrounds or header regions.
  - **Level 2 (Cards):** (#1A1D23) with a 1px border of `white/5`. This creates a crisp edge against the dark background.
  - **Level 3 (Popovers/Modals):** Same as Level 2 but with a 20px Backdrop Blur (glass effect) and a slightly brighter border (`white/10`) to simulate physical proximity.
- **Patterns:** Subtle "Blueprint" grid overlays (low-opacity lines at 40px intervals) may be used on Level 0 to reinforce the construction theme.

## Shapes
The shape language is primarily defined by **Large Rounded Containers**. 

- **Cards & Dashboard Modules:** Use a `rounded-2xl` (1rem / 16px) radius to soften the technical nature of the data and provide a premium, modern feel.
- **Interactive Elements:** Buttons and input fields use a `rounded-lg` (0.5rem / 8px) radius to maintain a structural, precise appearance.
- **Status Badges:** Utilize a pill-shaped (full-round) geometry to differentiate them from buttons.

## Components
- **KPI Cards:** Feature a large Geist display number, a mini-sparkline chart, and a semantic status indicator (e.g., +2.4% in green).
- **Analytical Charts:** Use the Electric Blue for primary data series. Grid lines in charts should be kept minimal at `white/5` opacity.
- **Data Tables:** Feature sticky headers with a dark slate background. Rows should use a subtle hover state (`white/2`) rather than alternating zebra stripes.
- **Status Badges:** Low-opacity backgrounds (e.g., `green/10`) with high-opacity text (e.g., `green/90`) to ensure readability on dark surfaces.
- **Buttons:**
  - **Primary:** Solid Electric Blue with white text.
  - **Secondary:** Transparent background with `white/10` border and `white` text.
- **Input Fields:** Dark slate background with a 1px `white/10` border that illuminates to Electric Blue on focus. 
- **Sidebar Navigation:** Icon-led items with a vertical indicator bar on the left for the active state. Use high-quality, thin-stroke SVG icons.