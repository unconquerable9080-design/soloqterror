# League of Legends Player Tracker - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Fluent Design) + Gaming Dashboard Aesthetic

This monitoring application requires information density, real-time updates, and quick scanning. Drawing inspiration from modern dashboards (Linear, Discord) with gaming sensibilities appropriate for League of Legends tracking.

**Core Principles:**
- Information hierarchy that prioritizes active states over idle
- Immediate visual feedback for game status changes
- Scannable player list with clear status differentiation
- Gaming aesthetic that feels professional, not gimmicky

---

## Typography System

**Font Families:**
- Primary: Inter (Google Fonts) - for UI elements, player names, labels
- Monospace: JetBrains Mono (Google Fonts) - for match IDs, timestamps, statistics

**Type Scale:**
- Hero/Page Title: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Player Names: text-lg font-medium (18px)
- Body Text: text-base font-normal (16px)
- Metadata/Stats: text-sm font-normal (14px)
- Timestamps: text-xs font-mono (12px)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4, p-6
- Section gaps: gap-4, gap-6
- Margins: m-2, m-4, m-8
- Icon spacing: mr-2, ml-2

**Grid Structure:**
- Container: max-w-7xl mx-auto px-4
- Dashboard Layout: Single column on mobile, becomes a monitoring layout on desktop
- Player Cards: Full width mobile (w-full), grid on desktop (grid-cols-2 lg:grid-cols-3)

---

## Component Library

### 1. Header/Navigation
- Fixed top bar with app title "LoL Player Tracker"
- Add Player button (prominent, always accessible)
- Minimal, focused - no excessive navigation elements

### 2. Player Addition Section
- Prominent card at top of dashboard
- Input field (full width mobile, max-w-md desktop)
- Primary action button positioned inline with input
- Clear placeholder text: "Enter Summoner Name..."
- Validation feedback area below input

### 3. Player Status Cards
**Structure:**
- Grid layout: grid gap-4
- Each card contains:
  - Player name (prominent, left-aligned)
  - Current status badge (top-right or below name)
  - Last activity timestamp (text-xs, bottom)
  - Action menu (icon button, top-right corner)
  
**Status Badge System:**
- "Idle" state
- "Just Finished" state (most prominent)
- "On Losing Streak" state (with streak number if applicable)
- Badge positioning: inline with player name or as separate row

**Card Interaction:**
- Entire card clickable to view details
- Subtle hover elevation (shadow-md to shadow-lg transition)
- Remove/manage button (icon only, subtle)

### 4. Notification System
**Toast Notifications:**
- Fixed position: top-right corner (top-4 right-4)
- Stacked vertically with gap-2
- Auto-dismiss after 5 seconds
- Icon + player name + event message
- Slide-in animation from right
- Close button (x icon)

**Notification Types:**
- Game Finished: "Player X just finished a game!"
- Losing Streak: "Player X is on a 3-game losing streak"

### 5. Player Detail Modal/Panel
**Trigger:** Click on player card

**Structure:**
- Modal overlay (fixed, centered) OR slide-in panel from right
- Header: Player name + close button
- Sections:
  - Recent Match Statistics (grid of key stats)
  - Timeline Data Display (if available)
  - Match History (last 5-10 games with W/L indicators)
  
**Content Layout:**
- Stats Grid: 2-3 columns on desktop (grid-cols-2 md:grid-cols-3)
- Each stat: Label (text-sm) + Value (text-2xl font-bold)
- Timeline data: Formatted JSON or key-value pairs

### 6. Empty States
**No Players Added:**
- Centered message with instructional copy
- Large icon (from Heroicons: UserGroupIcon or ChartBarIcon)
- "Add your first player to start tracking" message
- Pointer to Add Player input

**Loading States:**
- Skeleton screens for player cards during initial load
- Spinner for individual card updates
- Pulse animation on cards being polled

### 7. Status Indicators
**Visual System:**
- Dot indicators (w-2 h-2 rounded-full) paired with text
- Icon system using Heroicons:
  - Idle: MinusCircleIcon
  - Just Finished: CheckCircleIcon
  - Losing Streak: ExclamationTriangleIcon

### 8. Statistics Display
**Match Timeline Stats:**
- Two-column layout (Label: Value)
- Grouped by category (Combat, Vision, Economy)
- Monospace font for numerical values
- Clear visual separation between groups (border-t pt-4)

---

## Icon Library

**Selected Library:** Heroicons (via CDN)

**Core Icons:**
- UserPlus: Add player button
- XMark: Close/remove actions  
- Bell: Notification indicator
- ChartBar: Statistics/timeline
- ExclamationTriangle: Warning/losing streak
- CheckCircle: Success/game finished
- Clock: Timestamp/last updated
- Trash: Delete player
- EllipsisVertical: Card menu

---

## Animations

**Minimal, Purposeful Animations:**
- Card hover: transition-shadow duration-200
- Notification entrance: slide + fade-in (CSS keyframe)
- Status badge pulse: animate-pulse (only for "Just Finished" state, temporary)
- Modal/panel: slide-in transition (300ms ease-out)

**NO animations for:**
- Background effects
- Continuous/looping animations
- Scroll-triggered effects
- Page transitions

---

## Accessibility

- All interactive elements have proper focus states (focus:ring-2)
- Status information communicated with icons + text (not color alone)
- Modal/panel includes proper focus trap
- Toast notifications use appropriate ARIA roles
- Form inputs have associated labels (can be sr-only if design requires)
- Sufficient color contrast (4.5:1 minimum for text)
- Keyboard navigation support for all interactions

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column layout
- Full-width player cards
- Stacked form elements
- Bottom-sheet style detail view instead of modal

**Tablet (768px - 1024px):**
- 2-column player card grid
- Modal detail view (centered)

**Desktop (> 1024px):**
- 3-column player card grid
- Side panel option for detail view (slide from right)
- More spacious padding and gaps

---

## Information Architecture

**Dashboard Hierarchy:**
1. **Header** (sticky, h-16)
2. **Add Player Section** (prominent card, mb-8)
3. **Players Grid** (main content area)
   - Active/Just Finished players sorted to top
   - Losing streak players highlighted
   - Idle players below
4. **Notifications** (overlay, non-blocking)

**Player Card Priority Order:**
1. Just Finished (most recent first)
2. On Losing Streak (longest streak first)
3. Idle (alphabetical or by last activity)

---

## Special Considerations

**Real-Time Updates:**
- Polling indicator: Subtle animated dot in header
- Last sync timestamp in footer or header
- Visual feedback when player status changes (brief highlight/flash)

**Rate Limit Awareness:**
- Optional: Progress indicator showing polling cycle
- "Next check in X seconds" timestamp per player (subtle, text-xs)

**Error States:**
- API key expired warning (prominent banner)
- Player not found feedback (inline with form)
- Failed to fetch status (replace card content with retry button)

**Data Density:**
- Balance between information and whitespace
- Use consistent card heights for scannable grid
- Expandable sections for detailed timeline data (accordion pattern)

This design creates a focused, efficient monitoring dashboard with gaming-appropriate aesthetics, clear status hierarchy, and responsive real-time feedback - perfect for tracking League of Legends players at a glance.