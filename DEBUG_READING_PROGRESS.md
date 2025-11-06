# Debug Reading Progress Tracking

## Quick Checklist

### 1. Restart Dev Server
The changes require a fresh build. Run:
```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### 2. Clear Browser Cache
- Open DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- OR: DevTools → Application → Storage → Clear site data

### 3. Check Browser Console
Open DevTools Console (F12) and look for:
- Red error messages
- "Meditation marked as read" logs (when scrolling to bottom)
- Any errors related to `useScrollTracking` or `readingProgressService`

## Testing Steps

### Test Meditation Tracking

1. **Go to Meditations** (`/meditations`)
2. **Open any meditation** (click on a meditation)
3. **Open DevTools Console** (F12 → Console tab)
4. **Scroll down slowly** to about 50% of the content
5. **Check localStorage**:
   - DevTools → Application tab → Storage → Local Storage
   - Look for key: `readingProgress`
   - Should see JSON with your meditation ID and progress ~50

6. **Navigate to Homepage** (`/`)
7. **Look for "Continue Reading Meditations"** section
   - Should appear below the main "Continue Reading" button
   - Should show your meditation with progress bar at ~50%

### Test Read Status

1. **Go back to the meditation**
2. **Scroll all the way to the bottom**
3. **Check console** - should see: `Meditation marked as read: [title]`
4. **Go to meditations list**
5. **Look for green checkmark** next to the meditation you read
6. **Look for "Read" label** in green text

### Test Continue Reading Navigation

1. **From homepage**, click the Continue Reading card
2. Should navigate to that meditation
3. Content should appear

## Manual localStorage Check

Open DevTools Console and run:

```javascript
// Check if tracking is working
JSON.parse(localStorage.getItem('readingProgress'))

// Should output something like:
// {
//   "meditation-id-123": {
//     "id": "meditation-id-123",
//     "type": "meditation",
//     "isRead": false,
//     "lastPosition": 47,
//     "lastReadDate": "2025-01-01T12:00:00.000Z",
//     "readCount": 0
//   }
// }
```

## Common Issues

### Issue 1: Continue Reading Not Showing
**Symptoms:** Homepage looks the same, no Continue Reading sections
**Causes:**
- No content has been partially read yet (must scroll to 5-95%)
- Dev server not restarted after code changes
- Browser cache showing old version

**Fix:**
1. Restart dev server
2. Hard refresh browser (Ctrl+Shift+R)
3. Scroll through a meditation to ~50%
4. Return to homepage

### Issue 2: Tracking Not Saving
**Symptoms:** localStorage stays empty, no progress saved
**Causes:**
- Browser has localStorage disabled
- Console showing errors
- Content ref not attached properly

**Fix:**
1. Check console for errors
2. Test localStorage: `localStorage.setItem('test', '1')`
3. Check if scrolling the main content area (not the window)

### Issue 3: Green Checkmarks Not Appearing
**Symptoms:** Scrolled to bottom but no checkmark
**Causes:**
- Didn't scroll far enough (needs 95%+)
- Component not re-rendering after marking as read

**Fix:**
1. Ensure you scroll all the way to bottom
2. Wait 1 second for tracking to save
3. Navigate away and back to trigger re-render

## Verify Files Are Updated

Check these files have the latest changes:

### HomePage.tsx
```bash
grep -n "useMemo" src/pages/Home/HomePage.tsx
```
Should show:
- Line 1: import with useMemo
- Line 274: const continueMeditations = useMemo(
- Line 291: const continueStories = useMemo(

### MeditationsPage.tsx
```bash
grep -n "useScrollTracking" src/features/Meditations/MeditationsPage.tsx
```
Should show:
- Line 9: import useScrollTracking
- Line 288: useScrollTracking({

## Force Reset (If All Else Fails)

```javascript
// In browser console, clear all progress and start fresh
localStorage.removeItem('readingProgress');
location.reload();
```

Then test again from scratch.

## Expected Behavior Summary

1. **While Reading:**
   - No visible UI changes
   - Progress silently saved to localStorage every 5% scrolled
   - Console logs when reaching bottom

2. **On Homepage:**
   - "Continue Reading" sections appear when items are 5-95% read
   - Shows title, progress bar, and percentage
   - Sections hidden if no items in progress

3. **In Lists:**
   - Green checkmark badge on icon
   - "Read" label in green text
   - Only for items scrolled to 95%+

4. **Navigation:**
   - Clicking Continue Reading card navigates to content
   - Content index is restored
   - Scroll position may restore (depending on implementation)

