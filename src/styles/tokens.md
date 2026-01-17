# Design Tokens Documentation

This document provides an overview of the design tokens used in the High Contrast Tattoo Website project, adapted from Figma design tokens.

## Color Tokens

### Primary Colors
- `--color-primary-50` through `--color-primary-950`: Olive/green primary color palette
- Main primary color: `--color-primary-600` (#29301d)

### Accent Colors  
- `--color-accent-50` through `--color-accent-950`: Magenta/pink accent color palette
- Main accent color: `--color-accent-600` (#BA1E4B)

### Neutral Colors
- `--color-neutral-0` through `--color-neutral-1000`: Grayscale palette
- Text: `--color-text` (black)
- Background: `--color-background` (white)

### Usage Example
```css
.my-element {
  color: var(--color-primary-600);
  background-color: var(--color-accent-100);
}
```

## Typography Tokens

### Font Families
- `--font-stack-sans`: Stack Sans Text without notch (for body text and all other content)
- `--font-stack-sans-notch`: Stack Sans Notch (for headlines and buttons) - [Google Fonts](https://fonts.google.com/specimen/Stack+Sans+Notch)

### Font Sizes
- **Core scale**: `--font-size-core-600-md` (12px) through `--font-size-core-1000-lg` (60px)
- **Text scale**: Tiny (12px), Small (14px), Regular (16px), Medium (18px)
- **Heading scale**: H6 (20px) through H1 (56px)

### Typography Styles - Stack Sans Text

#### Body Styles (without notch)
- `--typography-body-sm`: Light weight, 12px, line-height 18px
- `--typography-body-md`: Light weight, 16px, line-height 24px
- `--typography-body-lg`: Light weight, 20px, line-height 28px

#### Heading Styles (Stack Sans Notch)
- `--typography-h1`: Regular weight, 60px, line-height 60px
- `--typography-h2`: Regular weight, 48px, line-height 48px
- `--typography-h3`: Regular weight, 36px, line-height 36px
- `--typography-h4`: Regular weight, 28px, line-height 28px
- `--typography-h5`: Regular weight, 20px, line-height 20px
- `--typography-h6`: Regular weight, 16px, line-height 16px

#### Link Styles (Stack Sans Text, without notch)
- `--typography-link`: Medium weight, 16px, line-height 24px, letter-spacing 1px

#### Button Styles (Stack Sans Notch)
- `--typography-button`: Medium weight, 16px, line-height 24px, letter-spacing 1px

### Usage Examples

```css
/* Using Stack Sans Text with notch (for headings and buttons) */
.heading {
  font: var(--typography-h1);
}

.link {
  font: var(--typography-link);
  letter-spacing: var(--letter-spacing-core-100-md);
}

/* Using Stack Sans Text without notch (for body text) */
.body-text {
  font: var(--typography-body-md);
}
```

### HTML Element Styles
All heading elements (h1-h6) automatically use Stack Sans Notch when typography.css is imported. Paragraph elements, body text, and links use Stack Sans Text without notch. Buttons use Stack Sans Notch.

## Spacing Tokens

### Core Spacing Scale
- From `--spacing-core-100-md` (1px) to `--spacing-core-1900-md` (1440px)
- Semantic spacing: `--spacing-section-medium`, `--spacing-section-large`, `--spacing-page-padding`

### Usage Example
```css
.container {
  padding: var(--spacing-page-padding);
  max-width: var(--container-max-width-xlarge);
}
```

## Layout Tokens

### Container Widths
- `--container-max-width-xsmall`: 400px
- `--container-max-width-small`: 480px
- `--container-max-width-large`: 768px
- `--container-max-width-xlarge`: 1280px

### Borders
- `--border-width-divider`: 1px
- `--border-width-default`: 1px
- `--border-radius-medium`: 0
- `--border-radius-large`: 0

## Typography Utility Classes

### Stack Sans Text
- `.h1` through `.h6` - Heading styles (Stack Sans Notch)
- `.body-sm`, `.body-md`, `.body-lg` - Body text styles (Stack Sans Text without notch)
- `.link` - Link style with proper letter spacing (Stack Sans Text without notch)
- `.button` - Button style with proper letter spacing (Stack Sans Notch)

### Font Utilities
- `.font-stack-sans` - Apply Stack Sans Text without notch font family
- `.font-stack-sans-notch` - Apply Stack Sans Notch font family

### Text Size Utilities
- `.text-tiny`, `.text-small`, `.text-regular`, `.text-medium`

### Font Weight Utilities
- `.font-light` (300), `.font-regular` (400), `.font-medium` (500), `.font-semibold` (600), `.font-bold` (700)

### Line Height Utilities
- `.leading-tight` (1.2), `.leading-normal` (1.5), `.leading-relaxed` (1.4)

### Letter Spacing Utilities
- `.tracking-normal`, `.tracking-tight`, `.tracking-wide`

### Text Alignment Utilities
- `.text-center`, `.text-left`, `.text-right`

### Text Transform Utilities
- `.text-uppercase`, `.text-lowercase`, `.text-capitalize`

## Color Utility Classes

- `.text-primary`, `.text-accent`, `.text-neutral`
- `.bg-primary`, `.bg-accent`, `.bg-neutral`

### Usage Examples
```html
<!-- Stack Sans Notch (headings and buttons) -->
<h1 class="h1 text-primary">Welcome</h1>
<button class="button">Click here</button>

<!-- Stack Sans Text without notch (body text and links) -->
<p class="body-md">Some text content</p>
<a href="#" class="link">Click here</a>

<!-- Combined utilities -->
<h2 class="h2 text-accent text-center">Centered Heading</h2>
<p class="body-md font-semibold tracking-wide">Enhanced paragraph</p>
```

