# WebSecScan Design System

## Overview

A cyber security themed design system built with Tailwind CSS featuring dark, tech-inspired aesthetics with glowing accents and security-focused color palettes.

## Color Palette

### Primary Colors
- **Cyber Black**: `#0a0a0f` - Main background
- **Cyber Darker**: `#0f0f1e` - Secondary background
- **Cyber Dark**: `#1a1a2e` - Card backgrounds
- **Cyber Blue**: `#0066ff` - Primary action color
- **Cyber Blue Light**: `#00d9ff` - Highlights & hover states
- **Cyber Green**: `#00ff88` - Success & safe states
- **Cyber Purple**: `#8b5cf6` - Secondary actions & info

### Security-Specific Colors
- **Critical**: `#ff0055` - Critical vulnerabilities
- **High**: `#ff6b35` - High severity issues
- **Medium**: `#ffcc00` - Medium severity warnings
- **Low**: `#00d9ff` - Low severity info
- **Safe**: `#00ff88` - Secure/passing states

## Components

### Button
Versatile button component with multiple variants and sizes.

**Variants:**
- `primary` - Main actions (blue glow)
- `secondary` - Secondary actions (purple glow)
- `danger` - Destructive actions (red glow)
- `success` - Positive actions (green glow)
- `ghost` - Subtle actions
- `outline` - Bordered buttons

**Sizes:** `sm`, `md`, `lg`

**Usage:**
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" size="md" isLoading={false}>
  Start Scan
</Button>
```

### Card
Container component with variants for different visual emphasis.

**Variants:**
- `default` - Standard card
- `bordered` - With border highlight
- `glow` - With blue glow effect
- `gradient` - Gradient background

**Padding:** `none`, `sm`, `md`, `lg`

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

<Card variant="glow">
  <CardHeader>
    <CardTitle>Scan Results</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Badge
Visual indicator for status, severity, and categories.

**Variants:**
- `default` - Neutral
- `critical` - Critical severity
- `high` - High severity
- `medium` - Medium severity
- `low` - Low severity
- `info` - Information
- `success` - Success states

**Usage:**
```tsx
import Badge from '@/components/ui/Badge'

<Badge variant="critical" size="md">
  CRITICAL
</Badge>
```

### Input
Styled text input with label and error support.

**Props:**
- `label` - Input label
- `error` - Error message
- `leftIcon` - Icon on left side
- `rightIcon` - Icon on right side

**Usage:**
```tsx
import Input from '@/components/ui/Input'

<Input
  label="Target URL"
  placeholder="https://example.com"
  leftIcon={<Globe />}
  error={errorMessage}
/>
```

### Select
Styled dropdown select component.

**Usage:**
```tsx
import Select from '@/components/ui/Select'

<Select label="Scan Mode">
  <option value="static">Static</option>
  <option value="dynamic">Dynamic</option>
</Select>
```

### Checkbox
Styled checkbox with label support.

**Usage:**
```tsx
import Checkbox from '@/components/ui/Checkbox'

<Checkbox
  label="I confirm ownership"
  checked={consent}
  onChange={(e) => setConsent(e.target.checked)}
/>
```

### Alert
Contextual feedback messages.

**Variants:** `info`, `success`, `warning`, `danger`

**Usage:**
```tsx
import Alert from '@/components/ui/Alert'

<Alert variant="danger" title="Error">
  Scan failed to complete
</Alert>
```

### Spinner
Loading indicator.

**Variants:** `primary`, `secondary`, `white`
**Sizes:** `sm`, `md`, `lg`, `xl`

**Usage:**
```tsx
import Spinner from '@/components/ui/Spinner'

<Spinner size="md" variant="primary" />
```

## Theme Utilities

### Gradient Backgrounds
- `bg-gradient-cyber` - Dark gradient
- `bg-gradient-scan` - Blue to purple
- `bg-gradient-danger` - Red gradient
- `bg-gradient-safe` - Green gradient

### Shadow Effects
- `shadow-cyber` - Blue glow shadow
- `shadow-cyber-lg` - Large blue glow
- `shadow-glow-blue` - Pulsing blue glow
- `shadow-glow-green` - Pulsing green glow
- `shadow-glow-red` - Pulsing red glow
- `shadow-glow-purple` - Pulsing purple glow

### Text Effects
- `glow-text` - Text with glow shadow
- `text-gradient` - Transparent text for gradients

### Animations
- `animate-pulse-slow` - Slow pulse
- `animate-scan` - Scanning animation
- `animate-glow` - Glow effect animation

## Design Principles

### 1. DRY (Don't Repeat Yourself)
All common patterns are extracted into reusable components. Use the component library instead of inline styles.

### 2. Consistent Spacing
Use Tailwind's spacing scale consistently:
- `gap-2`, `gap-3`, `gap-4` for flex/grid gaps
- `p-4`, `p-6`, `p-8` for padding
- `mt-2`, `mt-4`, `mt-6` for margins

### 3. Semantic Colors
Use semantic color names that convey meaning:
- `severity-critical` instead of `red-500`
- `status-safe` instead of `green-400`

### 4. Accessibility
- All interactive elements have proper focus states
- Color is not the only indicator (icons + text)
- Proper ARIA labels on buttons

### 5. Responsive Design
- Mobile-first approach
- Use `sm:`, `md:`, `lg:` breakpoints
- Grid layouts with responsive columns

## Usage Guidelines

### When to Use Each Component

**Buttons:**
- Primary: Main CTAs (Start Scan, Submit)
- Ghost: Navigation, less important actions
- Danger: Delete, cancel operations

**Cards:**
- Default: Standard content containers
- Glow: Important sections (scan form, recent scans)
- Bordered: List items with hover effects

**Badges:**
- Status indicators
- Severity levels
- Category tags

**Alerts:**
- Error messages (danger)
- Success confirmations (success)
- Important notices (warning)
- Informational tips (info)

## Example Implementations

### Dashboard Stats Card
```tsx
<Card variant="gradient" padding="md">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-medium text-cyber-gray-400">
        Total Scans
      </h3>
      <p className="text-3xl font-bold text-foreground mt-2">
        {totalScans}
      </p>
    </div>
    <Icon className="h-12 w-12 text-cyber-blue opacity-20" />
  </div>
</Card>
```

### Scan Form
```tsx
<Card variant="glow">
  <CardHeader>
    <CardTitle className="text-cyber-blue-light glow-text">
      Start New Scan
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <Input label="Target URL" placeholder="https://..." />
    <Select label="Scan Mode">
      <option>Static</option>
      <option>Dynamic</option>
    </Select>
    <Button variant="primary" className="w-full">
      Start Scan
    </Button>
  </CardContent>
</Card>
```

## Maintenance

### Adding New Colors
Add to `tailwind.config.ts` under `theme.extend.colors`

### Adding New Components
1. Create in `src/components/ui/`
2. Follow existing naming conventions
3. Export from `src/components/ui/index.ts`
4. Document in this file

### Updating Existing Components
- Maintain backward compatibility
- Update TypeScript types
- Test across all existing usages
