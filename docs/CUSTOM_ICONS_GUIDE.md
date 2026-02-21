# Custom Icons Guide

This guide explains how to create and implement custom icons to replace emojis in the Trading the Races application.

## Current Emoji Usage

The application currently uses emojis in several places:

1. **🏇** (horse racing) - Used in navbar, results pages, scripts
2. **🔍, ⚠️, 📍, ✅, ❌, 🎨, 🕐, 💡** - Used in console logging in scripts
3. **🥇, 🥈, 🥉** (medals) - Used for position badges in results and race viewer
4. **👤, 👨‍🏫** - Used in filter panels for jockey and trainer
5. **📊, 🟢, 🟡, 🟠** - Used in various UI components and weather badges
6. **🏆** - Used for finishing position filters

## Option 1: Custom SVG Icons (Recommended)

Create a reusable icon component system:

```typescript
// components/icons/RacingIcons.tsx
export const CustomHorseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
    {/* Add your custom SVG path here */}
  </svg>
);

export const CustomTrophyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C11.5 2 11 2.19 10.59 2.59L2 11.16L12 21L22 11.16L13.41 2.59C13 2.19 12.5 2 12 2Z" />
    {/* Add your custom SVG path here */}
  </svg>
);

// Export as a collection
export const RacingIcons = {
  Horse: CustomHorseIcon,
  Trophy: CustomTrophyIcon,
  // Add more custom icons
};
```

**Usage:**
```typescript
import { RacingIcons } from '@/components/icons/RacingIcons';

export default function MyComponent() {
  return (
    <div>
      <RacingIcons.Horse className="w-8 h-8 text-purple-600" />
      <RacingIcons.Trophy className="w-6 h-6 text-yellow-500" />
    </div>
  );
}
```

## Option 2: Custom Icon Font

Create your own icon font using tools like:

