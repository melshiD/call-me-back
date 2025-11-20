# Expert Web Design Guidelines for Modern Interfaces

**A Comprehensive Guide to Creating Accessible, Responsive, and Well-Designed Web Applications**

*Last Updated: 2025*

---

## Table of Contents

1. [Introduction](#introduction)
2. [Atomic Design Methodology](#atomic-design-methodology)
3. [Design Tokens & Theming Systems](#design-tokens--theming-systems)
4. [Color Theory & Accessibility](#color-theory--accessibility)
5. [Typography & Visual Hierarchy](#typography--visual-hierarchy)
6. [Spacing & Layout Systems](#spacing--layout-systems)
7. [Responsive Design & Mobile-First](#responsive-design--mobile-first)
8. [Accessibility Standards (WCAG 2.2)](#accessibility-standards-wcag-22)
9. [Component Composition Patterns](#component-composition-patterns)
10. [Micro-interactions & Animation](#micro-interactions--animation)
11. [Page-Type Specific Guidelines](#page-type-specific-guidelines)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Quick Reference Checklist](#quick-reference-checklist)

---

## Introduction

This document provides expert-level guidelines for designing modern web interfaces that are **accessible**, **responsive**, **performant**, and **visually cohesive**. These principles draw from industry standards including WCAG 2.2, atomic design methodology, and modern design systems like shadcn/ui, Material Design, and Carbon Design System.

### Core Principles

1. **User-Centered**: Design for all users, including those with disabilities
2. **Consistent**: Maintain visual and functional consistency across the application
3. **Scalable**: Build systems that grow with your product
4. **Performant**: Optimize for speed and efficiency
5. **Accessible**: Meet or exceed WCAG 2.2 Level AA standards

---

## Atomic Design Methodology

### Overview

Atomic Design, introduced by Brad Frost, organizes UI into five hierarchical layers:

1. **Atoms** - Basic building blocks (buttons, inputs, labels, icons)
2. **Molecules** - Simple combinations of atoms (search bar = input + button)
3. **Organisms** - Complex UI components (header with logo, nav, search)
4. **Templates** - Page-level layouts with placeholder content
5. **Pages** - Specific instances with real content

### 2025 Evolution

Modern atomic design has evolved to include:

- **Tokens/Ions**: Design tokens as sub-atomic elements (colors, spacing, typography values)
- **Behavioral Patterns**: Interaction patterns and states
- **Flexible Application**: Adapt methodology to project needs rather than rigid adherence

### When to Use Atomic Design

**Best For:**
- Design-system-heavy projects
- Component libraries
- Projects with minimal business logic
- UI-dominant applications

**Consider Alternatives For:**
- Complex business logic applications
- Projects where Feature-Sliced Design or Modular Architecture is more appropriate

### Implementation Guidelines

```
Tokens (Design Tokens)
  ↓
Atoms (Button, Input, Label, Icon)
  ↓
Molecules (SearchBar, FormField, Card)
  ↓
Organisms (Header, ProductGrid, ContactForm)
  ↓
Templates (HomePageTemplate, DashboardTemplate)
  ↓
Pages (Home, Dashboard, ProductDetail)
```

**Key Practices:**
- Keep atoms simple and single-purpose
- Molecules should combine 2-5 atoms with a clear purpose
- Organisms are self-contained, reusable sections
- Templates focus on layout and structure
- Pages demonstrate real content scenarios

---

## Design Tokens & Theming Systems

### What Are Design Tokens?

Design tokens are the **sub-atomic elements** of your design system - the named entities that store visual design attributes. They're the single source of truth for design decisions.

### Token Hierarchy (2025 Standard)

#### 1. Global (Primitive) Tokens
Raw values with no contextual meaning:
```css
--color-blue-500: oklch(0.546 0.245 262.881);
--spacing-4: 1rem;
--font-size-base: 16px;
```

#### 2. Alias (Semantic) Tokens
Map global tokens to roles:
```css
--color-primary: var(--color-blue-500);
--color-text-base: var(--color-gray-900);
--spacing-component-gap: var(--spacing-4);
```

#### 3. Component Tokens
Specific to individual components:
```css
--button-padding-x: var(--spacing-component-gap);
--button-background: var(--color-primary);
--card-border-radius: var(--radius-lg);
```

### Theming Best Practices

#### Use OKLCH Color Space
Modern color format with perceptual uniformity:
```css
:root {
  --background: oklch(1 0 0); /* Pure white */
  --foreground: oklch(0.145 0 0); /* Near black */
  --primary: oklch(0.546 0.245 262.881); /* Vivid blue */
}

.dark {
  --background: oklch(0.145 0 0); /* Dark background */
  --foreground: oklch(0.985 0 0); /* Light text */
}
```

**Why OKLCH?**
- Perceptually uniform (equal steps look equally different)
- Wider color gamut than HSL
- Better for programmatic manipulation
- Supports P3 and future color spaces

#### Naming Conventions

**✅ DO:**
- Use semantic names: `--color-surface-primary`, `--color-text-muted`
- Indicate purpose, not appearance: `--color-danger` not `--color-red`
- Keep names stable across themes
- Use consistent prefixes: `--color-*`, `--spacing-*`, `--radius-*`

**❌ DON'T:**
- Use implementation details: `--blue-button-bg`
- Include mode in name: `--color-dark-background`
- Duplicate tokens for each theme

#### Multi-Theme Support (W3C Design Tokens Spec 2025)

```css
/* Base theme */
:root {
  --color-primary: oklch(0.546 0.245 262.881);
  --color-surface: oklch(1 0 0);
}

/* Dark mode */
.dark {
  --color-primary: oklch(0.707 0.165 254.624);
  --color-surface: oklch(0.145 0 0);
}

/* Brand variants */
[data-brand="acme"] {
  --color-primary: oklch(0.627 0.265 303.9);
}

[data-brand="techco"] {
  --color-primary: oklch(0.646 0.222 41.116);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-primary: oklch(0.3 0.3 262.881);
  }
}
```

#### shadcn/ui Token Structure

shadcn/ui uses a comprehensive token system:

```css
:root {
  /* Layout */
  --radius: 0.625rem;

  /* Surfaces */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  /* Actions */
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  /* States */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);

  /* Forms */
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);

  /* Data visualization */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
}
```

### Token Management Best Practices

1. **Centralize**: Keep all tokens in a single source
2. **Document**: Explain rationale and usage for each token
3. **Limit Creation**: Only core team creates new tokens
4. **Version Control**: Track token changes like code
5. **Automated Testing**: Visual regression tests for token changes
6. **Cross-Platform**: Export tokens to multiple formats (CSS, JSON, iOS, Android)

---

## Color Theory & Accessibility

### Color Psychology in UI (2025)

Understanding color's emotional and functional impact:

- **Blue**: Trust, professionalism, calm (finance, healthcare, corporate)
- **Green**: Growth, success, health (environmental, finance, wellness)
- **Red**: Urgency, error, passion (warnings, sales, food)
- **Yellow/Orange**: Optimism, energy, caution (alerts, CTAs, creative)
- **Purple**: Luxury, creativity, spirituality (premium, creative, tech)
- **Gray**: Neutrality, sophistication (backgrounds, professional)

### WCAG 2.2 Color Contrast Standards

#### Minimum Requirements

| Content Type | Level AA | Level AAA | Use Case |
|-------------|----------|-----------|----------|
| Normal Text | 4.5:1 | 7:1 | Body copy, paragraphs |
| Large Text (18.5px+ or 14px+ bold) | 3:1 | 4.5:1 | Headings, large UI text |
| UI Components | 3:1 | - | Buttons, form controls, icons |
| Graphical Objects | 3:1 | - | Charts, diagrams, meaningful graphics |

**Target**: Always aim for Level AA minimum, Level AAA when possible.

#### Practical Examples

```css
/* ✅ GOOD - 7.2:1 contrast ratio */
.text-good {
  color: oklch(0.2 0.01 260); /* Dark gray */
  background: oklch(1 0 0); /* White */
}

/* ⚠️ ACCEPTABLE - 4.6:1 contrast (AA only) */
.text-acceptable {
  color: oklch(0.45 0.01 260); /* Medium gray */
  background: oklch(1 0 0); /* White */
}

/* ❌ FAIL - 2.8:1 contrast */
.text-fail {
  color: oklch(0.7 0.01 260); /* Light gray */
  background: oklch(1 0 0); /* White */
}
```

### Color Contrast Tools

1. **WebAIM Contrast Checker** - Standard contrast validation
2. **Stark** - Figma plugin for real-time checking and colorblind simulation
3. **Contrast Checker (Chrome DevTools)** - Built-in browser tool
4. **Accessible Colors** - Find accessible color combinations
5. **Chroma Creator** - AI-powered accessible palette generation

### Color Systems

#### 60-30-10 Rule

- **60%**: Primary/dominant color (backgrounds, major surfaces)
- **30%**: Secondary color (supporting elements)
- **10%**: Accent color (CTAs, highlights, important actions)

#### Creating Accessible Color Palettes

**Step 1: Define Primary Colors**
```css
--color-primary-h: 262.881; /* Hue */
--color-primary-c: 0.245;   /* Chroma */
--color-primary-light: oklch(0.9 0.05 var(--color-primary-h));
--color-primary-base: oklch(0.546 var(--color-primary-c) var(--color-primary-h));
--color-primary-dark: oklch(0.3 var(--color-primary-c) var(--color-primary-h));
```

**Step 2: Generate Grays**
```css
--gray-50: oklch(0.985 0.002 260);
--gray-100: oklch(0.967 0.003 260);
--gray-200: oklch(0.928 0.006 260);
--gray-300: oklch(0.858 0.008 260);
--gray-400: oklch(0.707 0.015 260);
--gray-500: oklch(0.552 0.016 260);
--gray-600: oklch(0.432 0.014 260);
--gray-700: oklch(0.341 0.012 260);
--gray-800: oklch(0.259 0.009 260);
--gray-900: oklch(0.189 0.006 260);
--gray-950: oklch(0.129 0.004 260);
```

**Step 3: Semantic Mapping**
```css
/* Light mode */
:root {
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-muted: var(--gray-500);
  --surface-base: oklch(1 0 0);
  --surface-elevated: var(--gray-50);
}

/* Dark mode */
.dark {
  --text-primary: var(--gray-50);
  --text-secondary: var(--gray-400);
  --text-muted: var(--gray-500);
  --surface-base: var(--gray-950);
  --surface-elevated: var(--gray-900);
}
```

### Special Considerations

#### Never Use Color Alone
Always pair color with additional indicators:
```html
<!-- ❌ BAD: Only color indicates error -->
<p style="color: red;">This field is required</p>

<!-- ✅ GOOD: Icon + color + text -->
<p class="text-destructive">
  <AlertCircle class="inline" aria-hidden="true" />
  <span>Error: This field is required</span>
</p>
```

#### Dark Mode Best Practices

- **Reduce Pure Black**: Use `oklch(0.145 0 0)` instead of `oklch(0 0 0)`
- **Lower Saturation**: Decrease chroma values in dark mode
- **Elevate with Lighter Backgrounds**: Higher surfaces should be lighter
- **Maintain Contrast**: Don't just invert - recalculate contrast ratios

```css
/* Light mode elevation */
:root {
  --surface-0: oklch(1 0 0);      /* Base */
  --surface-1: oklch(0.985 0 0);  /* Elevated +1 */
  --surface-2: oklch(0.97 0 0);   /* Elevated +2 */
}

/* Dark mode elevation (inverted logic) */
.dark {
  --surface-0: oklch(0.145 0 0);  /* Base */
  --surface-1: oklch(0.205 0 0);  /* Elevated +1 (lighter) */
  --surface-2: oklch(0.269 0 0);  /* Elevated +2 (lighter) */
}
```

---

## Typography & Visual Hierarchy

### Type Scale Systems

Use a consistent, mathematical type scale for visual harmony:

#### Modular Scale (1.250 - Major Third)

```css
:root {
  --font-size-xs: 0.64rem;    /* 10.24px */
  --font-size-sm: 0.8rem;     /* 12.8px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.25rem;    /* 20px */
  --font-size-xl: 1.563rem;   /* 25px */
  --font-size-2xl: 1.953rem;  /* 31.25px */
  --font-size-3xl: 2.441rem;  /* 39.06px */
  --font-size-4xl: 3.052rem;  /* 48.83px */
}
```

#### Font Weight Hierarchy

```css
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

**Usage Guidelines:**
- **Normal (400)**: Body text, default state
- **Medium (500)**: Subtle emphasis, secondary headings
- **Semibold (600)**: Strong emphasis, primary headings
- **Bold (700)**: Critical emphasis, CTAs (use sparingly)

### Line Height (Leading)

```css
:root {
  --line-height-tight: 1.25;    /* Headings */
  --line-height-snug: 1.375;    /* Subheadings */
  --line-height-normal: 1.5;    /* Body text */
  --line-height-relaxed: 1.625; /* Long-form content */
  --line-height-loose: 2;       /* Special cases */
}
```

**Guidelines:**
- Larger text → Tighter line height (1.25 for h1)
- Body text → 1.5 - 1.625 for readability
- Dense information → 1.375 - 1.5
- Long-form content → 1.625 for comfort

### Visual Hierarchy Principles

#### 1. Size & Scale
The most important content should be the largest:
```css
h1 { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); }
h2 { font-size: var(--font-size-3xl); font-weight: var(--font-weight-semibold); }
h3 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
h4 { font-size: var(--font-size-xl); font-weight: var(--font-weight-medium); }
body { font-size: var(--font-size-base); font-weight: var(--font-weight-normal); }
small { font-size: var(--font-size-sm); font-weight: var(--font-weight-normal); }
```

#### 2. Weight & Contrast
Use weight to create hierarchy within the same size:
```html
<div class="stat-card">
  <p class="font-normal text-muted-foreground">Total Revenue</p>
  <p class="font-bold text-4xl">$45,231.89</p>
  <p class="font-medium text-sm">+20.1% from last month</p>
</div>
```

#### 3. Color & Opacity
Establish content hierarchy through color:
```css
.text-primary { color: var(--foreground); }           /* Main content */
.text-secondary { color: var(--muted-foreground); }   /* Supporting text */
.text-muted { opacity: 0.7; }                          /* Less important */
.text-disabled { opacity: 0.38; }                      /* Disabled state */
```

#### 4. Spacing (Proximity)
Related items should be closer together:
```css
.article-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2); /* Tight grouping */
}

.section-gap {
  margin-block: var(--spacing-12); /* Clear separation */
}
```

### Reading Patterns

#### Z-Pattern (Landing Pages)
1. Top left → Top right (header/logo → CTA)
2. Middle left → Middle right (content scan)
3. Bottom left → Bottom right (footer → final CTA)

#### F-Pattern (Content-Heavy Pages)
1. Horizontal scan at top
2. Vertical scan down left side
3. Horizontal scan in middle (shorter)
4. Continue scanning left edge

**Design Implication**: Place important information along these paths.

### Typography Best Practices

1. **Measure (Line Length)**: 45-75 characters per line for optimal readability
   ```css
   .prose {
     max-width: 65ch; /* ~65 characters */
   }
   ```

2. **Alignment**: Left-align for LTR languages (easier to scan)
   ```css
   /* ✅ GOOD for body text */
   p { text-align: left; }

   /* ⚠️ Use sparingly for headings */
   h1 { text-align: center; }

   /* ❌ AVOID for body text */
   p { text-align: justify; } /* Can create rivers of whitespace */
   ```

3. **Font Pairing**:
   - Serif + Sans-serif (classic, readable)
   - Geometric + Humanist (modern, friendly)
   - Monospace for code blocks only
   - Limit to 2-3 typefaces maximum

4. **Web-Safe Fallbacks**:
   ```css
   body {
     font-family:
       'Inter',
       -apple-system,
       BlinkMacSystemFont,
       'Segoe UI',
       Roboto,
       sans-serif;
   }
   ```

---

## Spacing & Layout Systems

### Spacing Scale (8-Point Grid)

Base unit: 4px (0.25rem) for fine control, 8px (0.5rem) for major spacing:

```css
:root {
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;  /* 2px */
  --spacing-1: 0.25rem;     /* 4px */
  --spacing-2: 0.5rem;      /* 8px */
  --spacing-3: 0.75rem;     /* 12px */
  --spacing-4: 1rem;        /* 16px */
  --spacing-5: 1.25rem;     /* 20px */
  --spacing-6: 1.5rem;      /* 24px */
  --spacing-8: 2rem;        /* 32px */
  --spacing-10: 2.5rem;     /* 40px */
  --spacing-12: 3rem;       /* 48px */
  --spacing-16: 4rem;       /* 64px */
  --spacing-20: 5rem;       /* 80px */
  --spacing-24: 6rem;       /* 96px */
}
```

### Spacing Usage Guidelines

```css
/* Component internal spacing */
.button {
  padding: var(--spacing-2) var(--spacing-4); /* 8px 16px */
  gap: var(--spacing-2); /* Space between icon and text */
}

/* Related items */
.form-field {
  margin-bottom: var(--spacing-4); /* 16px between fields */
}

/* Section separation */
.section {
  margin-block: var(--spacing-12); /* 48px between sections */
}

/* Page margins */
.container {
  padding-inline: var(--spacing-4); /* 16px on mobile */
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(--spacing-8); /* 32px on tablet+ */
  }
}
```

### White Space Principles

**White space is not wasted space** - it's a design element that:
- Improves readability and comprehension
- Creates visual breathing room
- Guides the eye through content
- Indicates relationships between elements

#### Generous White Space

```css
/* ✅ GOOD - Comfortable spacing */
.card {
  padding: var(--spacing-6);
  gap: var(--spacing-4);
}

.hero {
  padding-block: var(--spacing-24); /* 96px vertical space */
}

/* ❌ CRAMPED - Difficult to scan */
.card-cramped {
  padding: var(--spacing-1);
  gap: var(--spacing-1);
}
```

### Layout Patterns

#### Container Queries (2025 Standard)

```css
.card-grid {
  container-type: inline-size;
  display: grid;
  gap: var(--spacing-4);
}

/* Responsive based on container, not viewport */
@container (min-width: 400px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container (min-width: 800px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### CSS Grid Layouts

```css
/* Dashboard layout */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr; /* Sidebar + main */
  grid-template-rows: 64px 1fr; /* Header + content */
  gap: var(--spacing-4);
  min-height: 100vh;
}

/* Responsive card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-6);
}

/* Holy grail layout */
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav content aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
}
```

#### Flexbox Patterns

```css
/* Centering */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Space between (nav items) */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
}

/* Auto-flowing items with wrapping */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}
```

---

## Responsive Design & Mobile-First

### Mobile-First Principles (2025)

**Core Philosophy**: Start with mobile design, progressively enhance for larger screens.

#### Why Mobile-First?

1. **Traffic**: 60-75% of web traffic is mobile (2025)
2. **SEO**: Google uses mobile-first indexing
3. **Constraints**: Designing for mobile forces prioritization
4. **Performance**: Lighter base, enhanced progressively

### Breakpoint System

```css
/* Mobile-first breakpoints */
:root {
  --breakpoint-sm: 640px;   /* Large phones */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large screens */
}

/* Base styles: Mobile (< 640px) */
.container {
  padding: var(--spacing-4);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

/* Progressively enhance */
@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-8);
    max-width: 1280px;
    margin-inline: auto;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-6);
  }
}
```

### Mobile Design Best Practices

#### 1. Touch Targets

**Minimum Size**: 44x44px (iOS), 48x48px (Android), **recommended 48x48px**

```css
/* ❌ TOO SMALL */
.button-small {
  padding: 4px 8px;
  min-height: 28px; /* Below minimum */
}

/* ✅ PROPER TOUCH TARGET */
.button {
  padding: var(--spacing-3) var(--spacing-4);
  min-height: 48px;
  min-width: 48px;

  /* Increase tap area without visual change */
  position: relative;
}

.button::before {
  content: '';
  position: absolute;
  inset: -4px; /* Extends clickable area */
}
```

#### 2. Spacing Between Targets

Minimum 8px space between interactive elements:

```css
.button-group {
  display: flex;
  gap: var(--spacing-2); /* 8px minimum */
}
```

#### 3. Readable Text Size

```css
/* ❌ TOO SMALL on mobile */
body {
  font-size: 12px; /* Requires zooming */
}

/* ✅ READABLE */
body {
  font-size: 16px; /* Base size, no zoom needed */
}

@media (min-width: 1024px) {
  body {
    font-size: 18px; /* Larger on desktop */
  }
}
```

#### 4. Thumb-Friendly Navigation

Place primary actions in the **bottom third** of the screen (thumb zone):

```css
/* Bottom navigation bar (mobile) */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-2);
  background: var(--surface-elevated);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-2);
}

/* Hide on desktop, show sidebar instead */
@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
}
```

### Responsive Component Patterns

#### Adaptive Components (shadcn/ui pattern)

```tsx
// Use different components based on screen size
const ResponsiveDialog = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <Dialog>...</Dialog>
  }

  return <Drawer>...</Drawer>
}
```

#### Responsive Typography

```css
/* Fluid typography */
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
  /* Min: 32px, Preferred: 5vw + 16px, Max: 64px */
}

p {
  font-size: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
  /* Min: 16px, Max: 18px */
}
```

#### Responsive Images

```html
<!-- Art direction (different crops) -->
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.jpg">
  <source media="(min-width: 768px)" srcset="hero-tablet.jpg">
  <img src="hero-mobile.jpg" alt="Hero image">
</picture>

<!-- Resolution switching (same crop) -->
<img
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="(min-width: 1024px) 800px, 100vw"
  src="image-800.jpg"
  alt="Responsive image"
>
```

### Performance Considerations

1. **Lazy Loading**: Load images as needed
   ```html
   <img src="image.jpg" loading="lazy" alt="...">
   ```

2. **Reduce Motion**: Respect user preferences
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

3. **Connection Speed**: Adapt to network conditions
   ```javascript
   // Detect slow connections
   if (navigator.connection?.effectiveType === '2g') {
     // Load lighter version
   }
   ```

---

## Accessibility Standards (WCAG 2.2)

### The Four Principles (POUR)

1. **Perceivable**: Users can perceive the information
2. **Operable**: Users can operate the interface
3. **Understandable**: Users can understand the content
4. **Robust**: Content works across technologies

### WCAG 2.2 Conformance Levels

- **Level A**: Minimum (must satisfy)
- **Level AA**: Target standard (recommended)
- **Level AAA**: Enhanced (ideal but often impractical)

**Industry Standard**: WCAG 2.2 Level AA compliance

### Key Success Criteria (New in WCAG 2.2)

#### 1. Focus Appearance (Enhanced) - Level AAA
Visible focus indicators with minimum size and contrast:

```css
/* ✅ Enhanced focus indicator */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Don't remove focus styles */
/* ❌ NEVER DO THIS */
*:focus {
  outline: none; /* Accessibility violation */
}
```

#### 2. Target Size (Minimum) - Level AA
**New**: Minimum 24x24 CSS pixels for all targets

```css
/* ✅ WCAG 2.2 compliant */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 8px; /* Makes actual clickable area 40x40 */
}
```

#### 3. Accessible Authentication - Level AA
Don't require cognitive function tests (like remembering passwords):

```html
<!-- ✅ Provide alternatives -->
<form>
  <input type="email" autocomplete="email">
  <input type="password" autocomplete="current-password">

  <!-- Allow password managers -->
  <!-- Provide "Remember me" option -->
  <!-- Offer biometric authentication -->
</form>
```

### Semantic HTML

```html
<!-- ❌ BAD - Divitis -->
<div class="header">
  <div class="nav">
    <div class="link" onclick="navigate()">Home</div>
  </div>
</div>
<div class="main">
  <div class="article">
    <div class="heading">Title</div>
    <div class="content">Content</div>
  </div>
</div>

<!-- ✅ GOOD - Semantic structure -->
<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
  </nav>
</header>
<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>
```

### ARIA Best Practices

**First Rule of ARIA**: Don't use ARIA if native HTML works

```html
<!-- ❌ BAD - Unnecessary ARIA -->
<div role="button" tabindex="0" aria-label="Submit">Submit</div>

<!-- ✅ GOOD - Native HTML -->
<button type="submit">Submit</button>

<!-- ✅ GOOD - ARIA when needed -->
<button aria-label="Close dialog" aria-pressed="false">
  <X aria-hidden="true" />
</button>
```

### Keyboard Navigation

#### Tab Order

```html
<!-- Natural tab order follows DOM order -->
<form>
  <input tabindex="0"> <!-- First -->
  <input tabindex="0"> <!-- Second -->
  <button tabindex="0">Submit</button> <!-- Third -->
</form>

<!-- ❌ AVOID - Disrupts natural flow -->
<div tabindex="3">Third</div>
<div tabindex="1">First</div>
<div tabindex="2">Second</div>
```

#### Focus Management

```tsx
// Trap focus in modals
const Modal = () => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    firstElement?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [])

  return <div ref={modalRef}>...</div>
}
```

### Form Accessibility

```html
<!-- ✅ Proper form structure -->
<form>
  <!-- Label association -->
  <div class="field">
    <label for="email">Email Address</label>
    <input
      type="email"
      id="email"
      name="email"
      autocomplete="email"
      required
      aria-describedby="email-hint email-error"
    >
    <p id="email-hint" class="hint">We'll never share your email</p>
    <p id="email-error" class="error" aria-live="polite"></p>
  </div>

  <!-- Fieldset for grouped inputs -->
  <fieldset>
    <legend>Contact Preferences</legend>
    <label>
      <input type="checkbox" name="newsletter">
      Email newsletter
    </label>
    <label>
      <input type="checkbox" name="updates">
      Product updates
    </label>
  </fieldset>

  <!-- Clear error messages -->
  <div role="alert" aria-live="assertive" class="form-errors">
    <!-- Errors injected here -->
  </div>

  <button type="submit">Submit</button>
</form>
```

### Screen Reader Considerations

#### Visually Hidden Content

```css
/* Accessible only to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Reveal on focus (skip links) */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

#### Live Regions

```html
<!-- Announce dynamic content -->
<div aria-live="polite" aria-atomic="true">
  <p>2 new messages</p>
</div>

<!-- Critical announcements -->
<div role="alert" aria-live="assertive">
  <p>Form submission failed</p>
</div>

<!-- Status updates -->
<div role="status" aria-live="polite">
  <p>Loading...</p>
</div>
```

### Testing Checklist

- [ ] **Keyboard Navigation**: Can you complete all tasks using only keyboard?
- [ ] **Screen Reader**: Test with NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- [ ] **Color Contrast**: All text meets minimum 4.5:1 ratio (AA)
- [ ] **Focus Indicators**: Visible focus states on all interactive elements
- [ ] **Form Labels**: All inputs have associated labels
- [ ] **Alt Text**: All meaningful images have descriptive alt text
- [ ] **Heading Structure**: Logical heading hierarchy (h1 → h2 → h3)
- [ ] **ARIA**: Proper ARIA labels and roles where needed
- [ ] **Skip Links**: "Skip to main content" link at page top
- [ ] **Error Messages**: Clear, specific, and associated with inputs
- [ ] **Zoom**: Page works at 200% zoom
- [ ] **Motion**: Respects `prefers-reduced-motion`

---

## Component Composition Patterns

### Compound Components

Pattern for sharing state between related components:

```tsx
// Parent manages state
const Tabs = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

// Children access shared state
const TabList = ({ children }: { children: React.ReactNode }) => {
  return <div role="tablist">{children}</div>
}

const Tab = ({ index, children }: { index: number; children: React.ReactNode }) => {
  const { activeTab, setActiveTab } = useTabsContext()

  return (
    <button
      role="tab"
      aria-selected={activeTab === index}
      onClick={() => setActiveTab(index)}
    >
      {children}
    </button>
  )
}

// Usage
<Tabs>
  <TabList>
    <Tab index={0}>Profile</Tab>
    <Tab index={1}>Settings</Tab>
  </TabList>
  <TabPanel index={0}>Profile content</TabPanel>
  <TabPanel index={1}>Settings content</TabPanel>
</Tabs>
```

### Composition Over Configuration

```tsx
// ❌ Configuration-heavy (inflexible)
<DataTable
  columns={columns}
  data={data}
  showPagination={true}
  showSearch={true}
  customHeader={<CustomHeader />}
  customFooter={<CustomFooter />}
  // ... 20 more props
/>

// ✅ Composition (flexible)
<Table>
  <TableHeader>
    <TableRow>
      {columns.map(col => <TableHead key={col.id}>{col.name}</TableHead>)}
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(row => (
      <TableRow key={row.id}>
        {columns.map(col => <TableCell key={col.id}>{row[col.id]}</TableCell>)}
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TablePagination />
  </TableFooter>
</Table>
```

### Slot Pattern

Flexible content injection:

```tsx
interface CardProps {
  header?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}

const Card = ({ header, footer, children }: CardProps) => {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

// Usage
<Card
  header={<CardTitle>User Profile</CardTitle>}
  footer={<Button>Edit</Button>}
>
  <CardContent>User details here</CardContent>
</Card>
```

### Render Props Pattern

Share logic between components:

```tsx
interface MouseTrackerProps {
  render: (mouse: { x: number; y: number }) => React.ReactNode
}

const MouseTracker = ({ render }: MouseTrackerProps) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY })
  }

  return (
    <div onMouseMove={handleMouseMove}>
      {render(mouse)}
    </div>
  )
}

// Usage
<MouseTracker
  render={({ x, y }) => (
    <p>Mouse position: {x}, {y}</p>
  )}
/>
```

### Component Reusability Checklist

- [ ] **Single Responsibility**: Component does one thing well
- [ ] **Configurable**: Accept props for customization
- [ ] **Composable**: Works well with other components
- [ ] **Accessible**: Built-in ARIA and keyboard support
- [ ] **Documented**: Clear API and usage examples
- [ ] **Tested**: Unit and integration tests
- [ ] **Styled Variants**: Support different visual styles
- [ ] **Responsive**: Works across screen sizes
- [ ] **Performant**: Memoized where appropriate

---

## Micro-interactions & Animation

### Purpose of Micro-interactions

1. **Feedback**: Confirm user actions
2. **Guidance**: Direct attention
3. **Status**: Communicate system state
4. **Delight**: Create engaging experiences

### Animation Principles (2025)

#### 1. Purposeful, Not Decorative

Every animation should serve a function:
- Button press feedback
- Loading indication
- State transition explanation
- Attention direction

#### 2. Subtle and Quick

```css
/* ✅ GOOD - Quick, subtle */
.button {
  transition: background-color 150ms ease-in-out;
}

.button:hover {
  background-color: var(--primary-hover);
}

/* ❌ TOO SLOW - Feels sluggish */
.button-slow {
  transition: all 1s ease-in-out;
}
```

**Recommended Durations:**
- **Micro-interactions**: 100-200ms
- **Small movements**: 200-300ms
- **Medium transitions**: 300-500ms
- **Large/complex**: 500-800ms
- **Never exceed**: 1000ms

#### 3. Natural Easing

```css
:root {
  /* Standard easing functions */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Custom easing (bouncy) */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Spring physics (modern) */
  --ease-spring: linear(
    0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%,
    0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%,
    1.001
  );
}
```

**When to use:**
- **Ease-out**: Entrances (elements appearing)
- **Ease-in**: Exits (elements disappearing)
- **Ease-in-out**: State changes (position, size)

#### 4. Respect User Preferences

```css
/* Default: Smooth animations */
.card {
  transition: transform 300ms var(--ease-out);
}

/* Reduced motion: Instant or minimal */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }

  /* Or very short duration */
  .card {
    transition-duration: 1ms;
  }
}
```

### Common Micro-interaction Patterns

#### Button States

```css
.button {
  /* Base state */
  background: var(--primary);
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 150ms ease-out;
}

/* Hover */
.button:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* Active (pressed) */
.button:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

/* Focus */
.button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Loading */
.button[aria-busy="true"] {
  cursor: wait;
  opacity: 0.7;
}

.button[aria-busy="true"]::after {
  content: '';
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Input Focus

```css
.input {
  border: 1px solid var(--border);
  transition:
    border-color 200ms ease-out,
    box-shadow 200ms ease-out;
}

.input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px rgba(var(--ring-rgb), 0.1);
  outline: none;
}

/* Error state */
.input[aria-invalid="true"] {
  border-color: var(--destructive);
}

.input[aria-invalid="true"]:focus {
  box-shadow: 0 0 0 3px rgba(var(--destructive-rgb), 0.1);
}
```

#### Toast Notifications

```css
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast {
  animation: slide-in 300ms var(--ease-out);
}

.toast[data-state="closed"] {
  animation: slide-out 200ms var(--ease-in);
}
```

#### Skeleton Loading

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 0%,
    var(--muted-foreground) 20%,
    var(--muted) 40%,
    var(--muted) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s linear infinite;
}
```

#### Progress Indicators

```css
/* Determinate progress */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--muted);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 300ms ease-out;
}

/* Indeterminate progress */
@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

.progress-indeterminate {
  width: 25%;
  animation: indeterminate 1.5s ease-in-out infinite;
}
```

### Animation Best Practices

1. **Consistency**: Use same durations/easings for similar actions
2. **Layering**: Stagger animations for multiple elements
3. **Performance**: Animate `transform` and `opacity` only (GPU-accelerated)
4. **Accessibility**: Provide alternatives for animations
5. **Testing**: Test on low-end devices

```css
/* ✅ PERFORMANT - GPU accelerated */
.element {
  transform: translateX(100px);
  opacity: 0.5;
  will-change: transform, opacity;
}

/* ❌ JANKY - Triggers layout recalculation */
.element-janky {
  left: 100px; /* Use transform instead */
  width: 200px; /* Avoid animating */
}
```

---

## Page-Type Specific Guidelines

### Landing Pages

**Goal**: Convert visitors into users/customers

**Design Principles:**
- **Hero Section**: Clear value proposition, prominent CTA
- **Visual Hierarchy**: Z-pattern or F-pattern
- **Social Proof**: Testimonials, logos, statistics
- **Clear CTAs**: 1-2 primary actions maximum
- **Minimal Navigation**: Remove distractions

```html
<main class="landing">
  <!-- Hero -->
  <section class="hero">
    <h1>Clear Value Proposition</h1>
    <p>Supporting description</p>
    <Button size="lg">Primary CTA</Button>
  </section>

  <!-- Social Proof -->
  <section class="social-proof">
    <p>Trusted by 10,000+ companies</p>
    <LogoCloud />
  </section>

  <!-- Features -->
  <section class="features">
    <FeatureCard icon={...} title={...} description={...} />
  </section>

  <!-- Testimonials -->
  <section class="testimonials">
    <TestimonialCarousel />
  </section>

  <!-- Final CTA -->
  <section class="cta">
    <h2>Ready to get started?</h2>
    <Button size="lg">Sign Up Free</Button>
  </section>
</main>
```

### Dashboard/Admin Pages

**Goal**: Display complex data clearly, enable quick actions

**Design Principles:**
- **Data Density**: Balance information vs. whitespace
- **Scannable**: Use cards, clear headings, icons
- **Quick Actions**: Place common actions prominently
- **Responsive Tables**: Stack or horizontal scroll on mobile
- **Consistent Layout**: Header, sidebar, main content

```html
<div class="dashboard-layout">
  <Header />
  <Sidebar />
  <main>
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <StatCard value="$45,231" label="Revenue" trend="+20%" />
      <StatCard value="1,234" label="Users" trend="+5%" />
    </div>

    <!-- Charts -->
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart data={...} />
      </CardContent>
    </Card>

    <!-- Data Table -->
    <Card>
      <DataTable columns={...} data={...} />
    </Card>
  </main>
</div>
```

### Form Pages

**Goal**: Collect information with minimum friction

**Design Principles:**
- **Progressive Disclosure**: Multi-step for long forms
- **Inline Validation**: Real-time feedback
- **Clear Labels**: Above or beside inputs, never placeholder-only
- **Error Recovery**: Specific, actionable error messages
- **Save Progress**: For long forms

```html
<form class="form-layout">
  <fieldset>
    <legend>Personal Information</legend>

    <Field>
      <Label htmlFor="name">Full Name *</Label>
      <Input
        id="name"
        required
        aria-describedby="name-error"
      />
      <FieldHint>As it appears on your ID</FieldHint>
      <FieldError id="name-error" />
    </Field>

    <Field>
      <Label htmlFor="email">Email Address *</Label>
      <Input
        type="email"
        id="email"
        autocomplete="email"
        required
      />
    </Field>
  </fieldset>

  <ButtonGroup>
    <Button type="button" variant="outline">Save Draft</Button>
    <Button type="submit">Continue</Button>
  </ButtonGroup>
</form>
```

### E-commerce Product Pages

**Goal**: Showcase product, drive purchase

**Design Principles:**
- **Large Images**: Primary focus, zoom capability
- **Clear Pricing**: Prominent, include all costs
- **Trust Signals**: Reviews, security badges, return policy
- **Sticky CTA**: "Add to Cart" always visible
- **Mobile Optimization**: Thumb-friendly buttons

```html
<article class="product-page">
  <div class="product-grid">
    <!-- Images -->
    <div class="product-images">
      <ProductGallery images={...} />
    </div>

    <!-- Product Info -->
    <div class="product-info">
      <Breadcrumb />
      <h1>Product Name</h1>
      <StarRating value={4.5} count={234} />
      <Price amount={99.99} compare={149.99} />

      <ProductVariants />

      <div class="actions">
        <Button size="lg" class="w-full">Add to Cart</Button>
        <Button variant="outline">Add to Wishlist</Button>
      </div>

      <ProductFeatures />
      <ShippingInfo />
    </div>
  </div>

  <!-- Reviews -->
  <section class="reviews">
    <ReviewList />
  </section>
</article>
```

### Content/Blog Pages

**Goal**: Deliver readable, engaging long-form content

**Design Principles:**
- **Optimal Line Length**: 65 characters
- **Generous Line Height**: 1.5-1.6 for body text
- **Clear Headings**: Establish document outline
- **Scannable**: Short paragraphs, bullet points, subheadings
- **Media Integration**: Images, videos, embeds

```css
.prose {
  /* Typography */
  font-size: 18px;
  line-height: 1.6;
  max-width: 65ch;
  margin-inline: auto;

  /* Spacing */
  & > * + * {
    margin-top: 1.5em;
  }

  /* Headings */
  & h2 {
    font-size: 2em;
    margin-top: 2em;
    margin-bottom: 0.5em;
  }

  /* Links */
  & a {
    color: var(--primary);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }

  /* Lists */
  & ul, & ol {
    padding-left: 1.5em;
  }

  /* Images */
  & img {
    border-radius: var(--radius-lg);
    margin-block: 2em;
  }
}
```

---

## Testing & Quality Assurance

### Visual Testing

1. **Cross-browser**: Test in Chrome, Firefox, Safari, Edge
2. **Responsive**: Test all breakpoints (mobile, tablet, desktop)
3. **Dark Mode**: Verify both themes
4. **Visual Regression**: Screenshot comparisons (Percy, Chromatic)

### Accessibility Testing

#### Automated Tools
- **axe DevTools**: Browser extension for WCAG violations
- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: Web accessibility evaluation tool
- **Pa11y**: Command-line testing

#### Manual Testing
- **Keyboard Navigation**: Tab through entire page
- **Screen Reader**: NVDA (Windows), VoiceOver (Mac/iOS), TalkBack (Android)
- **Zoom**: Test at 200% zoom level
- **Color Blindness**: Use simulators (Colorblind Web Page Filter)

### Performance Testing

```javascript
// Core Web Vitals (2025)
// Largest Contentful Paint (LCP): < 2.5s
// First Input Delay (FID): < 100ms
// Cumulative Layout Shift (CLS): < 0.1
// Interaction to Next Paint (INP): < 200ms

// Tools:
// - Lighthouse
// - PageSpeed Insights
// - WebPageTest
// - Chrome DevTools Performance tab
```

### Checklist Before Launch

#### Design Consistency
- [ ] Color tokens used throughout
- [ ] Typography scale consistent
- [ ] Spacing system followed
- [ ] Icons from single icon set
- [ ] Border radius consistent

#### Accessibility
- [ ] All images have alt text
- [ ] Color contrast passes WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels correct
- [ ] Form labels associated
- [ ] Heading hierarchy logical

#### Responsive Design
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1440px)
- [ ] Works on large screens (1920px+)
- [ ] Touch targets 48x48px minimum
- [ ] No horizontal scrolling

#### Performance
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Fonts subset/optimized
- [ ] Critical CSS inlined
- [ ] JavaScript code-split

#### Content
- [ ] All text proofread
- [ ] No placeholder content
- [ ] All links work
- [ ] All forms tested
- [ ] Error states designed

---

## Quick Reference Checklist

### Color
- [ ] Use OKLCH for modern color space
- [ ] 4.5:1 contrast for normal text
- [ ] 3:1 contrast for large text & UI
- [ ] Define light and dark themes
- [ ] Never use color alone for information

### Typography
- [ ] Use modular scale (1.25 or 1.333)
- [ ] Line height 1.5 for body text
- [ ] Max line length 65 characters
- [ ] Font size minimum 16px on mobile
- [ ] Clear heading hierarchy (h1 → h6)

### Spacing
- [ ] Use 8px grid system
- [ ] Consistent spacing tokens
- [ ] Generous white space
- [ ] Related items grouped closer
- [ ] Sections clearly separated

### Responsive
- [ ] Mobile-first approach
- [ ] Breakpoints: 640px, 768px, 1024px, 1280px
- [ ] Touch targets 48x48px minimum
- [ ] 8px space between interactive elements
- [ ] Test on real devices

### Accessibility
- [ ] Semantic HTML
- [ ] Keyboard navigable
- [ ] Screen reader tested
- [ ] Focus indicators visible
- [ ] ARIA used appropriately
- [ ] Forms properly labeled
- [ ] Respects prefers-reduced-motion

### Components
- [ ] Reusable and composable
- [ ] Single responsibility
- [ ] Accessible by default
- [ ] Responsive behavior
- [ ] Error states designed
- [ ] Loading states designed

### Animation
- [ ] Duration 100-500ms
- [ ] Use ease-out for entrances
- [ ] Use ease-in for exits
- [ ] Only animate transform/opacity
- [ ] Respect reduced motion preference
- [ ] Purposeful, not decorative

### Performance
- [ ] Lazy load images
- [ ] Optimize fonts
- [ ] Code splitting
- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] CLS < 0.1

---

## Conclusion

Mastering web design requires balancing aesthetics, usability, accessibility, and performance. This guide provides the foundation for creating exceptional user experiences that work for everyone, on every device.

**Key Takeaways:**
1. **Start with structure** (Atomic Design, semantic HTML)
2. **Build a system** (Design tokens, consistent spacing)
3. **Design for everyone** (WCAG 2.2, responsive, inclusive)
4. **Test thoroughly** (Automated + manual testing)
5. **Iterate continuously** (User feedback, analytics)

Remember: **Great design is invisible**. When users can accomplish their goals effortlessly, you've succeeded.

---

**Additional Resources:**

- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **shadcn/ui Documentation**: https://ui.shadcn.com
- **Atomic Design**: https://atomicdesign.bradfrost.com
- **MDN Web Docs**: https://developer.mozilla.org
- **Web.dev**: https://web.dev
- **Smashing Magazine**: https://www.smashingmagazine.com
- **A List Apart**: https://alistapart.com

**Design Systems to Study:**
- Material Design (Google)
- Carbon Design System (IBM)
- Polaris (Shopify)
- Ant Design
- shadcn/ui
- Radix UI Primitives

---

*Document Version: 1.0*
*Last Updated: 2025*
*License: MIT - Free to use and share*
