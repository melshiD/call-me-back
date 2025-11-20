# Tailwind CSS v4 - Usage Examples

## Quick Start

Tailwind CSS v4 is now installed and ready to use. You can start using Tailwind utility classes in your Vue components immediately.

## Basic Examples

### Buttons
```vue
<!-- Old custom class -->
<button class="btn btn-primary">Click me</button>

<!-- New Tailwind approach -->
<button class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all hover:-translate-y-0.5 hover:shadow-lg">
  Click me
</button>

<!-- Or use Tailwind with existing classes during transition -->
<button class="btn btn-primary hover:scale-105 transition-transform">
  Click me
</button>
```

### Cards
```vue
<!-- Old custom class -->
<div class="card">
  <h2>Title</h2>
  <p>Content</p>
</div>

<!-- New Tailwind approach -->
<div class="bg-white rounded-xl p-6 shadow-md mb-4">
  <h2 class="text-xl font-semibold mb-2">Title</h2>
  <p class="text-gray-600">Content</p>
</div>
```

### Forms
```vue
<!-- Old approach -->
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-control" />
</div>

<!-- New Tailwind approach -->
<div class="mb-4">
  <label class="block mb-2 font-medium text-gray-700">Email</label>
  <input
    type="email"
    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
  />
</div>
```

### Layout
```vue
<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white p-4 rounded-lg">Item 1</div>
  <div class="bg-white p-4 rounded-lg">Item 2</div>
  <div class="bg-white p-4 rounded-lg">Item 3</div>
</div>

<!-- Flexbox -->
<div class="flex justify-between items-center gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- Container -->
<div class="max-w-6xl mx-auto px-4">
  Content
</div>
```

### Responsive Design
```vue
<!-- Mobile first approach -->
<div class="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- 1 col on mobile, 2 on tablet, 4 on desktop -->
</div>

<button class="w-full md:w-auto px-6 py-2">
  Full width on mobile, auto on desktop
</button>
```

## Custom Colors (Defined in main.css)

You can use your custom theme colors:
```vue
<button class="bg-primary hover:bg-primary-dark text-white">
  Primary Button
</button>
```

## Mixing Old and New

During the transition, you can mix existing classes with Tailwind:
```vue
<!-- This works fine -->
<button class="btn btn-primary hover:scale-105 transition-transform">
  Hybrid approach
</button>
```

## Common Utility Classes

### Spacing
- `p-4` - padding: 1rem (16px)
- `px-6` - padding-left/right: 1.5rem
- `py-3` - padding-top/bottom: 0.75rem
- `m-4` - margin: 1rem
- `mt-2` - margin-top: 0.5rem
- `gap-4` - gap: 1rem (for flex/grid)

### Colors
- `bg-white` - white background
- `bg-gray-100` - light gray background
- `text-gray-600` - gray text
- `text-white` - white text
- `border-gray-300` - gray border

### Borders & Rounded
- `border` - 1px border
- `border-2` - 2px border
- `rounded` - border-radius: 0.25rem
- `rounded-lg` - border-radius: 0.5rem
- `rounded-xl` - border-radius: 0.75rem
- `rounded-full` - border-radius: 9999px (pills)

### Shadows
- `shadow` - small shadow
- `shadow-md` - medium shadow
- `shadow-lg` - large shadow
- `shadow-xl` - extra large shadow

### Display & Layout
- `flex` - display: flex
- `grid` - display: grid
- `block` - display: block
- `hidden` - display: none
- `md:block` - display: block on medium screens and up

### Sizing
- `w-full` - width: 100%
- `w-1/2` - width: 50%
- `h-screen` - height: 100vh
- `max-w-6xl` - max-width: 72rem

### Typography
- `text-sm` - font-size: 0.875rem
- `text-base` - font-size: 1rem
- `text-lg` - font-size: 1.125rem
- `text-xl` - font-size: 1.25rem
- `font-medium` - font-weight: 500
- `font-bold` - font-weight: 700
- `text-center` - text-align: center

### Transitions
- `transition-all` - transition all properties
- `transition-colors` - transition color properties
- `duration-300` - 300ms duration
- `ease-in-out` - ease-in-out timing

### Hover States
- `hover:bg-blue-600` - background color on hover
- `hover:scale-105` - scale up 5% on hover
- `hover:-translate-y-1` - move up on hover
- `hover:shadow-lg` - larger shadow on hover

## Reference

Full documentation: https://tailwindcss.com/docs

## Migration Strategy

1. **Keep existing classes** - They still work fine
2. **Use Tailwind for new components** - Start fresh with utility classes
3. **Gradually replace old classes** - As you redesign each page
4. **No rush** - Both approaches work together during transition
