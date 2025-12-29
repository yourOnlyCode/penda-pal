# Penda Design System

## Design Philosophy

Penda combines **modern minimalism** with **playful personality** - think Vercel's clean aesthetic meets cute panda vibes.

### Core Principles
1. **Clean & Professional** - Inspired by Vercel, Stripe, Linear
2. **Playful Touches** - Subtle animations, cute emojis, friendly copy
3. **Accessible First** - WCAG AA compliant, keyboard navigation
4. **Mobile Optimized** - Touch-friendly, responsive design

## Color Palette

### Primary (Purple)
- **Primary**: `hsl(262, 83%, 58%)` - Main brand color (panda purple)
- Used for: CTAs, links, active states, verification badges

### Neutrals
- **Background**: White / Dark gray
- **Foreground**: Near-black / Near-white
- **Muted**: Light gray for secondary text
- **Border**: Subtle gray borders

### Semantic Colors
- **Destructive**: Red for errors, blocks, reports
- **Success**: Green for verified badges, success states
- **Warning**: Orange for warnings, disclaimers

## Typography

### Font Family
- **Primary**: Inter (system font stack)
- Clean, modern, highly readable

### Scale
- **Display**: 3.75rem (60px) - Hero headings
- **H1**: 2.25rem (36px) - Page titles
- **H2**: 1.875rem (30px) - Section headings
- **H3**: 1.5rem (24px) - Card titles
- **Body**: 1rem (16px) - Default text
- **Small**: 0.875rem (14px) - Captions, metadata

### Weight
- **Bold**: 700 - Headings, CTAs
- **Semibold**: 600 - Subheadings
- **Medium**: 500 - Buttons
- **Regular**: 400 - Body text

## Components

### Buttons
```tsx
<Button>Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button size="lg">Large CTA</Button>
```

**Variants:**
- `default` - Purple background, white text (primary actions)
- `outline` - Border only (secondary actions)
- `ghost` - No background (tertiary actions)
- `destructive` - Red (delete, block, report)

**Sizes:**
- `sm` - Compact buttons
- `default` - Standard size
- `lg` - Hero CTAs, important actions

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Usage:**
- Feature cards on landing page
- Penpal profile cards
- Message bubbles (custom styled)
- Settings panels

### Avatars
```tsx
<Avatar>
  <AvatarImage src={user.image} />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**Sizes:**
- Small: 32px (message list)
- Medium: 40px (default)
- Large: 64px (profile pages)
- XL: 128px (profile headers)

## Spacing System

Based on 4px grid:
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)

## Border Radius

- `sm`: 0.25rem (4px) - Small elements
- `md`: 0.375rem (6px) - Buttons, inputs
- `lg`: 0.5rem (8px) - Cards, modals
- `full`: 9999px - Avatars, pills, badges

## Shadows

- `sm`: Subtle elevation (cards)
- `md`: Medium elevation (dropdowns)
- `lg`: High elevation (modals)
- `xl`: Maximum elevation (popovers)

## Animations

### Micro-interactions
- Button hover: Scale 1.02, duration 150ms
- Card hover: Shadow increase, duration 200ms
- Link hover: Underline slide-in, duration 150ms

### Page Transitions
- Fade in: Opacity 0 → 1, duration 300ms
- Slide up: Transform Y 20px → 0, duration 400ms

### Fun Touches
- Panda emoji bounce on landing page
- Sticker pop animation when sent
- Typing indicator pulse
- New message slide-in

## Iconography

### Library: Lucide React
Modern, consistent, 24px base size

**Common Icons:**
- `MessageCircle` - Chat, messaging
- `Heart` - Favorites, likes
- `Shield` - Security, verification
- `Globe` - International, matching
- `Sparkles` - Premium, special features
- `Zap` - Quick actions, speed
- `User` - Profile, account
- `Settings` - Configuration
- `LogOut` - Sign out

## Layout Patterns

### Container
- Max width: 1400px
- Padding: 2rem (32px)
- Centered with `mx-auto`

### Grid
- 12-column grid
- Gap: 2rem (32px)
- Responsive breakpoints:
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3-4 columns

### Navigation
- Fixed header on scroll
- Transparent → solid background
- Height: 64px
- Blur backdrop effect

## Page-Specific Designs

### Landing Page
- Hero with gradient background
- Grid pattern overlay (subtle)
- Feature cards in 3-column grid
- CTA section with muted background
- Minimal footer

### Chat Interface
- Full-height layout
- Fixed header (penpal info)
- Scrollable message area
- Fixed input at bottom
- Sidebar for stickers (slide-in)

### Dashboard
- Status card (waiting/matched)
- Penpal card with avatar
- Quick actions (message, cancel)
- Verification banner (if not verified)

### Onboarding
- Multi-step form
- Progress indicator
- Large input fields
- Friendly copy
- Cute illustrations

## Cute Touches

### Emojis
- 🐼 - Brand mascot (everywhere!)
- ✨ - Premium features
- 💬 - Messaging
- 🌍 - Global connections
- 🎉 - Success states
- 💝 - Meaningful connections

### Copy Tone
- Friendly, not corporate
- Encouraging, not pushy
- Clear, not technical
- Fun, not childish

**Examples:**
- "Your penpal is waiting!" (not "Match pending")
- "Let's get to know you" (not "Complete profile")
- "Oops! Something went wrong" (not "Error 500")

### Loading States
- Cute panda animation
- "Finding your penpal..." with dots
- Skeleton screens (not spinners)

### Empty States
- Friendly illustrations
- Helpful copy
- Clear next action
- Never just "No data"

## Accessibility

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Interactive elements meet AAA (7:1)

### Keyboard Navigation
- All actions keyboard accessible
- Visible focus indicators
- Logical tab order

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Live regions for updates

### Motion
- Respect `prefers-reduced-motion`
- Disable animations if requested
- No auto-playing videos

## Dark Mode

Full dark mode support:
- Inverted color scheme
- Reduced contrast for comfort
- Adjusted shadows
- Same brand colors

Toggle in settings, respects system preference.

## Responsive Breakpoints

- `sm`: 640px - Mobile landscape
- `md`: 768px - Tablet
- `lg`: 1024px - Desktop
- `xl`: 1280px - Large desktop
- `2xl`: 1536px - Extra large

## Component Library

All components built with:
- **shadcn/ui** - Base components
- **Radix UI** - Primitives (accessible)
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations (future)
- **Lucide React** - Icons

## Design Resources

- Figma file: (to be created)
- Component storybook: (future)
- Brand assets: (future)

## Future Enhancements

- [ ] Custom panda illustrations
- [ ] Animated sticker packs
- [ ] Theme customization
- [ ] Profile backgrounds
- [ ] Chat themes
- [ ] Sound effects (optional)