1. **IcoMoon** (https://icomoon.io/)
   - Upload custom SVGs
   - Generate a custom font
   - Get CSS and font files

2. **Fontello** (https://fontello.com/)
   - Similar to IcoMoon
   - Free and open source

**Implementation:**
```css
/* styles/custom-icons.css */
@font-face {
  font-family: 'TTR-Icons';
  src: url('/fonts/ttr-icons.woff2') format('woff2'),
       url('/fonts/ttr-icons.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}

.ttr-icon {
  font-family: 'TTR-Icons';
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
}

.ttr-icon-horse::before { content: '\e001'; }
.ttr-icon-trophy::before { content: '\e002'; }
```

**Usage:**
```tsx
<span className="ttr-icon ttr-icon-horse text-2xl"></span>
```

## Option 3: React Icon Library with Custom Icons

Extend existing icon libraries like `react-icons`:

```typescript
// components/icons/CustomIcons.tsx
import { IconType } from 'react-icons';

export const CustomHorseIcon: IconType = (props) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
    {...props}
  >
    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
  </svg>
);

export const CustomJockeyIcon: IconType = (props) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
    {...props}
  >
    {/* Your custom path */}
  </svg>
);
```

## Option 4: Image Sprites (For Pixel Art Style)

```typescript
// components/icons/SpriteIcon.tsx
interface SpriteIconProps {
  icon: 'horse' | 'trophy' | 'jockey' | 'trainer';
  size?: number;
}

export const SpriteIcon = ({ icon, size = 24 }: SpriteIconProps) => {
  const positions = {
    horse: '0 0',
    trophy: '-24px 0',
    jockey: '-48px 0',
    trainer: '-72px 0',
  };

  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: 'url(/images/icon-sprite.png)',
        backgroundPosition: positions[icon],
        backgroundSize: `${size * 4}px ${size}px`,
      }}
      role="img"
      aria-label={icon}
    />
  );
};
```

## Option 5: Design System Approach (Best for Consistency)

Create a centralized icon system:

```typescript
// lib/icons/index.tsx
import React from 'react';

export type IconName = 
  | 'horse'
  | 'trophy' 
  | 'jockey'
  | 'trainer'
  | 'track'
  | 'medal-gold'
  | 'medal-silver'
  | 'medal-bronze';

interface IconProps {
  name: IconName;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const iconPaths: Record<IconName, string> = {
  'horse': 'M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z',
  'trophy': 'M12 2C11.5 2 11 2.19 10.59 2.59L2 11.16L12 21L22 11.16L13.41 2.59C13 2.19 12.5 2 12 2Z',
  'jockey': 'M12 2C10.9 2 10 2.9 10 4s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 4c-1.1 0-2 .9-2 2v4h4V8c0-1.1-.9-2-2-2z',
  'trainer': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  'track': 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
};

export const Icon = ({ name, className = '', size = 'md' }: IconProps) => {
  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
};

// Convenience exports for common icons
export const HorseIcon = (props: Omit<IconProps, 'name'>) => <Icon name="horse" {...props} />;
export const TrophyIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trophy" {...props} />;
export const JockeyIcon = (props: Omit<IconProps, 'name'>) => <Icon name="jockey" {...props} />;
export const TrainerIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trainer" {...props} />;
```

**Usage:**
```tsx
import { Icon, HorseIcon, TrophyIcon } from '@/lib/icons';

export default function MyComponent() {
  return (
    <div>
      <HorseIcon size="lg" className="text-purple-600" />
      <TrophyIcon size="md" className="text-yellow-500" />
    </div>
  );
}
```

## Recommended Implementation: Design System Approach

This is the most maintainable and scalable solution:

### Step 1: Create Icon System Structure

```
tradingtheraces-tech/
├── lib/
│   └── icons/
│       ├── index.tsx           # Main icon system
│       ├── types.ts            # TypeScript types
│       └── icon-data.ts        # SVG path data
├── public/
│   └── icons-source/           # Original SVG files for editing
│       ├── horse.svg
│       ├── trophy.svg
│       └── ...
```

### Step 2: Implement the Icon System

```typescript
// lib/icons/types.ts
export type IconName = 
  | 'horse'
  | 'trophy' 
  | 'jockey'
  | 'trainer'
  | 'track'
  | 'medal-gold'
  | 'medal-silver'
  | 'medal-bronze'
  | 'warning'
  | 'check'
  | 'cross';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface IconProps {
  name: IconName;
  className?: string;
  size?: IconSize;
  'aria-label'?: string;
}
```

```typescript
// lib/icons/icon-data.ts
export const iconPaths: Record<string, string> = {
  // Racing-specific icons
  'horse': 'M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z',
  'trophy': 'M12 2C11.5 2 11 2.19 10.59 2.59L2 11.16L12 21L22 11.16L13.41 2.59C13 2.19 12.5 2 12 2Z',
  'jockey': 'M12 2C10.9 2 10 2.9 10 4s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 4c-1.1 0-2 .9-2 2v4h4V8c0-1.1-.9-2-2-2z',
  'trainer': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  'track': 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
};
```

```typescript
// lib/icons/index.tsx
import React from 'react';
import { IconProps, IconSize } from './types';
import { iconPaths } from './icon-data';

const sizeClasses: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

export const Icon = ({ 
  name, 
  className = '', 
  size = 'md',
  'aria-label': ariaLabel 
}: IconProps) => {
  const path = iconPaths[name];
  
  if (!path) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <path d={path} />
    </svg>
  );
};

// Convenience exports for common racing icons
export const HorseIcon = (props: Omit<IconProps, 'name'>) => <Icon name="horse" {...props} />;
export const TrophyIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trophy" {...props} />;
export const JockeyIcon = (props: Omit<IconProps, 'name'>) => <Icon name="jockey" {...props} />;
export const TrainerIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trainer" {...props} />;
```

### Step 3: Usage Examples

```tsx
// Basic usage
import { Icon, HorseIcon, TrophyIcon } from '@/lib/icons';

export default function MyComponent() {
  return (
    <div>
      <HorseIcon size="lg" className="text-purple-600" />
      <TrophyIcon size="md" className="text-yellow-500" />
    </div>
  );
}
```

```tsx
// Replace position emojis in components
// Before:
function getPositionEmoji(position: number): string {
  switch (position) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return '';
  }
}

// After:
import { GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon } from '@/lib/icons';

function getPositionIcon(position: number) {
  switch (position) {
    case 1: return <GoldMedalIcon size="md" />;
    case 2: return <SilverMedalIcon size="md" />;
    case 3: return <BronzeMedalIcon size="md" />;
    default: return <span className="text-gray-600">{position}</span>;
  }
}

// Usage in component
<div className="flex items-center gap-2">
  {getPositionIcon(runner.finishingPosition)}
  <span>{runner.horseName}</span>
</div>
```

## Color Customization

```tsx
// Different color schemes for different contexts
<HorseIcon className="text-purple-600" size="lg" />
<HorseIcon className="text-amber-500" size="lg" />
<HorseIcon className="text-gradient-to-r from-purple-600 to-pink-600" size="lg" />

// Dark mode support
<HorseIcon className="text-gray-900 dark:text-white" size="lg" />

// State-based colors
<Icon 
  name="check" 
  className={isSuccess ? "text-green-600" : "text-gray-400"} 
  size="md" 
/>
```

## Testing Your Custom Icons

```typescript
// components/icons/__tests__/Icon.test.tsx
import { render } from '@testing-library/react';
import { Icon, HorseIcon } from '../index';

describe('Icon Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Icon name="horse" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container } = render(<Icon name="horse" size="lg" />);
    expect(container.querySelector('svg')).toHaveClass('w-8', 'h-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Icon name="horse" className="text-purple-600" />);
    expect(container.querySelector('svg')).toHaveClass('text-purple-600');
  });

  it('convenience exports work', () => {
    const { container } = render(<HorseIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

## Migration Checklist

When you're ready to implement custom icons:

- [ ] Set up icon system structure (lib/icons/)
- [ ] Design custom icons in your preferred tool
- [ ] Export and optimize SVGs
- [ ] Extract SVG path data
- [ ] Add paths to icon-data.ts
- [ ] Test icon component with one example
- [ ] Create convenience exports for common icons
- [ ] Document usage in this file
- [ ] Gradually replace emojis component by component
- [ ] Test accessibility (screen readers, keyboard nav)
- [ ] Test in different browsers
- [ ] Test on mobile devices
- [ ] Update design system documentation
- [ ] Celebrate! 🎉
