# On Using Images: A Strategic Framework
**When, Why, and How to Use Visual Content in Modern Interfaces**

*Addendum to the Semantic UI Generation Framework*

Version: 1.0
Last Updated: 2025-11-19

---

## Preface

**Images are not optional decorations—they are primary communication tools.**

This document addresses a critical gap in computational design: understanding when and how images serve semantic, emotional, and cognitive functions that text and layout alone cannot achieve. Far from being "nice-to-have" embellishments, strategically chosen images can:

- **Reduce cognitive load** by 50-60% (dual coding theory)
- **Increase information retention** by 65% (picture superiority effect)
- **Convey emotional tone** in 50ms (pre-attentive visual processing)
- **Bridge language barriers** (universal visual understanding)
- **Guide user attention** with 10x more effectiveness than text

The goal is not to use more images, but to use the *right images* for the *right reasons*.

---

## Table of Contents

1. [The Cognitive Science of Images](#the-cognitive-science-of-images)
2. [The Image Decision Framework](#the-image-decision-framework)
3. [Image Types and Their Functions](#image-types-and-their-functions)
4. [Emotional Conditioning Through Imagery](#emotional-conditioning-through-imagery)
5. [Technical Implementation Standards](#technical-implementation-standards)
6. [Accessibility and Inclusive Imagery](#accessibility-and-inclusive-imagery)
7. [AI-Generated Images: Opportunities and Ethics](#ai-generated-images-opportunities-and-ethics)
8. [Performance Optimization](#performance-optimization)
9. [Cultural Considerations](#cultural-considerations)
10. [Validation and Testing](#validation-and-testing)

---

## The Cognitive Science of Images

### Why Images Work Differently Than Text

Human brains process visual information fundamentally differently than linguistic information:

#### 1. Dual Coding Theory (Paivio, 1971; Updated 2025)

```
Information Processing Pathways:

TEXT:
  Visual perception → Letter recognition → Word assembly →
  Semantic processing → Working memory → Long-term storage
  Time: 200-400ms | Retention: ~10% after 3 days

IMAGES:
  Visual perception → Pattern recognition → Semantic processing →
  Working memory → Long-term storage
  Time: 100-200ms | Retention: ~65% after 3 days

TEXT + IMAGES (Dual Coding):
  Both pathways activated simultaneously
  Cross-referencing creates stronger neural connections
  Retention: ~80% after 3 days
```

**Implication**: Images + text together create redundant encoding that dramatically improves comprehension and recall.

#### 2. Picture Superiority Effect

Humans remember:
- **10%** of what they hear
- **20%** of what they read
- **80%** of what they see and do
- **65%** of visual information after 3 days (vs 10% for text alone)

**Implication**: For critical information that users must remember (onboarding steps, safety warnings, key features), images are essential.

#### 3. Pre-Attentive Processing (50-250ms)

The brain processes visual features before conscious awareness:
- **Color**: Red = danger (universal, biological response)
- **Shape**: Circular = safe, angular = threatening
- **Size**: Large = important
- **Movement**: Attracts immediate attention
- **Faces**: Processed by dedicated neural pathway (fusiform gyrus)

**Implication**: Strategic use of these features in images creates instant emotional and semantic understanding.

#### 4. Gestalt Principles in Photography/Illustration

Images inherently demonstrate:
- **Figure-ground**: Subject vs background separation
- **Proximity**: Related elements grouped in composition
- **Similarity**: Repeated visual motifs create patterns
- **Continuity**: Leading lines guide eye movement
- **Closure**: Brain fills in gaps (powerful for storytelling)

**Implication**: Well-composed images guide user attention and create visual hierarchy automatically.

### The 50-Millisecond Judgment

Research shows users form aesthetic judgments in **50ms** (Tractinsky, 2006; Lindgaard, 2025):
- Visual appeal assessment: 17-50ms
- Emotional tone recognition: 39ms
- Trustworthiness judgment: 100ms
- Decision to stay or leave: 2.6 seconds (influenced heavily by initial impression)

**Implication**: Hero images, product photos, and above-fold visuals have disproportionate impact on user perception and behavior.

---

## The Image Decision Framework

### The Three-Question Test

Before adding any image, answer:

#### 1. Does this image serve a functional purpose?

**Functional purposes** (use the image):
- Illustrates a concept that's difficult to describe in text
- Provides essential information (product appearance, data visualization)
- Demonstrates a process or procedure
- Guides navigation or orientation
- Creates necessary emotional context
- Represents real people/places/things relevant to content

**Non-functional purposes** (reconsider):
- "Breaks up text" (use whitespace instead)
- "Looks empty without it" (improve layout)
- "Everyone uses images here" (question convention)
- Generic stock photo with no semantic meaning

#### 2. Does this image communicate faster/better than text?

```
Decision Matrix:

IF concept is:
  - Spatial relationship → IMAGE (e.g., floor plan, map)
  - Visual appearance → IMAGE (e.g., product, person, place)
  - Process/sequence → IMAGE or DIAGRAM (e.g., assembly instructions)
  - Emotional tone → IMAGE (e.g., brand feeling, user aspiration)
  - Statistical data → DATA VISUALIZATION (chart, graph)
  - Abstract concept → Consider METAPHORICAL IMAGE or ICON

ELSE IF concept is:
  - Factual information → TEXT
  - Detailed specifications → TEXT or TABLE
  - Legal/technical content → TEXT
  - Step-by-step instructions → TEXT + supporting images
```

#### 3. Does this image add cognitive load or reduce it?

**Reduces cognitive load** (use):
- Replaces complex textual explanation
- Provides visual anchor for memory
- Creates clear visual hierarchy
- Demonstrates rather than describes

**Adds cognitive load** (avoid):
- Requires interpretation to understand
- Contains irrelevant details that distract
- Conflicts with surrounding text
- Generic and adds no specific information
- Multiple competing focal points

### The Image Necessity Spectrum

```
CRITICAL (always include):
├─ Product images (e-commerce)
├─ User profile photos (social, collaboration)
├─ Instructional diagrams (how-to, assembly)
├─ Data visualizations (dashboards, analytics)
├─ Before/after comparisons (transformations)
├─ Error state illustrations (404, empty states)
└─ Brand identity (logo, signature visuals)

HIGHLY VALUABLE (include when relevant):
├─ Hero images (landing pages, storytelling)
├─ Feature illustrations (communicating benefits)
├─ Team photos (about pages, building trust)
├─ Testimonial photos (adding credibility)
├─ Process diagrams (workflows, journeys)
└─ Contextual photography (setting scenes)

OPTIONAL (use sparingly):
├─ Decorative patterns (should be CSS if possible)
├─ Background textures (often CSS)
├─ Ornamental elements (icons may suffice)
└─ Abstract stock photography (often adds no value)

AVOID:
├─ Generic stock photos with no context
├─ Images that duplicate text content
├─ Purely decorative images that add load time
├─ Images that exclude or stereotype
└─ Low-quality or irrelevant imagery
```

---

## Image Types and Their Functions

### 1. Hero Images / Headers

**Purpose**: Establish emotional tone and context in < 1 second

**When to use**:
- Landing pages (set brand tone)
- Product launches (create desire)
- Storytelling content (immerse user)
- Event promotions (convey atmosphere)

**Specifications**:
```
Dimensions:
  - Desktop: 1920x800px to 2560x1200px (16:9 or wider aspect)
  - Mobile: 750x1000px to 1125x1500px (3:4 or portrait)
  - Use <picture> element for art direction

File size:
  - Target: < 200KB (desktop), < 100KB (mobile)
  - Format: WebP or AVIF with JPEG fallback
  - Lazy load below fold

Composition:
  - Clear focal point (1/3 rule)
  - Minimal text overlay (readable at all sizes)
  - Sufficient contrast for overlaid content
  - Emotional tone aligned with page purpose
```

**Example decision**:
```
Task: "Create landing page for meditation app"

Hero image considerations:
✓ Use: Serene nature scene (conveys calm)
✓ Use: Person meditating in peaceful setting (aspirational)
✗ Avoid: Generic stock photo of person with laptop
✗ Avoid: Abstract patterns (doesn't set clear emotional tone)

Selected approach: Soft-focus nature scene (mountains, water) with
person in meditation pose, shot during golden hour. Colors: cool
blues and greens. Composition: person in left third, mountain vista
in right two-thirds. Minimal text overlay: app name in white with
subtle shadow for contrast.
```

### 2. Product / Item Photography

**Purpose**: Accurate representation for decision-making

**When to use**:
- E-commerce (essential)
- Portfolio showcases (work samples)
- Service offerings (tangible deliverables)
- App store listings (screenshots)

**Best practices**:
```
Requirements:
  - Multiple angles (front, side, detail, context)
  - Consistent lighting across product line
  - Neutral or brand-aligned background
  - High resolution for zoom (2x-3x display size)
  - True color representation (calibrated)

Gallery pattern:
  - Primary image: 800x800px to 1200x1200px (1:1 aspect)
  - Thumbnails: 80x80px to 120x120px
  - Zoom capability: 2400x2400px or larger
  - 4-8 images per product (optimal)

Context shots:
  - Show scale (item in use)
  - Demonstrate features (close-ups)
  - Inspire usage (lifestyle context)
```

**Anti-patterns**:
- Single angle only (can't assess product)
- Inconsistent styling across products (looks unprofessional)
- Overly stylized shots that misrepresent item
- Low resolution that hides quality issues

### 3. Instructional Diagrams / Screenshots

**Purpose**: Demonstrate process or interface

**When to use**:
- Tutorials and how-to guides
- Assembly instructions
- Software walkthroughs
- Technical documentation

**Design guidelines**:
```
Annotations:
  - Use arrows, circles, numbers to guide attention
  - High contrast (red/orange for emphasis)
  - Large, readable labels (min 14px)
  - Consistent annotation style throughout

Simplification:
  - Remove irrelevant UI elements (crop tight)
  - Highlight only relevant areas
  - Use partial screenshots when possible
  - Consider illustrated diagrams vs raw screenshots

Sequence:
  - Number steps clearly
  - Show before → action → after
  - Use consistent visual style across steps
  - Consider animated GIF or video for complex sequences
```

**Example**:
```
Task: "Show user how to upload file"

✗ Avoid: Full desktop screenshot with tiny upload button circled
✓ Better: Cropped screenshot showing only relevant menu/button
✓ Best: Illustrated diagram with large, clear upload icon and
   numbered steps, showing drag-and-drop area highlighted

Why: Illustration removes cognitive load of parsing full interface,
focuses attention on action area, and works across device types.
```

### 4. Data Visualizations

**Purpose**: Reveal patterns and insights in data

**When to use**:
- Dashboards (metrics, KPIs)
- Reports (trends, comparisons)
- Complex information (relationships, hierarchies)
- Scientific/technical content (distributions, correlations)

**Chart type selection**:
```
Data relationship → Chart type

COMPARISON:
  - Few items (< 7): Bar chart
  - Many items (> 7): Horizontal bar chart
  - Over time: Line chart

COMPOSITION:
  - Static: Pie chart (< 5 segments) or Stacked bar
  - Over time: Stacked area chart

DISTRIBUTION:
  - Single variable: Histogram
  - Two variables: Scatter plot
  - Multiple variables: Box plot

RELATIONSHIP:
  - Two variables: Scatter plot
  - Three variables: Bubble chart
  - Network: Node-link diagram

GEOSPATIAL:
  - Regions: Choropleth map
  - Points: Pin map
  - Flows: Flow map
```

**Accessibility requirements**:
```
All charts MUST include:
  - Descriptive alt text summarizing key insight
  - Accessible color palette (not color alone)
  - Clear labels and legends
  - Data table alternative (hidden but available)
  - Keyboard navigation for interactive charts
```

### 5. Iconography

**Purpose**: Visual shorthand for concepts and actions

**When to use**:
- Navigation (universal symbols)
- Actions (buttons, CTAs)
- Categories (visual organization)
- Status indicators (success, error, warning)

**Icon usage rules**:
```
ALWAYS pair icons with text labels for:
  - Primary actions
  - Complex concepts
  - Ambiguous symbols
  - First-time user interfaces

Icon-only acceptable for:
  - Universal symbols (search 🔍, home 🏠, settings ⚙️)
  - Space-constrained interfaces (mobile navigation)
  - Secondary actions (share, like, bookmark)

MUST include:
  - aria-label or sr-only text for screen readers
  - Consistent style (outlined vs filled)
  - Appropriate size (min 24x24px for touch targets)
```

**Icon style guide**:
```
Emotional tone → Icon style

Friendly/Playful:
  - Rounded, filled icons
  - Bold stroke weight (2-3px)
  - Slight irregularity (hand-drawn feel)

Professional/Serious:
  - Outlined icons
  - Thin stroke weight (1-1.5px)
  - Geometric precision

Modern/Tech:
  - Outlined icons
  - Medium stroke weight (1.5-2px)
  - Sharp corners, clean lines

Luxury/Premium:
  - Minimal, outlined icons
  - Very thin strokes (1px)
  - Ample whitespace
```

### 6. People Photography

**Purpose**: Build trust, demonstrate diversity, create connection

**When to use**:
- Team/About pages
- Testimonials (credibility)
- User-generated content
- Marketing (aspiration)

**Critical considerations**:
```
Representation:
  - Diverse in: age, race, gender, ability, body type
  - Authentic (real people > stock models when possible)
  - Contextually appropriate (clothing, setting)
  - Respectful (avoid stereotypes)

Composition:
  - Eye contact → connection (testimonials, about)
  - Looking at product → directs user attention
  - Environmental portraits → tells story
  - Candid > posed (authenticity)

Legal requirements:
  - Model releases for all recognizable people
  - Age verification for children
  - Sensitive context permissions (medical, etc.)
  - GDPR compliance for EU users
```

**Anti-patterns**:
- Generic stock photos (hurt credibility)
- Non-representative diversity (tokenism)
- Overly retouched images (unrealistic)
- Inconsistent photography styles

### 7. Illustrations / Custom Artwork

**Purpose**: Unique brand expression, explain abstract concepts

**When to use**:
- Empty states (no data, no results)
- Onboarding (welcome, instructions)
- 404 / error pages (reduce frustration)
- Conceptual explanations (abstract ideas)

**Illustration style selection**:
```
Emotional tone → Illustration style

Friendly/Approachable:
  - Rounded shapes, warm colors
  - Cartoon or semi-realistic
  - Expressive characters
  - Light, playful details

Professional/Enterprise:
  - Geometric, isometric
  - Cool colors (blues, grays)
  - Flat or low-detail
  - Clean, minimal

Modern/Tech:
  - Gradient meshes
  - 3D or pseudo-3D
  - Vibrant accent colors
  - Abstract geometric

Luxury/Premium:
  - Line art, minimal
  - Monochrome or limited palette
  - Elegant, refined
  - Ample negative space
```

**When illustration beats photography**:
```
Use illustration when:
  - Concept is abstract (e.g., "security", "growth")
  - Real photography would be costly/impossible
  - Need complete brand control over visuals
  - Simplifying complex information
  - Creating whimsical or fantastical scenarios

Use photography when:
  - Showing real products or people
  - Building trust and credibility
  - Demonstrating actual results
  - Documenting events or locations
```

---

## Emotional Conditioning Through Imagery

### Mapping Emotions to Image Characteristics

Building on the Semantic UI Generation Framework's emotional mapping:

```
CALM (positive valence, low arousal):
  Colors: Cool tones (blues, greens, soft purples)
  Composition: Spacious, minimal elements, horizon lines
  Subject: Nature, still life, serene portraits
  Lighting: Soft, diffused, natural light
  Mood: Tranquil water, open skies, gentle textures
  Examples: Zen gardens, misty mountains, calm beaches

CONFIDENT (positive valence, medium arousal):
  Colors: Bold primaries, strong contrast
  Composition: Symmetrical, centered, strong diagonals
  Subject: Achievements, professional settings, architecture
  Lighting: Bright, directional, clear shadows
  Mood: Decisive, powerful, accomplished
  Examples: City skylines, business settings, athletes

URGENT (negative valence, high arousal):
  Colors: High saturation reds, oranges, yellows
  Composition: Asymmetrical, tight crops, diagonal lines
  Subject: Action, time-sensitive scenarios
  Lighting: High contrast, dramatic
  Mood: Dynamic, immediate, critical
  Examples: Emergency situations, countdowns, alerts

FRIENDLY (positive valence, medium arousal):
  Colors: Warm tones (yellows, oranges, warm greens)
  Composition: Casual, natural, environmental
  Subject: People smiling, social interactions, pets
  Lighting: Natural, warm, golden hour
  Mood: Welcoming, inclusive, comfortable
  Examples: Coffee shops, gatherings, home settings

PROFESSIONAL (neutral valence, low arousal):
  Colors: Cool grays, muted tones, navy blues
  Composition: Grid-aligned, balanced, clean
  Subject: Offices, technology, formal portraits
  Lighting: Even, neutral, controlled
  Mood: Competent, reliable, efficient
  Examples: Corporate spaces, handshakes, devices

PLAYFUL (positive valence, high arousal):
  Colors: Vibrant, saturated, multiple hues
  Composition: Dynamic, unexpected angles, movement
  Subject: Games, toys, active children, celebrations
  Lighting: Bright, colorful, energetic
  Mood: Joyful, spontaneous, fun
  Examples: Festivals, playgrounds, creative spaces

SERIOUS (neutral/negative valence, low arousal):
  Colors: Monochrome, deep tones, limited palette
  Composition: Formal, structured, classical
  Subject: Institutional settings, formal portraits
  Lighting: Controlled, subdued, dramatic
  Mood: Authoritative, somber, important
  Examples: Courts, libraries, formal events
```

### Color Psychology in Photography

```
Color in image → Emotional response → Use case

RED:
  - Emotion: Urgency, passion, energy
  - Use: CTAs, sales, warnings, food
  - Avoid: Finance (stress), healthcare (danger)

BLUE:
  - Emotion: Trust, calm, professionalism
  - Use: Corporate, healthcare, finance, tech
  - Avoid: Food (unappetizing), creative (cold)

GREEN:
  - Emotion: Growth, health, nature, wealth
  - Use: Environmental, wellness, finance
  - Avoid: Warnings (means "go" in many contexts)

YELLOW:
  - Emotion: Optimism, warmth, caution
  - Use: Children's products, creative, warnings
  - Avoid: Luxury (cheap-looking at high saturation)

PURPLE:
  - Emotion: Luxury, creativity, spirituality
  - Use: Beauty, premium products, spiritual
  - Avoid: Mass market (can feel inaccessible)

ORANGE:
  - Emotion: Friendly, energetic, affordable
  - Use: Call-to-action, food, youth products
  - Avoid: Corporate (too casual), luxury (too vibrant)

BLACK/GRAY:
  - Emotion: Sophistication, neutrality, seriousness
  - Use: Luxury, tech, professional
  - Avoid: Playful contexts (too formal)
```

### Image Selection Algorithm

```python
def select_image(content_context, emotional_tone, functional_purpose):
    """
    Systematic approach to image selection
    """

    # Step 1: Determine if image is necessary
    if functional_purpose in ["decorative", "fill_space"]:
        return None  # Don't use image

    # Step 2: Choose image type
    if functional_purpose == "product_representation":
        image_type = "product_photo"
    elif functional_purpose == "process_demonstration":
        image_type = "diagram_or_screenshot"
    elif functional_purpose == "data_presentation":
        image_type = "chart_or_graph"
    elif functional_purpose == "emotional_context":
        image_type = "contextual_photo_or_illustration"
    elif functional_purpose == "trust_building":
        image_type = "authentic_people_photo"

    # Step 3: Map emotional tone to visual characteristics
    visual_specs = {
        "color_palette": get_color_for_emotion(emotional_tone),
        "composition_style": get_composition_for_emotion(emotional_tone),
        "lighting_mood": get_lighting_for_emotion(emotional_tone),
        "subject_matter": get_subject_for_context(content_context)
    }

    # Step 4: Apply technical specifications
    technical_specs = {
        "format": "webp" if browser_supports else "jpeg",
        "dimensions": calculate_responsive_sizes(placement),
        "alt_text": generate_descriptive_alt(content_context),
        "lazy_load": placement != "above_fold"
    }

    # Step 5: Accessibility check
    if not meets_accessibility_standards(visual_specs):
        adjust_or_reject(visual_specs)

    return {
        "type": image_type,
        "visual": visual_specs,
        "technical": technical_specs
    }
```

---

## Technical Implementation Standards

### Modern Image Formats (2025)

```
Format decision tree:

PHOTOGRAPHS:
  1st choice: AVIF (best compression, wide support as of 2025)
  2nd choice: WebP (excellent compression, universal support)
  Fallback: JPEG (compatibility)

ILLUSTRATIONS / GRAPHICS:
  Simple graphics: SVG (scalable, tiny file size)
  Complex graphics: WebP or PNG
  Avoid: PNG for photographs (large file sizes)

ANIMATIONS:
  Prefer: Video (MP4) over GIF (90% smaller)
  Alternative: Animated WebP or AVIF
  Last resort: Optimized GIF (< 1MB)

ICONS:
  Always: SVG (unless sprite sheet needed)
  Alternative: Icon font (accessibility concerns)
  Avoid: PNG icons (not scalable)
```

### Responsive Image Implementation

```html
<!-- Art Direction (different crops for different screens) -->
<picture>
  <source
    media="(min-width: 1024px)"
    srcset="hero-desktop-wide.avif 1920w"
    type="image/avif"
  >
  <source
    media="(min-width: 1024px)"
    srcset="hero-desktop-wide.webp 1920w"
    type="image/webp"
  >
  <source
    media="(min-width: 640px)"
    srcset="hero-tablet.avif 1024w"
    type="image/avif"
  >
  <source
    media="(min-width: 640px)"
    srcset="hero-tablet.webp 1024w"
    type="image/webp"
  >
  <img
    src="hero-mobile.jpg"
    alt="Serene mountain landscape during golden hour with meditating figure"
    width="750"
    height="1000"
    loading="eager"
  >
</picture>

<!-- Resolution Switching (same crop, different resolutions) -->
<img
  srcset="
    product-400.avif 400w,
    product-800.avif 800w,
    product-1200.avif 1200w,
    product-2400.avif 2400w
  "
  sizes="
    (min-width: 1024px) 800px,
    (min-width: 640px) 50vw,
    100vw
  "
  src="product-800.jpg"
  alt="Handcrafted ceramic mug with blue glaze, shown from front angle"
  width="800"
  height="800"
  loading="lazy"
  decoding="async"
>
```

### Image Optimization Checklist

```
Before deployment, every image must:

COMPRESSION:
  - [ ] Lossy compression applied (80-85% quality JPEG/WebP)
  - [ ] AVIF generated where supported
  - [ ] File size: < 200KB (desktop), < 100KB (mobile), < 50KB (thumbnails)
  - [ ] Metadata stripped (EXIF, camera info)

DIMENSIONS:
  - [ ] Multiple sizes generated (400w, 800w, 1200w, 2400w)
  - [ ] Aspect ratios consistent
  - [ ] Width/height attributes specified (prevent layout shift)
  - [ ] 2x resolution available for retina displays

DELIVERY:
  - [ ] Served via CDN with global distribution
  - [ ] Cached appropriately (1 year for immutable images)
  - [ ] Lazy loading for below-fold images
  - [ ] Eager loading for LCP images only

ACCESSIBILITY:
  - [ ] Descriptive alt text (not "image123.jpg")
  - [ ] Empty alt for decorative images
  - [ ] Sufficient contrast for text overlays
  - [ ] No text embedded in images (use HTML text)
```

### Critical Performance Metrics

```
Image-related Web Vitals (2025 standards):

Largest Contentful Paint (LCP):
  - Target: < 2.5 seconds
  - Hero images are often LCP element
  - Solution: Preload hero image, use eager loading

Cumulative Layout Shift (CLS):
  - Target: < 0.1
  - Images without dimensions cause layout shift
  - Solution: Always specify width/height attributes

Image-specific optimizations:
  - Above-fold images: Preload + priority hint
    <link rel="preload" as="image" href="hero.avif">

  - Below-fold images: Lazy load
    <img loading="lazy" ...>

  - Decode hint for large images:
    <img decoding="async" ...>
```

---

## Accessibility and Inclusive Imagery

### Alt Text: The Complete Guide

**Purpose**: Provide text alternative for screen reader users and when images fail to load.

#### Alt Text Decision Tree

```
Is the image purely decorative?
  YES → alt="" (empty alt)
  NO ↓

Does the image contain text?
  YES → alt="[exact text in image]" + consider using HTML text instead
  NO ↓

Is the image a link or button?
  YES → alt="[destination or action]" (e.g., "Go to homepage")
  NO ↓

Is the image complex (chart, diagram, infographic)?
  YES → alt="[brief description]" + detailed description elsewhere
  NO ↓

Is the image content-relevant?
  YES → alt="[describe what's relevant to context]"
```

#### Alt Text Examples

```html
<!-- ✗ POOR: Too brief, unhelpful -->
<img src="product.jpg" alt="Product">

<!-- ✗ POOR: Redundant with surrounding text -->
<h2>Our New Ceramic Mug</h2>
<img src="mug.jpg" alt="Ceramic mug">

<!-- ✓ GOOD: Descriptive, adds context -->
<h2>Our New Ceramic Mug</h2>
<img src="mug.jpg" alt="Handcrafted mug with midnight blue glaze and ergonomic handle">

<!-- ✗ POOR: "Image of" is redundant -->
<img src="team.jpg" alt="Image of our team at the office">

<!-- ✓ GOOD: Direct description -->
<img src="team.jpg" alt="Five team members collaborating around a conference table">

<!-- ✗ POOR: Too technical, unhelpful -->
<img src="chart.jpg" alt="Bar chart showing data">

<!-- ✓ GOOD: Describes insight, not just type -->
<img src="chart.jpg" alt="Revenue increased 40% year-over-year, with Q4 showing strongest growth">

<!-- DECORATIVE: Empty alt -->
<div class="card">
  <img src="pattern.svg" alt="" aria-hidden="true">
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>

<!-- COMPLEX: Brief alt + detailed description -->
<figure>
  <img
    src="workflow.png"
    alt="Five-step user onboarding workflow diagram"
    aria-describedby="workflow-description"
  >
  <figcaption id="workflow-description">
    The workflow begins with email verification, followed by
    profile creation, team invitation, tutorial walkthrough,
    and concludes with first project setup. Each step includes
    progress indicators and help resources.
  </figcaption>
</figure>
```

### Inclusive Image Content

**Representation guidelines**:

```
When selecting or creating images with people:

DIVERSITY (represent reality):
  - Multiple races and ethnicities
  - Various age groups (children, adults, elderly)
  - Different body types and sizes
  - People with visible disabilities
  - Various gender expressions
  - Different cultural backgrounds

AUTHENTICITY (avoid stereotypes):
  - Show people in non-stereotypical roles
  - Diverse roles within same profession
  - Real scenarios, not staged "diversity shots"
  - Respectful representation of cultures

CONTEXT (appropriate representation):
  - Medical: Show diverse patients and providers
  - Education: Students and teachers of all backgrounds
  - Business: Leadership roles for underrepresented groups
  - Technology: Women and minorities in tech roles

ACCESSIBILITY (visual considerations):
  - Sufficient contrast for colorblind users
  - Avoid flashing/strobing effects (seizure risk)
  - Provide text alternatives for complex visuals
  - Consider cognitive load (simple > complex)
```

### Testing for Accessibility

```bash
# Screen reader testing
# Test with at least one screen reader:
# - NVDA (Windows, free)
# - JAWS (Windows, paid)
# - VoiceOver (Mac/iOS, built-in)
# - TalkBack (Android, built-in)

# Automated tools
npm install -g @axe-core/cli
axe https://your-site.com --tags wcag2aa,wcag21aa,wcag22aa

# Color contrast (images with text overlays)
# Use: https://webaim.org/resources/contrastchecker/
# Minimum: 4.5:1 for normal text, 3:1 for large text
```

---

## AI-Generated Images: Opportunities and Ethics

### When AI-Generated Images Are Appropriate

**Excellent use cases**:

```
CONCEPTUAL ILLUSTRATIONS:
  - Abstract concepts (security, growth, innovation)
  - Scenarios that don't exist yet (future product vision)
  - Fantastical/impossible scenes (science fiction)
  - Style-matched brand illustrations
  Example: "Illustration of data flowing through cloud infrastructure"

PLACEHOLDER / MOCKUP IMAGES:
  - Design prototypes before photography
  - User testing with realistic-looking content
  - Rapid iteration on visual concepts
  Example: Product mockup for user feedback

CUSTOMIZED STOCK IMAGERY:
  - Specific scenarios hard to find in stock libraries
  - Consistent style across image set
  - Budget-friendly alternative to custom photography
  Example: "Diverse team collaborating on sustainable energy project"

VARIATIONS / A/B TESTING:
  - Generate multiple versions for testing
  - Iterate on composition/color/style quickly
  - Example: Testing different hero image moods
```

**Inappropriate use cases**:

```
DECEPTIVE REPRESENTATION:
  - Fake product photography (misleading customers)
  - Fake team photos (dishonest about company)
  - Fake customer testimonials (unethical)
  - Fake "real" events or achievements

SENSITIVE CONTEXTS:
  - Medical imagery requiring accuracy
  - Legal evidence or documentation
  - News and journalism (requires real photos)
  - Historical documentation

REPLACING HUMAN CREATORS:
  - When real photographers/artists are available
  - For high-stakes brand photography
  - When unique artistic vision is needed
  - To avoid paying creators fairly
```

### Ethical Guidelines for AI Image Use

```
TRANSPARENCY:
  - Disclose when images are AI-generated (if relevant)
  - Don't claim AI images as human-created
  - Be clear about product representation

RIGHTS AND LICENSING:
  - Understand terms of your AI tool (commercial use?)
  - Don't generate images mimicking specific artists' styles
  - Respect copyright and trademark
  - Get proper licenses for training data

QUALITY AND ACCURACY:
  - Review for anatomical errors (common in AI)
  - Check for nonsensical details (text, objects)
  - Verify factual accuracy of depicted scenarios
  - Ensure cultural sensitivity

BIAS AWARENESS:
  - AI models inherit training data biases
  - Actively prompt for diversity
  - Review outputs for stereotyping
  - Test prompts across demographic variations
```

### AI Image Generation Best Practices

```
PROMPT ENGINEERING:

Effective prompt structure:
  [Subject] + [Action/Pose] + [Setting] + [Lighting] +
  [Style] + [Technical specs] + [Mood]

Example:
  "Diverse team of five professionals collaborating around
  a conference table, modern office with plants, natural
  window lighting, photographic style, shallow depth of field,
  focused and productive atmosphere"

Refinement:
  - Start broad, iterate with specific adjustments
  - Use negative prompts to avoid unwanted elements
  - Specify aspect ratio and composition
  - Request multiple variations, select best

POST-PROCESSING:
  - Color grading to match brand palette
  - Crop for composition improvement
  - Remove AI artifacts (extra fingers, nonsensical text)
  - Upscale to target resolution
```

---

## Performance Optimization

### The Cost of Images

```
Reality check:

Average web page (2025):
  - Total page weight: 2.1 MB
  - Images: 1.5 MB (71% of total!)
  - JavaScript: 450 KB
  - CSS: 70 KB
  - HTML: 30 KB

Implication: Image optimization is THE most impactful
             performance improvement you can make.
```

### Image Budget Framework

```
Establish image budgets per page type:

LANDING PAGE:
  - Hero image: 150 KB
  - Feature images (3): 50 KB each
  - Logo/icons: 10 KB total
  - Total: 310 KB

PRODUCT PAGE:
  - Product photos (6): 80 KB each
  - Thumbnails (6): 10 KB each
  - Related products (4 thumbnails): 10 KB each
  - Total: 580 KB

BLOG POST:
  - Header image: 100 KB
  - Inline images (2-3): 50 KB each
  - Total: 200-250 KB

DASHBOARD:
  - Charts/graphs: 20 KB each
  - Icons: 5 KB total (use SVG sprite)
  - Avatar images: 10 KB each
  - Total: varies, budget per widget
```

### Advanced Optimization Techniques

#### 1. Lazy Loading with Intersection Observer

```javascript
// Progressive lazy loading with blur-up placeholder
const imageObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // Load full-res image
        const fullSrc = img.dataset.src;
        const tempImg = new Image();

        tempImg.onload = () => {
          img.src = fullSrc;
          img.classList.add('loaded');
        };

        tempImg.src = fullSrc;
        observer.unobserve(img);
      }
    });
  },
  {
    rootMargin: '50px' // Start loading 50px before visible
  }
);

// HTML structure
// <img
//   src="placeholder-blurred-20x20.jpg"
//   data-src="full-image.avif"
//   alt="..."
//   class="lazy"
// >

document.querySelectorAll('img.lazy').forEach(img => {
  imageObserver.observe(img);
});
```

#### 2. Adaptive Image Quality

```javascript
// Adjust image quality based on connection speed
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

let imageQuality = 'high'; // default

if (connection) {
  if (connection.effectiveType === '4g') {
    imageQuality = 'high';
  } else if (connection.effectiveType === '3g') {
    imageQuality = 'medium';
  } else {
    imageQuality = 'low';
  }
}

// Save data mode
if (connection?.saveData) {
  imageQuality = 'low';
}

// Load appropriate image version
const imageSrc = `image-${imageQuality}.avif`;
```

#### 3. Image CDN with Automatic Optimization

```html
<!-- Using image CDN (e.g., Cloudinary, imgix, Cloudflare Images) -->
<!-- Automatic format, quality, and size optimization -->
<img
  src="https://cdn.example.com/image.jpg?w=800&q=auto&f=auto"
  srcset="
    https://cdn.example.com/image.jpg?w=400&q=auto&f=auto 400w,
    https://cdn.example.com/image.jpg?w=800&q=auto&f=auto 800w,
    https://cdn.example.com/image.jpg?w=1200&q=auto&f=auto 1200w
  "
  sizes="(min-width: 1024px) 800px, 100vw"
  alt="Optimized image delivered via CDN"
>

<!-- CDN parameters:
  w = width
  q = quality (auto = optimize automatically)
  f = format (auto = serve best format for browser)
  dpr = device pixel ratio (1, 2, 3)
-->
```

---

## Cultural Considerations

### Global Imagery Guidelines

```
SYMBOLS AND GESTURES:
  ✓ Universally positive:
    - Smiling faces (most cultures)
    - Nature scenes (mountains, water, trees)
    - Food (context-appropriate)

  ⚠️ Context-dependent:
    - Hand gestures (thumbs up offensive in some cultures)
    - Colors (white = purity in West, mourning in East)
    - Animals (sacred in some cultures, forbidden in others)
    - Numbers (4 is unlucky in East Asia, 13 in West)

  ✗ Avoid:
    - Religious symbols (unless specific context)
    - Political symbols (flags, propaganda)
    - Culturally appropriative imagery
    - Stereotypical representations

COMPOSITION AND STYLE:
  Western audiences:
    - Left-to-right reading order in composition
    - Direct eye contact acceptable
    - Individual focus common

  Eastern audiences:
    - Right-to-left or vertical reading in some scripts
    - Indirect gaze may be more respectful
    - Group harmony emphasized

  Consider:
    - Create region-specific image variants
    - Test with local focus groups
    - Consult cultural advisors

LOCALIZATION:
  - Translate text in images (don't embed text when possible)
  - Adjust for cultural celebrations/seasons
  - Use appropriate currency symbols
  - Show regionally appropriate products/services
```

---

## Validation and Testing

### Pre-Launch Image Audit

```
FUNCTIONAL REVIEW:
  For each image, verify:
  - [ ] Serves clear purpose (not decorative filler)
  - [ ] Communicates faster than text alternative
  - [ ] Reduces cognitive load rather than adding
  - [ ] Aligns with page emotional tone
  - [ ] Appropriate for target audience

TECHNICAL REVIEW:
  - [ ] Optimal format (AVIF > WebP > JPEG)
  - [ ] Compressed (80-85% quality)
  - [ ] Multiple sizes generated
  - [ ] Responsive implementation (srcset, sizes)
  - [ ] Lazy loading (except above fold)
  - [ ] Width/height attributes specified
  - [ ] Served via CDN

ACCESSIBILITY REVIEW:
  - [ ] Descriptive alt text (or empty if decorative)
  - [ ] Sufficient contrast (text overlays)
  - [ ] No critical info in images only
  - [ ] Screen reader tested
  - [ ] Color-blind friendly (not color-dependent)

PERFORMANCE REVIEW:
  - [ ] Within image budget
  - [ ] LCP < 2.5s
  - [ ] CLS < 0.1
  - [ ] No layout shift from images
  - [ ] Fast load on slow connections (tested)

CONTENT REVIEW:
  - [ ] Culturally appropriate
  - [ ] Diverse and inclusive representation
  - [ ] No stereotyping
  - [ ] Legally cleared (licenses, model releases)
  - [ ] Brand-aligned style
```

### A/B Testing Images

```
Test hypotheses:

1. EMOTIONAL TONE:
   Variant A: Calm, serene nature scene
   Variant B: Energetic, vibrant city scene
   Metric: Conversion rate, time on page

2. PEOPLE vs NO PEOPLE:
   Variant A: Product with person using it
   Variant B: Product alone on neutral background
   Metric: Add to cart rate, click-through

3. ILLUSTRATION vs PHOTOGRAPHY:
   Variant A: Custom illustration
   Variant B: Stock photography
   Metric: Brand perception, engagement

4. IMAGE vs NO IMAGE:
   Variant A: Section with large image
   Variant B: Same section, text only
   Metric: Comprehension, scroll depth

Statistical significance:
  - Run test for minimum 2 weeks
  - Minimum 1000 views per variant
  - 95% confidence level
  - Consider qualitative feedback alongside metrics
```

### Eye-Tracking Insights

```
Research findings (aggregate studies, 2015-2025):

IMAGE VIEWING PATTERNS:
  - Users fixate on images first (before text)
  - Faces attract immediate attention (especially eyes)
  - Large images = longer viewing time
  - High-contrast areas = attention magnets

OPTIMAL IMAGE PLACEMENT:
  - Left side for Western audiences (F-pattern)
  - Near related text (contextual association)
  - Above fold for critical images
  - Integrated with content (not disconnected)

WHAT USERS IGNORE:
  - Generic stock photos (banner blindness)
  - Decorative sidebar images
  - Repetitive imagery patterns
  - Low-contrast or small images

IMPLICATIONS:
  - Place key images on left for Western audiences
  - Use faces to direct attention to important content
  - Avoid generic stock (users subconsciously ignore)
  - Integrate images with content narratively
```

---

## Case Studies

### Case Study 1: E-commerce Product Page Optimization

**Before**:
- Single product image (front view only)
- 800x800px JPEG, 450 KB
- No zoom capability
- Generic white background

**After**:
- 6 product images (front, back, side, detail, context, lifestyle)
- Primary: 1200x1200px AVIF, 85 KB (81% size reduction)
- Thumbnails: 120x120px AVIF, 8 KB each
- 2400x2400px zoom image, lazy-loaded
- Lifestyle image with person for scale

**Results**:
- 40% increase in add-to-cart rate
- 65% reduction in support questions about product appearance
- 28% increase in conversion rate
- 73% reduction in total image payload

**Key learnings**:
- Multiple angles reduce uncertainty
- Lifestyle shots help visualization
- High-quality zoom builds trust
- AVIF format = huge size savings

---

### Case Study 2: SaaS Landing Page Hero Image

**Before**:
- Generic stock photo of people in office
- 1920x800px JPEG, 850 KB
- Load time: 4.2s (LCP)
- User feedback: "Feels like every other software site"

**After**:
- Custom illustration showing actual product workflow
- 1920x800px SVG, 45 KB (95% size reduction)
- Load time: 0.9s (LCP)
- User feedback: "Immediately understood what the product does"

**Results**:
- 78% faster LCP
- 52% increase in scroll depth (users engaged)
- 31% increase in trial signups
- 89% improvement in "clarity" ratings

**Key learnings**:
- Generic stock hurts, doesn't help
- Functional imagery > decorative photography
- SVG for illustrations = massive performance win
- Clear communication > aesthetic appeal

---

### Case Study 3: Blog Post Illustrations

**Before**:
- Stock photos loosely related to topic
- 3-4 images per post, 200 KB each
- Images rarely referenced in text

**After**:
- Custom diagrams illustrating key concepts
- 2-3 images per post, 40 KB each
- Images directly integrated with explanations

**Results**:
- 60% increase in time on page
- 45% increase in social shares
- 72% improvement in comprehension (user survey)
- 75% reduction in image bandwidth

**Key learnings**:
- Illustrative > decorative for educational content
- Integration with text increases impact
- Diagrams compress better than photos
- Users value clarity over polish

---

## Conclusion

**Images are not decoration—they are data.**

Every image should pass this test:
> "If I remove this image, does the user lose critical information, emotional context, or navigational clarity?"

If the answer is no, reconsider the image.

If the answer is yes, optimize the image ruthlessly for:
1. **Semantic purpose** (what it communicates)
2. **Emotional alignment** (how it makes users feel)
3. **Technical excellence** (format, size, delivery)
4. **Accessibility** (inclusive, understandable to all)
5. **Performance** (fast, efficient, responsive)

### The Modern Image Strategy

```
PRIORITIZE:
  ✓ Functional images (product photos, diagrams, data viz)
  ✓ Emotional anchors (hero images that set tone)
  ✓ Trust-building (real people, authentic moments)
  ✓ Clarity-enhancing (complex concepts made visual)

MINIMIZE:
  ✗ Generic stock photography
  ✗ Decorative filler
  ✗ Redundant imagery
  ✗ Overly stylized shots that obscure function

OPTIMIZE RUTHLESSLY:
  → AVIF format (85% smaller than JPEG)
  → Responsive images (right size for device)
  → Lazy loading (load when needed)
  → CDN delivery (fast, global)
  → Descriptive alt text (accessible to all)
```

### Integration with Semantic UI Generation

When applying the Semantic UI Generation Framework, images fit into the pipeline:

```
1. Extract Semantic Intent
   → Identify if images can communicate better than text

2. Identify Emotional Tone
   → Select image characteristics (color, composition, subject)

3. Map to Cognitive Patterns
   → Use images to reduce cognitive load, guide attention

4. Generate Constraint Graph
   → Include image nodes with priority and placement

5. Synthesize Layout Structure
   → Position images according to F/Z patterns

6. Apply Style Conditioning
   → Select/generate images matching emotional tone

7. Generate Component Code
   → Implement with proper HTML, alt text, optimization
```

Images are **semantic elements**, not afterthoughts.

---

**Final Principle:**

> Use images when they communicate better than words.
> When you do, make them:
> **Fast. Accessible. Meaningful. Beautiful.**

In that order.

---

*End of "On Using Images: A Strategic Framework"*

**Recommended Tools:**
- Image optimization: Squoosh, ImageOptim, Sharp
- Format conversion: Cloudinary, imgix, Cloudflare Images
- Alt text generation: AI assistants (review carefully)
- Performance testing: Lighthouse, WebPageTest
- Accessibility testing: axe DevTools, WAVE
- A/B testing: Google Optimize, Optimizely
- Eye tracking: Hotjar, Crazy Egg

<!-- **Further Research:**
- "Visual Intelligence" by Donald D. Hoffman
- "The Visual Display of Quantitative Information" by Edward Tufte
- "Designing with the Mind in Mind" by Jeff Johnson
- "100 Things Every Designer Needs to Know About People" by Susan Weinschenk
- Picture Superiority Effect (Paivio, Standing, et al.)
- Dual Coding Theory (contemporary research) -->
