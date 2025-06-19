# Map Theme Toggle Feature

## Overview

The Map Theme Toggle feature allows users to independently control the map theme,
switching between light and dark maps regardless of the overall application theme.
Users can now use dark maps in light mode or light maps in dark mode for optimal
visibility and personal preference.

## Features

- **Independent Control**: Map theme can be toggled independently from the
  overall application theme
- **Universal Availability**: Works in both light and dark UI modes
- **Persistent Preferences**: User's map theme preference is saved in localStorage
- **Theme-Aware Button**: The toggle button shows different icons based on
  current map theme
- **Automatic Updates**: Map theme updates immediately when toggled
- **Clear Visual Feedback**: Sun icon for light maps, moon icon for dark maps

## Components

### 1. `createMapThemeToggle.js`

**Purpose**: Creates the toggle button and manages map theme preferences

**Key Functions**:

- `getMapThemeInverted()`: Gets current map theme preference  
  (true = dark map, false = light map)
- `setMapThemeInverted(inverted)`: Sets map theme preference and triggers updates
- `createMapThemeToggle()`: Creates the interactive toggle button

**Storage**: Uses `ffv-map-theme-inverted` localStorage key  
(true = dark map, false = light map)

### 2. `updateMapTheme.js` (Enhanced)

**Purpose**: Applies map theme based on user's map preference only

**Behavior**:

- **Dark Map Preference**: Applies CSS filter inversion regardless of UI theme
- **Light Map Preference**: No filter applied, standard map colors

### 3. CSS Styling

**Location**: `style.css`

**Key Styles**:

```css
.map-theme-toggle {
    /* Consistent sizing with other map action buttons */
    min-height: 38px;
    font-size: 15px;
    font-weight: 600;
}

.map-theme-toggle .icon svg {
    stroke: currentcolor;
    transition: stroke 0.2s ease;
}
```

## User Interface

### Button States

1. **Dark Map Theme**:

    - Icon: Moon/crescent icon
    - State: Active (highlighted)
    - Tooltip: "Map: Dark theme (click for light theme)"

2. **Light Map Theme**:
    - Icon: Sun/brightness icon
    - State: Normal
    - Tooltip: "Map: Light theme (click for dark theme)"

**Note**: Button is available in both light and dark UI modes

### Button Location

The toggle button appears as the first control in the map controls area alongside:

- Export GPX button
- Elevation Profile button
- Marker Count selector

## User Workflow

1. **Default State**: Dark map theme by default for better contrast
2. **Toggle to Light**: Click to switch to light map colors
3. **Visual Feedback**: Button state and icon change to reflect current map theme
4. **Persistence**: Preference is saved and restored on next session
5. **Universal Access**: Works in both light and dark UI themes
6. **Independent Control**: Map theme preference is separate from UI theme

## Technical Implementation

### Event Flow

```text
User clicks toggle → setMapThemeInverted() → localStorage update →
mapThemeChanged event → updateMapTheme() → CSS filter applied
```

Custom event dispatch → updateMapTheme() → CSS filter applied/removed

### Integration Points

- **Map Rendering**: Added to `renderMap.js` controls
- **Global Utilities**: Exported through `utils.js`
- **Theme System**: Integrates with existing theme change events

### CSS Filter Applied

```css
filter: invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1);
```

## Benefits

1. **User Choice**: Accommodates different user preferences for map visibility
2. **Accessibility**: Some users find inverted maps harder to read
3. **Context Sensitivity**: Map readability may vary based on content
4. **Non-Disruptive**: Maintains dark UI theme while allowing map customization

## Future Enhancements

Potential improvements could include:

- Additional map theme options (high contrast, custom filters)
- Per-file map theme preferences
- Automatic theme detection based on map content
- Integration with system accessibility preferences
