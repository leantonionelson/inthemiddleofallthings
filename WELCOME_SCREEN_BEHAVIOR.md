# Welcome Screen Behavior

## Overview
The Welcome Screen is a full-screen introductory overlay that appears on mobile devices to introduce users to the app's philosophy and purpose.

## Display Conditions

### When the Welcome Screen Appears

1. **First Visit**
   - Shows automatically when a user first visits the app
   - Tracked via `localStorage.getItem('welcomeIntroShown')`
   - Once shown, it won't appear again until localStorage is cleared (persists across browser sessions, same as reading progress)

2. **User Authentication Status**
   - Only shows for **non-authenticated users** (guests)
   - If a user is logged in, the welcome screen will **not** appear automatically
   - This prevents interrupting returning users who are already familiar with the app

3. **Device Type**
   - **Mobile only**: Shows on viewports < 1024px width
   - **Desktop**: Never shows on desktop (≥1024px width)
   - Desktop users see the welcome content in the "Welcome" section of the desktop landing page instead

4. **Manual Trigger**
   - Can be manually opened from the Settings page via "View Welcome Intro" button
   - Button only appears on mobile devices
   - Useful for users who want to revisit the introduction

### When the Welcome Screen Does NOT Appear

- User is logged in (authenticated)
- User is on desktop (viewport ≥ 1024px)
- User has already seen it before (stored in localStorage)
- User is on the `/desktop` route

## User Interactions

### Close Button (Top Right)
- **Always visible** in the top-right corner
- Pill-shaped button with X icon and "Close" text
- Clicking it:
  - Closes the welcome screen immediately
  - Sets `localStorage.setItem('welcomeIntroShown', 'true')`
  - Prevents the screen from showing again (persists across sessions, same as reading progress)

### Read More Section
- Initially, only the first portion of the welcome text is visible
- A "Read more" text link with down chevron appears below the initial content
- Clicking "Read more":
  - Expands to show the remaining welcome text
  - Smooth animation transition
  - The "Read more" link disappears once expanded
  - Content cannot be collapsed back

### Continue Button (Bottom Right)
- **Position**: Bottom-right corner (opposite the close button)
- **Visibility**: 
  - Hidden initially
  - Fades in when user scrolls to within 5% of the bottom of the content
  - Only becomes clickable when fully visible
- **Styling**: Glass button with right arrow icon (ChevronRight)
- **Behavior**:
  - Clicking it:
    - Closes the welcome screen
    - Sets `localStorage.setItem('welcomeIntroShown', 'true')`
    - Prevents the screen from showing again (persists across sessions, same as reading progress)

## Content Structure

### Initial Content (Always Visible)
- **Heading**: "Welcome"
- **Paragraph 1**: Introduction to the lens metaphor and "hardcoding"
- **Paragraph 2**: Discussion of lens atrophy and losing connection
- **Paragraph 3**: App as a tool for practice and rebalancing

### Expanded Content (After "Read more")
- **Paragraph 4**: The "middle" as the strongest vantage point
- **Paragraph 5**: The path of synthesis
- **Paragraph 6**: Introduction to two ways of seeing
- **List Item 1**: "Looking In" - seeing your own consciousness
- **List Item 2**: "Looking Out" - seeing the divine pattern in others
- **Paragraph 7**: Purpose and goal of the practice
- **Paragraph 8**: Final reflection on the text as a mirror

## Technical Details

### Local Storage
- **Key**: `'welcomeIntroShown'`
- **Value**: `'true'` (string)
- **Scope**: `localStorage` (persists across browser sessions, same as reading progress)
- **Purpose**: Prevents showing the intro to returning users who have already seen it
- **Alignment**: Uses same persistence as reading progress (`localStorage`), so if a user has reading progress stored, they won't see the welcome screen again

### Scroll Detection
- Tracks scroll progress through the content
- Calculates: `scrollTop / (scrollHeight - clientHeight)`
- Continue button appears when scroll progress ≥ 0.95 (95% scrolled)
- Updates dynamically as content expands (when "Read more" is clicked)

### Video Background
- Uses `/media/bg.mp4` for mobile (< 768px width)
- Uses `/media/bg-desktop.mp4` for larger mobile screens (≥ 768px width)
- Same video background as the rest of the app
- Glassy overlay applied for readability

### Text Formatting
- Supports markdown-style formatting:
  - `**text**` for bold
  - `*text*` for italics
- Properly renders quotes and special characters
- Left-aligned text for readability

## Settings Page Integration

### "View Welcome Intro" Button
- **Location**: Settings page → About section
- **Visibility**: Only on mobile devices (hidden on desktop)
- **Behavior**: 
  - Dispatches `'showWelcomeIntro'` custom event
  - App.tsx listens for this event and shows the welcome screen
  - Works even if the user has already seen it in the current session
  - Useful for users who want to revisit the introduction

## Edge Cases

1. **User logs in while welcome screen is open**
   - Welcome screen should close automatically (handled by App.tsx checking user state)

2. **User resizes window from mobile to desktop**
   - Welcome screen will not appear if already closed
   - If open, it will remain open but won't appear on future visits if resized to desktop

3. **Multiple tabs**
   - localStorage is shared across tabs
   - Showing in one tab prevents it from showing in other tabs
   - Consistent experience across all tabs

4. **Browser back/forward**
   - localStorage persists across navigation
   - If already shown, won't show again

5. **Clearing localStorage**
   - If user clears their localStorage (including reading progress), the welcome screen will show again
   - This makes sense as they're essentially starting fresh

## Future Considerations

- Could add a preference to "Always show on startup" for users who want to see it every time
- Could add analytics to track how many users read the full content vs. close early
- Could add a "Don't show again" checkbox that allows users to permanently dismiss it (currently persists automatically with localStorage)

