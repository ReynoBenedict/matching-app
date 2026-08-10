---
name: Statistika Institutional System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424750'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737781'
  outline-variant: '#c3c6d2'
  surface-tint: '#2f5ea1'
  primary: '#002b5a'
  on-primary: '#ffffff'
  primary-container: '#004182'
  on-primary-container: '#84aff7'
  inverse-primary: '#a9c7ff'
  secondary: '#006493'
  on-secondary: '#ffffff'
  secondary-container: '#44b7fd'
  on-secondary-container: '#004668'
  tertiary: '#4e1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#712d02'
  on-tertiary-container: '#f79564'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#0c4687'
  secondary-fixed: '#cae6ff'
  secondary-fixed-dim: '#8ccdff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004b70'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#783206'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Public Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Public Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is engineered for the high-stakes, data-intensive environment of the Badan Pusat Statistik (BPS) Kota Malang. It prioritizes **Institutional Authority** and **Functional Clarity** over aesthetic trends. The visual language is rooted in **Corporate Modernism**, characterized by a structured layout, a disciplined color palette, and a focus on information density.

The emotional goal is to evoke a sense of stability, precision, and public trust. The interface acts as a silent, efficient tool for civil servants, facilitating the transition from raw data to actionable national statistics without visual distraction.

**Key Principles:**
- **Objectivity:** The UI should never obscure the data.
- **Reliability:** Standardized patterns ensure the system feels robust and predictable.
- **Hierarchy:** Clear typographic and tonal distinctions guide users through complex administrative workflows.

## Colors

The color strategy utilizes a "Government Blue" foundation to reinforce institutional identity. 

- **Primary (#004182):** Reserved for high-level structural elements like the global sidebar, header backgrounds, and primary CTA buttons. It represents the "authority" of the BPS.
- **Secondary (#0099DD):** Used for interactive highlights, active states in navigation, and focused text links. It provides necessary vibrancy for task-oriented focus.
- **Neutrals:** A range of Slate grays are used for borders and text to maintain a soft contrast that reduces eye strain during long periods of data entry.
- **Semantic Palette:** We use muted, deeper tones for success, warning, and error states. This ensures that status indicators are clearly legible against the light background without being overly aggressive.

## Typography

**Public Sans** is selected for its institutional heritage and exceptional legibility in dense environments. 

For statistical data, always enable **tabular figures** (`tnum`) to ensure that numbers align vertically in tables, facilitating easier comparison of data points. Use `body-sm` and `data-tabular` for the majority of internal data processing screens to maximize the information visible above the fold. 

Headlines should use a tighter letter spacing and heavier weights to stand out against the functional "noise" of data tables and forms.

## Layout & Spacing

The system uses a **Fixed-Fluid Hybrid** model. Internal data views are fluid to utilize the full width of the desktop screen, while executive dashboards and forms use a max-width container (1280px) to maintain readability.

**Grid System:**
- **Desktop:** 12-column grid with 20px gutters. 
- **Sidebar:** Fixed at 260px for consistent navigation access.
- **Margins:** 32px on desktop to provide visual "breathing room" around dense content blocks.

**Spacing Rhythm:** 
A strict 4px baseline grid is used. Component internal padding should favor the `sm` (8px) and `md` (16px) units to maintain a compact but accessible density.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than aggressive shadows. 

1.  **Level 0 (Background):** `#F8FAFC` - The canvas for the application.
2.  **Level 1 (Cards/Surface):** White `#FFFFFF` with a 1px border of `#E2E8F0`. This is the primary container for data.
3.  **Level 2 (Active/Hover):** A subtle ambient shadow (0px 4px 6px -1px rgba(0,0,0,0.05)) is applied only to interactive elements like cards or buttons when hovered.
4.  **Level 3 (Modals/Overlays):** A more pronounced shadow to indicate focus and separation from the primary data layer.

Avoid using color blurs or transparency; depth is communicated through clear structural boundaries and subtle tonal shifts.

## Shapes

The design system uses **Soft (Level 1)** roundedness. 

- **Standard (4px):** Used for input fields, buttons, and small UI components.
- **Large (8px):** Used for cards, containers, and primary content sections.
- **Full (Pill):** Only used for status badges (e.g., "Completed", "Pending") to distinguish them from interactive buttons.

This moderate rounding maintains a professional "government" feel—more approachable than sharp corners but more serious than the highly rounded "consumer" aesthetics.

## Components

**Buttons**
- **Primary:** Deep Navy Blue background with white text. High contrast for critical actions.
- **Secondary:** White background with Deep Navy Blue border and text. 
- **Ghost:** No background or border, used for tertiary actions or within table rows to reduce visual clutter.

**Data Tables**
The centerpiece of the application. Rows should have a subtle hover state (`#F1F5F9`). Use "Zebra Striping" only for tables exceeding 20 rows. Headers must be "Sticky" with a slightly darker gray background and `label-md` typography.

**Form Inputs**
Inputs use a 1px border (`#CBD5E1`). Focused states use the Secondary Blue (#0099DD) for the border and a 2px outer "halo" with 20% opacity. Labels are always positioned above the input for clarity.

**Badges/Chips**
Used for status. They must use the muted semantic colors with a light tint background (e.g., Success: Dark Green text on light mint background) to ensure they don't compete with primary action buttons.

**Navigation**
A persistent left-hand sidebar using the Primary Navy Blue background. Active items are indicated by a 4px left-border of Secondary Blue and a subtle background highlight.