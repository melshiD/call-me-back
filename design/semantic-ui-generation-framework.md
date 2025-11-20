# Semantic UI Generation Framework
**Translating Concepts, Emotions, and Intent into Concrete Interface Designs**

*A Framework-Agnostic Guide for AI-Assisted Design*

Version: 1.0
Last Updated: 2025-11-19

---

## Executive Summary

This framework bridges the gap between **abstract meaning** (concepts, emotional intent, user needs) and **concrete visual decisions** (layout, spacing, color, typography). It combines research from semantic layout generation, affective computing, and cognitive UX theory with practical design implementation.

**Target Audience**: AI assistants, LLMs, and designers working on computational design systems.

**Core Premise**: Every design decision should be traceable to either:
1. **Semantic intent** (what the user needs to understand/do)
2. **Emotional tone** (how the user should feel)
3. **Cognitive constraints** (how humans perceive and process information)

---

## Table of Contents

1. [The Concept-to-Layout Pipeline](#the-concept-to-layout-pipeline)
2. [Semantic Analysis Framework](#semantic-analysis-framework)
3. [Affective Design Mapping](#affective-design-mapping)
4. [Layout Synthesis Rules](#layout-synthesis-rules)
5. [Component Selection Logic](#component-selection-logic)
6. [Visual Style Conditioning](#visual-style-conditioning)
7. [Implementation Patterns](#implementation-patterns)
8. [Validation Checklist](#validation-checklist)

---

## The Concept-to-Layout Pipeline

### Overview

Every UI generation task follows this pipeline:

```
User Request
    ↓
[1. Extract Semantic Intent]
    ↓
[2. Identify Emotional Tone]
    ↓
[3. Map to Cognitive Patterns]
    ↓
[4. Generate Constraint Graph]
    ↓
[5. Synthesize Layout Structure]
    ↓
[6. Apply Style Conditioning]
    ↓
[7. Generate Component Code]
    ↓
Rendered UI
```

### Stage Breakdown

#### Stage 1: Extract Semantic Intent

**Goal**: Identify *what* the interface needs to communicate or enable.

**Questions to ask**:
- What is the primary user goal? (e.g., "find information", "complete transaction", "understand status")
- What is the information hierarchy? (most important → least important)
- What actions must be available?
- What relationships exist between elements?

**Output**: Semantic graph of concepts and relationships

**Example**:
```
User Request: "Create a dashboard for monitoring server health"

Semantic Intent:
- Primary goal: Quick status assessment
- Secondary goal: Investigate issues
- Information hierarchy:
  1. Overall health status (critical)
  2. Individual server metrics (important)
  3. Historical trends (supporting)
  4. Detailed logs (on-demand)
- Required actions: View details, refresh, configure alerts
```

---

#### Stage 2: Identify Emotional Tone

**Goal**: Determine *how* the user should feel when using the interface.

**Emotion Classification** (based on Russell's Circumplex Model):
- **Valence** (positive ↔ negative)
- **Arousal** (calm ↔ energetic)

**Common UI Emotional Tones**:

| Tone | Valence | Arousal | Use Cases |
|------|---------|---------|-----------|
| **Confident** | Positive | Medium | Dashboards, analytics, financial apps |
| **Calm** | Positive | Low | Meditation apps, reading interfaces, documentation |
| **Urgent** | Negative | High | Error states, critical alerts, emergency interfaces |
| **Friendly** | Positive | Medium | Consumer apps, social platforms, onboarding |
| **Professional** | Neutral | Low | Enterprise tools, B2B SaaS, admin panels |
| **Playful** | Positive | High | Gaming, creative tools, children's apps |
| **Serious** | Neutral/Negative | Low | Legal, medical, government interfaces |

**Output**: Emotional vector with specific tone attributes

**Example**:
```
Dashboard Request → Emotional Tone:
- Primary: Confident (user feels in control)
- Secondary: Calm (not overwhelming despite data density)
- Valence: Positive (+0.6)
- Arousal: Low-Medium (+0.3)
```

---

#### Stage 3: Map to Cognitive Patterns

**Goal**: Apply human perception and cognitive load theory to guide design.

**Key Cognitive Principles**:

1. **Gestalt Principles**
   - Proximity: Related items close together
   - Similarity: Similar items look alike
   - Continuity: Aligned elements suggest relationship
   - Closure: Mind fills in gaps
   - Figure-ground: Clear foreground/background distinction

2. **Visual Hierarchy** (Pre-attentive Processing)
   - Size: Larger = more important
   - Color: High contrast = attention
   - Position: Top-left → bottom-right (F-pattern, Z-pattern)
   - Movement: Animation draws eye

3. **Cognitive Load**
   - **Intrinsic**: Complexity inherent to task
   - **Extraneous**: Unnecessary visual noise
   - **Germane**: Helpful structure and patterns

**Mapping Rules**:

```
IF emotional_tone == "urgent":
    → High contrast colors (red/orange)
    → Large, prominent CTAs
    → Minimal extraneous elements
    → Clear figure-ground separation

IF emotional_tone == "calm":
    → Low saturation colors (blues, grays)
    → Generous whitespace
    → Subtle shadows/borders
    → Relaxed spacing (1.5x+ line height)

IF information_density == "high":
    → Strong grid structure
    → Clear section boundaries
    → Consistent component sizing
    → Scannable typography hierarchy

IF user_expertise == "novice":
    → Progressive disclosure
    → Inline help/hints
    → Clear labels (no icons alone)
    → Forgiving error handling
```

---

#### Stage 4: Generate Constraint Graph

**Goal**: Create a structured representation of layout requirements and relationships.

**Graph Components**:

1. **Nodes** (UI Components)
   - Type (e.g., header, card, button, chart)
   - Priority (critical, important, supporting, optional)
   - Content type (text, image, data, action)

2. **Edges** (Relationships)
   - Spatial (above, beside, within)
   - Semantic (supports, contradicts, elaborates)
   - Temporal (before, after, concurrent)

3. **Constraints**
   - Size (min/max dimensions)
   - Position (fixed, relative, sticky)
   - Visibility (always, conditional, hidden)
   - Accessibility (required ARIA, keyboard nav)

**Example Constraint Graph**:
```json
{
  "nodes": [
    {
      "id": "overall-status",
      "type": "status-card",
      "priority": "critical",
      "constraints": {
        "position": "top-center",
        "visibility": "always",
        "size": "prominent"
      }
    },
    {
      "id": "server-grid",
      "type": "card-grid",
      "priority": "important",
      "constraints": {
        "position": "below:overall-status",
        "layout": "responsive-grid",
        "minColumns": 2,
        "maxColumns": 4
      }
    },
    {
      "id": "detailed-logs",
      "type": "data-table",
      "priority": "supporting",
      "constraints": {
        "position": "bottom",
        "visibility": "on-demand",
        "disclosure": "progressive"
      }
    }
  ],
  "edges": [
    {
      "from": "overall-status",
      "to": "server-grid",
      "relationship": "summarizes",
      "spatial": "above"
    }
  ]
}
```

---

#### Stage 5: Synthesize Layout Structure

**Goal**: Transform constraint graph into spatial arrangement.

**Layout Synthesis Algorithm**:

```
1. Identify critical path (highest priority nodes)
2. Apply emotional tone to spacing/density
3. Choose grid system based on content type
4. Position nodes following cognitive patterns
5. Apply responsive breakpoint logic
6. Validate accessibility requirements
```

**Layout Patterns by Page Type**:

##### Landing Page (Conversion Focus)
```
Structure:
- Hero (full viewport height)
- Social proof (logos, testimonials)
- Feature grid (3 columns)
- Final CTA

Emotional mapping:
- "Exciting" → Bold typography, high contrast CTAs, dynamic spacing
- "Professional" → Clean grid, subtle colors, clear hierarchy
- "Friendly" → Rounded corners, warm colors, conversational copy
```

##### Dashboard (Information Focus)
```
Structure:
- KPI cards (top row, equal width)
- Primary chart/visualization (large, centered)
- Supporting data tables (below)
- Filters/controls (sidebar or top bar)

Emotional mapping:
- "Confident" → Strong grid, clear data visualization, prominent metrics
- "Calm" → Low density, generous whitespace, muted colors
- "Urgent" → High contrast alerts, real-time updates, prominent warnings
```

##### Form (Data Collection Focus)
```
Structure:
- Progress indicator (if multi-step)
- Field groups (logical sections)
- Inline validation (real-time feedback)
- Primary action (bottom-right or full-width)

Emotional mapping:
- "Friendly" → Conversational labels, inline help, forgiving validation
- "Professional" → Formal labels, structured layout, clear requirements
- "Urgent" → Minimal fields, prominent submit, timer/countdown
```

---

#### Stage 6: Apply Style Conditioning

**Goal**: Map emotional tone to specific visual attributes.

**Affective Style Mapping**:

##### Color Palette Generation

```
Function: generate_color_palette(emotion, brand_color)

IF emotion.valence > 0 AND emotion.arousal > 0.5:
    # Energetic, positive (playful, exciting)
    palette = {
        primary: brand_color (high saturation),
        secondary: complementary_color (vibrant),
        accent: triadic_color (bold),
        background: light_neutral,
        text: dark_neutral
    }

ELSE IF emotion.valence > 0 AND emotion.arousal < 0.5:
    # Calm, positive (serene, confident)
    palette = {
        primary: brand_color (medium saturation),
        secondary: analogous_color (subtle),
        accent: brand_color (darker shade),
        background: off_white,
        text: near_black
    }

ELSE IF emotion.valence < 0 AND emotion.arousal > 0.5:
    # Urgent, negative (alert, error)
    palette = {
        primary: red/orange (high saturation),
        secondary: yellow (warning),
        accent: red (critical),
        background: white,
        text: black (maximum contrast)
    }

ELSE IF emotion.valence < 0 AND emotion.arousal < 0.5:
    # Serious, subdued (formal, authoritative)
    palette = {
        primary: brand_color (low saturation),
        secondary: gray_scale,
        accent: brand_color (muted),
        background: cool_gray,
        text: dark_gray
    }
```

##### Typography Selection

```
Function: select_typography(emotion, content_density)

IF emotion.tone == "friendly":
    typeface = rounded_sans_serif  # Inter, DM Sans
    scale = 1.333  # Perfect Fourth (more variation)
    line_height = 1.6  # Relaxed
    letter_spacing = 0.01em  # Slightly open

ELSE IF emotion.tone == "professional":
    typeface = geometric_sans_serif  # Helvetica, Roboto
    scale = 1.25  # Major Third (moderate variation)
    line_height = 1.5  # Standard
    letter_spacing = 0  # Normal

ELSE IF emotion.tone == "serious":
    typeface = serif  # Georgia, Merriweather
    scale = 1.2  # Minor Third (subtle variation)
    line_height = 1.5  # Standard
    letter_spacing = -0.01em  # Slightly tight

ELSE IF emotion.tone == "playful":
    typeface = display_font  # Poppins, Fredoka
    scale = 1.414  # Augmented Fourth (dramatic variation)
    line_height = 1.4  # Tight
    letter_spacing = 0.02em  # Open

IF content_density == "high":
    line_height *= 1.1  # Add breathing room
    scale = min(scale, 1.25)  # Limit variation
```

##### Spacing System

```
Function: generate_spacing(emotion, layout_density)

base_unit = 4px  # Always 4px for precision

IF emotion.arousal < 0.3:  # Calm
    spacing_multipliers = [0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24]
    # Generous spacing, clear separation

ELSE IF emotion.arousal > 0.7:  # Energetic
    spacing_multipliers = [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16]
    # Tighter spacing, more dynamic

ELSE:  # Neutral
    spacing_multipliers = [0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]
    # Standard 8pt grid

spacing_tokens = {
    f"spacing-{i}": f"{mult * base_unit}px"
    for i, mult in enumerate(spacing_multipliers)
}
```

##### Border Radius & Shadows

```
Function: generate_shape_style(emotion)

IF emotion.tone == "friendly" OR emotion.tone == "playful":
    border_radius = {
        sm: 0.5rem,  # 8px
        md: 0.75rem,  # 12px
        lg: 1rem,  # 16px
        xl: 1.5rem  # 24px
    }
    shadow_intensity = "soft"

ELSE IF emotion.tone == "professional":
    border_radius = {
        sm: 0.25rem,  # 4px
        md: 0.375rem,  # 6px
        lg: 0.5rem,  # 8px
        xl: 0.75rem  # 12px
    }
    shadow_intensity = "subtle"

ELSE IF emotion.tone == "serious":
    border_radius = {
        sm: 0,  # Square
        md: 0.125rem,  # 2px (minimal)
        lg: 0.25rem,  # 4px
        xl: 0.375rem  # 6px
    }
    shadow_intensity = "minimal"

shadow_presets = {
    soft: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)",
    subtle: "0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    minimal: "0 1px 2px rgba(0,0,0,0.05)"
}
```

---

#### Stage 7: Generate Component Code

**Goal**: Translate layout structure + style conditioning into actual implementation.

**Component Selection Decision Tree**:

```
IF action_required AND priority == "critical":
    component = Button
    variant = primary
    size = large

ELSE IF action_required AND priority == "important":
    component = Button
    variant = secondary
    size = medium

ELSE IF action_required AND priority == "supporting":
    component = Link or Button
    variant = ghost
    size = small

IF displaying_data AND structure == "tabular":
    component = DataTable
    features = [sorting, filtering, pagination]

ELSE IF displaying_data AND structure == "list":
    component = List or CardGrid

IF user_input AND data_type == "text":
    component = Input
    validation = inline
    accessibility = [label, hint, error_message]

ELSE IF user_input AND data_type == "selection":
    IF options < 5:
        component = RadioGroup
    ELSE IF options < 10:
        component = Select
    ELSE:
        component = Combobox (searchable)
```

---

## Semantic Analysis Framework

### Content Type Classification

Every piece of content should be classified to inform design decisions:

```
Content Types:

1. CRITICAL_ACTION
   - Must be completed to achieve primary goal
   - Examples: Submit button, payment confirmation, save changes
   - Design: High contrast, large size, prominent position

2. CRITICAL_INFORMATION
   - Essential to user understanding
   - Examples: Error messages, account balance, order status
   - Design: High visual weight, clear hierarchy, redundant signaling

3. SUPPORTING_ACTION
   - Enhances experience but not required
   - Examples: Share button, export, advanced filters
   - Design: Visible but not prominent, secondary styling

4. SUPPORTING_INFORMATION
   - Provides context or additional detail
   - Examples: Tooltips, help text, metadata
   - Design: Lower contrast, smaller size, progressive disclosure

5. NAVIGATIONAL
   - Enables movement between views/sections
   - Examples: Menu, breadcrumbs, pagination
   - Design: Consistent placement, clear affordances, accessible

6. DECORATIVE
   - Enhances visual appeal or brand
   - Examples: Illustrations, patterns, brand elements
   - Design: aria-hidden, complementary to content, responsive
```

### Information Architecture Extraction

When analyzing a request, extract the IA structure:

```
Function: extract_information_architecture(user_request)

1. Identify primary entities
   Example: "User dashboard" → entities = [User, Activities, Stats, Settings]

2. Map entity relationships
   - Has-a: User has Activities
   - Part-of: Stats part-of User
   - Relates-to: Activities relates-to Stats

3. Determine hierarchy
   - Level 1 (Global): Navigation, User profile
   - Level 2 (Section): Dashboard overview
   - Level 3 (Component): Individual stat cards
   - Level 4 (Detail): Drill-down views

4. Generate URL/route structure
   /dashboard (overview)
   /dashboard/activity (detail)
   /dashboard/settings (action)

5. Map to navigation pattern
   IF sections <= 5:
       navigation = horizontal_tabs
   ELSE IF sections <= 10:
       navigation = sidebar_menu
   ELSE:
       navigation = hierarchical_menu + search
```

---

## Affective Design Mapping

### Emotion-to-Design Decision Matrix

| Emotion | Colors | Spacing | Typography | Shadows | Borders | Motion |
|---------|--------|---------|------------|---------|---------|--------|
| **Calm** | Low saturation blues/grays | Generous (1.5x+) | Serif, relaxed line-height | Soft, subtle | Rounded (8px+) | Slow (400ms+), ease-out |
| **Confident** | Medium saturation brand colors | Balanced (1x) | Sans-serif, clear hierarchy | Medium | Subtle radius (4-6px) | Quick (200ms), smooth |
| **Urgent** | High contrast reds/oranges | Tight, focused | Bold sans-serif, large | Strong, sharp | Sharp corners (0-2px) | Fast (100ms), snappy |
| **Friendly** | Warm colors, pastels | Comfortable (1.2x) | Rounded sans-serif | Soft | Rounded (12px+) | Bouncy, playful |
| **Professional** | Cool grays, muted brand | Structured (1x grid) | Geometric sans-serif | Minimal | Precise (4px) | Linear, efficient |
| **Playful** | Vibrant, high saturation | Dynamic, irregular | Display fonts | Colorful | Very rounded (16px+) | Spring physics |
| **Serious** | Monochrome, deep tones | Minimal, tight | Serif, formal | Flat/none | Sharp (0-2px) | None or instant |

### Emotional Tone Extraction from Text

```
Function: analyze_emotional_tone(user_request_text)

Keywords and their emotional signals:

CALM: "relaxing", "peaceful", "comfortable", "zen", "minimalist"
URGENT: "alert", "critical", "emergency", "immediate", "now"
FRIENDLY: "welcoming", "warm", "inviting", "approachable", "casual"
PROFESSIONAL: "corporate", "enterprise", "business", "formal", "polished"
CONFIDENT: "powerful", "bold", "strong", "authoritative", "commanding"
PLAYFUL: "fun", "whimsical", "creative", "energetic", "vibrant"
SERIOUS: "formal", "academic", "legal", "medical", "official"

Modifiers:
- "very" → increase intensity by 1.5x
- "slightly" → reduce intensity by 0.5x
- "modern" → add contemporary styling (larger spacing, cleaner)
- "classic" → add traditional styling (serifs, muted colors)

Example:
"Create a very calm, minimalist reading interface"
→ emotion = {tone: "calm", intensity: 1.5, modifiers: ["minimalist"]}
→ spacing: 2x base, colors: low saturation, typography: serif + generous line-height
```

---

## Layout Synthesis Rules

### Grid System Selection

```
Function: select_grid_system(content_type, emotional_tone)

IF content_type == "dashboard":
    grid = {
        type: "dashboard-grid",
        columns: 12,
        rows: "auto",
        gap: based_on_emotion(emotional_tone)
    }

ELSE IF content_type == "landing_page":
    grid = {
        type: "section-based",
        sections: ["hero", "features", "testimonials", "cta"],
        width: "full-bleed",
        max_width: "1440px"
    }

ELSE IF content_type == "form":
    grid = {
        type: "form-grid",
        columns: "single" OR "two-column" based on field_count,
        max_width: "640px",
        centered: true
    }

ELSE IF content_type == "content":
    grid = {
        type: "prose-layout",
        max_width: "65ch",  # Optimal reading width
        centered: true,
        sidebar: optional
    }
```

### Responsive Breakpoint Logic

```
Standard breakpoints:
- mobile: 0-639px (stack vertically, single column)
- tablet: 640-1023px (2 columns, compact navigation)
- desktop: 1024-1439px (3-4 columns, full features)
- large: 1440px+ (max 4-5 columns, centered content)

Adaptation rules:

IF viewport < 640px:
    - Stack all columns
    - Hide secondary navigation in drawer
    - Enlarge touch targets to 48x48px
    - Show mobile-specific components (bottom nav)
    - Reduce font sizes by 0.9x

ELSE IF viewport < 1024px:
    - 2 column grid maximum
    - Collapse sidebar to icon-only or hamburger
    - Hide non-essential secondary content
    - Standard font sizes

ELSE:
    - Full layout
    - All features visible
    - Optimal spacing
```

### Component Placement Heuristics

```
Priority-based placement:

1. CRITICAL elements (F-pattern, Z-pattern focal points):
   - Primary CTA: Top-right or center
   - Critical info: Top-left or center-top
   - Error messages: Top-center or inline with field

2. IMPORTANT elements (secondary focal points):
   - Secondary actions: Near primary but less prominent
   - Key metrics: Top row of dashboard
   - Navigation: Top or left sidebar

3. SUPPORTING elements (periphery):
   - Tertiary actions: Bottom or right sidebar
   - Help text: Below/beside related content
   - Metadata: Bottom of cards/sections

4. OPTIONAL elements (progressive disclosure):
   - Advanced filters: Collapsed by default
   - Detailed logs: Separate tab or modal
   - Settings: Dedicated page or dropdown
```

---

## Component Selection Logic

### Button Decision Tree

```
IF action == "primary_goal":
    variant = "default" (solid, high contrast)
    size = "lg"
    position = "prominent"

ELSE IF action == "secondary_goal":
    variant = "secondary" (outline or subtle fill)
    size = "default"
    position = "visible but not dominant"

ELSE IF action == "tertiary_goal":
    variant = "ghost" (text only, hover state)
    size = "sm"
    position = "inline or grouped"

IF destructive_action:
    color = "destructive" (red)
    confirmation = required

IF loading_state:
    add spinner
    disable interactions
    opacity = 0.7
```

### Input Field Selection

```
IF data_type == "short_text":
    component = Input
    type = "text"

ELSE IF data_type == "long_text":
    component = Textarea
    rows = 4 (minimum)
    auto_expand = true

ELSE IF data_type == "email":
    component = Input
    type = "email"
    autocomplete = "email"
    validation = email_regex

ELSE IF data_type == "password":
    component = Input
    type = "password"
    autocomplete = "current-password" OR "new-password"
    show_password_toggle = true
    strength_meter = optional

ELSE IF data_type == "date":
    IF precise_date_needed:
        component = DatePicker
    ELSE:
        component = Input with type="date"

ELSE IF data_type == "single_choice":
    IF options <= 4:
        component = RadioGroup (all visible)
    ELSE IF options <= 10:
        component = Select (dropdown)
    ELSE:
        component = Combobox (searchable dropdown)

ELSE IF data_type == "multiple_choice":
    IF options <= 5:
        component = CheckboxGroup (all visible)
    ELSE:
        component = MultiSelect
```

### Data Display Selection

```
IF data_structure == "tabular" AND rows > 20:
    component = DataTable
    features = [sorting, filtering, pagination, search]

ELSE IF data_structure == "tabular" AND rows <= 20:
    component = SimpleTable

ELSE IF data_structure == "key_value_pairs":
    component = DescriptionList
    layout = "horizontal" OR "vertical"

ELSE IF data_structure == "metrics":
    component = StatCard OR KPICard
    layout = "grid"
    include = [value, label, trend, sparkline_optional]

ELSE IF data_structure == "timeline":
    component = Timeline OR ActivityFeed

ELSE IF data_structure == "hierarchical":
    component = Tree OR NestedList
    expandable = true
```

---

## Visual Style Conditioning

### Design Token Generation

Every UI should be parameterized with design tokens:

```json
{
  "colors": {
    "primary": "generated from brand + emotion",
    "secondary": "analogous or complementary",
    "accent": "contrast color for emphasis",
    "background": "based on mode (light/dark)",
    "surface": "elevated backgrounds",
    "border": "subtle separation",
    "text": {
      "primary": "highest contrast",
      "secondary": "medium contrast",
      "muted": "low contrast",
      "disabled": "very low contrast"
    },
    "semantic": {
      "success": "green spectrum",
      "warning": "yellow/orange spectrum",
      "error": "red spectrum",
      "info": "blue spectrum"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "selected based on emotion",
      "serif": "fallback or content",
      "mono": "code blocks only"
    },
    "fontSize": {
      "xs": "generated from scale",
      "sm": "...",
      "base": "16px (default)",
      "lg": "...",
      "xl": "...",
      "2xl": "...",
      "3xl": "...",
      "4xl": "..."
    },
    "fontWeight": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeight": {
      "tight": "based on emotion",
      "normal": 1.5,
      "relaxed": "..."
    }
  },
  "spacing": {
    "0": "0",
    "1": "4px",
    "2": "8px",
    "...": "generated from emotion-based multipliers"
  },
  "radius": {
    "sm": "generated from emotion",
    "md": "...",
    "lg": "...",
    "full": "9999px"
  },
  "shadows": {
    "sm": "generated from emotion",
    "md": "...",
    "lg": "..."
  }
}
```

---

## Implementation Patterns

### Framework-Agnostic Component Structure

When generating code for ANY framework, follow this structure:

```
Component Structure:

1. Semantic HTML base
   - Use proper elements (button, input, nav, etc.)
   - Include ARIA attributes
   - Maintain heading hierarchy

2. Style layer
   - Apply design tokens
   - Use utility classes OR styled components
   - Ensure responsive behavior

3. Behavior layer
   - Keyboard navigation
   - Focus management
   - State management
   - Error handling

4. Accessibility layer
   - Screen reader support
   - ARIA labels/descriptions
   - Focus indicators
   - Color contrast validation
```

### Code Generation Template

```typescript
// Pseudo-code for ANY framework

function generateComponent(
  semantic_intent,
  emotional_tone,
  content_data
) {
  // 1. Select component type
  const componentType = selectComponent(semantic_intent)

  // 2. Generate design tokens
  const tokens = generateTokens(emotional_tone)

  // 3. Build structure
  const structure = buildLayout(componentType, content_data)

  // 4. Apply styling
  const styled = applyStyles(structure, tokens)

  // 5. Add behavior
  const interactive = addBehavior(styled, semantic_intent)

  // 6. Ensure accessibility
  const accessible = addA11y(interactive)

  return accessible
}
```

---

## Validation Checklist

Before delivering any design, validate against these criteria:

### Semantic Validation
- [ ] Primary user goal is achievable in 3 clicks or less
- [ ] Information hierarchy is clear (scan test: 5 seconds to understand)
- [ ] All critical actions are prominent and accessible
- [ ] Navigation structure matches mental model

### Emotional Validation
- [ ] Color palette matches intended emotional tone
- [ ] Typography reinforces emotional tone
- [ ] Spacing creates appropriate density/breathing room
- [ ] Interactions feel consistent with emotional intent

### Cognitive Validation
- [ ] Visual hierarchy follows F or Z pattern
- [ ] Gestalt principles applied (proximity, similarity)
- [ ] Cognitive load is minimized (no unnecessary elements)
- [ ] Scanning patterns are clear

### Technical Validation
- [ ] All interactive elements have 48x48px touch targets
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Keyboard navigation works for all interactions
- [ ] Screen reader announces all critical information
- [ ] Responsive across all breakpoints
- [ ] Performance: LCP < 2.5s, INP < 200ms

---

## Practical Examples

### Example 1: E-commerce Product Page

**User Request**: "Design a product page for luxury watches"

#### Step 1: Semantic Intent
- Primary goal: View product details, add to cart
- Information hierarchy:
  1. Product image (hero)
  2. Price & availability
  3. Product specifications
  4. Reviews
  5. Related products

#### Step 2: Emotional Tone
- Tone: "Luxurious" (positive valence, low arousal)
- Sub-tone: "Confident", "Sophisticated"

#### Step 3: Cognitive Mapping
- F-pattern layout (product info left, image right on desktop)
- Large, high-quality images (75% of viewport)
- Minimal text (reduce cognitive load)
- Clear call-to-action ("Add to Cart")

#### Step 4: Constraint Graph
```json
{
  "nodes": [
    {"id": "product-gallery", "priority": "critical", "position": "left-60%"},
    {"id": "product-info", "priority": "critical", "position": "right-40%"},
    {"id": "add-to-cart", "priority": "critical", "position": "sticky-right"},
    {"id": "specifications", "priority": "important", "position": "below"},
    {"id": "reviews", "priority": "supporting", "position": "below"},
    {"id": "related", "priority": "optional", "position": "bottom"}
  ]
}
```

#### Step 5: Layout Synthesis
- Desktop: Two-column (60/40 split)
- Mobile: Single column, image carousel

#### Step 6: Style Conditioning
```json
{
  "colors": {
    "primary": "oklch(0.2 0.01 260)",  // Deep, sophisticated gray
    "accent": "oklch(0.5 0.02 40)",     // Subtle gold
    "background": "oklch(0.98 0 0)",    // Off-white
    "text": "oklch(0.15 0 0)"            // Near black
  },
  "typography": {
    "fontFamily": "Playfair Display (serif)",  // Luxurious
    "scale": 1.2,  // Subtle variation
    "lineHeight": 1.6  // Comfortable reading
  },
  "spacing": [0, 4, 8, 16, 24, 32, 48, 64],  // Generous
  "radius": {
    "sm": "2px",  // Minimal, precise
    "md": "4px"
  },
  "shadows": "subtle"  // Soft, elevated feel
}
```

#### Step 7: Component Code (Framework Agnostic)
```html
<article class="product-page">
  <div class="product-grid">
    <!-- Left: Image Gallery (60%) -->
    <section class="product-gallery" aria-label="Product images">
      <img src="main-image.jpg" alt="Luxury watch front view" />
      <nav class="thumbnail-nav" aria-label="Image thumbnails">
        <!-- Thumbnails -->
      </nav>
    </section>

    <!-- Right: Product Info (40%) -->
    <section class="product-info">
      <h1 class="product-title">Timepiece Name</h1>
      <p class="price" aria-label="Price">$12,500</p>

      <div class="product-variants">
        <label for="size">Case Size</label>
        <select id="size">
          <option>40mm</option>
          <option>42mm</option>
        </select>
      </div>

      <!-- Sticky CTA -->
      <button class="add-to-cart primary-action">
        Add to Cart
      </button>

      <details class="product-details">
        <summary>Specifications</summary>
        <dl>
          <dt>Movement</dt>
          <dd>Automatic</dd>
          <!-- More specs -->
        </dl>
      </details>
    </section>
  </div>

  <!-- Reviews Section -->
  <section class="reviews" aria-label="Customer reviews">
    <!-- Reviews content -->
  </section>
</article>
```

---

### Example 2: Emergency Alert Dashboard

**User Request**: "Create a dashboard for monitoring critical system alerts"

#### Step 1: Semantic Intent
- Primary goal: Identify and respond to critical issues immediately
- Information hierarchy:
  1. Active critical alerts (top priority)
  2. System health overview
  3. Recent activity log
  4. Alert history

#### Step 2: Emotional Tone
- Tone: "Urgent" (negative valence, high arousal)
- Sub-tone: "Serious", "Focused"

#### Step 3: Cognitive Mapping
- Z-pattern (critical alerts top-left → system status top-right)
- High contrast for immediate attention
- Minimal decoration (reduce extraneous cognitive load)

#### Step 4: Style Conditioning
```json
{
  "colors": {
    "critical": "oklch(0.55 0.22 29)",     // Vibrant red
    "warning": "oklch(0.75 0.15 85)",      // Orange
    "ok": "oklch(0.65 0.15 145)",          // Green
    "background": "oklch(0.98 0 0)",       // White
    "text": "oklch(0.1 0 0)"                // High contrast
  },
  "typography": {
    "fontFamily": "Inter (sans-serif)",   // Clear, readable
    "scale": 1.25,
    "weight": "semibold for alerts"
  },
  "spacing": [0, 4, 8, 12, 16, 24],  // Tighter, focused
  "radius": {
    "sm": "0px",  // Sharp corners for urgency
    "md": "2px"
  },
  "shadows": "strong"  // Clear depth
}
```

#### Step 5: Layout
- Critical alerts: Full-width banner at top
- System status: Cards in grid below
- Tight spacing, minimal whitespace
- Prominent action buttons

---

## Advanced Topics

### Multi-Modal Design Systems

When designing for multiple platforms (web, mobile, voice):

```
Shared semantic layer:
- Same information architecture
- Same user goals
- Same content priority

Platform-specific presentation:
- Web: Full visual hierarchy
- Mobile: Progressive disclosure, bottom navigation
- Voice: Linear narrative, conversational prompts
- Watch: Glanceable, actionable snippets

Cross-platform consistency:
- Color semantics (red = error across all platforms)
- Interaction patterns (swipe, tap, voice commands)
- Content tone (formal vs casual maintained)
```

### Accessibility-First Generation

Build accessibility into the generation process:

```
For every component generated:

1. Semantic HTML element selection
   - Use <button> not <div onclick>
   - Use <nav> for navigation
   - Use <main> for primary content

2. ARIA attributes (when semantic HTML insufficient)
   - aria-label for icon-only buttons
   - aria-describedby for form hints/errors
   - aria-live for dynamic content

3. Keyboard navigation
   - Tab order follows visual hierarchy
   - Focus trap in modals
   - Escape key dismisses overlays

4. Screen reader optimization
   - Meaningful alt text (not "image123.png")
   - Hidden decorative elements (aria-hidden)
   - Announced state changes

5. Color independence
   - Never use color alone for meaning
   - Pair with icons, text, or patterns
   - Sufficient contrast ratios
```

---

## Conclusion

This framework provides a systematic approach to translating abstract concepts and emotional intent into concrete UI designs. By following the concept-to-layout pipeline and applying the semantic, affective, and cognitive principles outlined here, any AI system (or designer) can generate interfaces that are:

1. **Semantically appropriate** (structure matches meaning)
2. **Emotionally resonant** (visual style matches intended feeling)
3. **Cognitively optimized** (layout follows human perception)
4. **Technically sound** (accessible, responsive, performant)

**Remember**: Every design decision should be traceable to user needs, emotional goals, or cognitive principles. There are no arbitrary choices in computational design.

---

**Next Steps for Implementation**:

1. Define your specific design system/component library
2. Map these framework-agnostic principles to your framework's syntax
3. Build a design token generation system based on emotional analysis
4. Create constraint graph templates for common page types
5. Validate outputs against the checklist
6. Iterate based on user feedback and analytics

<!-- **Further Reading**:
- "Affective Computing" by Rosalind Picard
- "The Design of Everyday Things" by Don Norman
- "Atomic Design" by Brad Frost
- "Refactoring UI" by Adam Wathan & Steve Schoger
- Research papers on LayoutGAN, Text2UI, Neural Design Networks -->

---

*End of Semantic UI Generation Framework*
