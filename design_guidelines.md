# Design Guidelines: Auth Development Sandbox

## Design Approach
**System-Based Approach**: Clean, functional design optimized for developer testing and debugging workflows. Drawing from Material Design principles with emphasis on clarity and usability over visual flair.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary** (developer-friendly):
- Background: 220 15% 12%
- Surface: 220 15% 16%
- Primary Action: 217 91% 60%
- Success: 142 76% 45%
- Error: 0 84% 60%
- Text Primary: 220 15% 95%
- Text Secondary: 220 10% 70%

**Light Mode** (optional toggle):
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary Action: 217 91% 50%
- Success: 142 71% 45%
- Error: 0 72% 51%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 45%

### B. Typography
- **Primary Font**: Inter or System UI stack (-apple-system, BlinkMacSystemFont, "Segoe UI")
- **Headings**: 600 weight, tight leading (1.2)
- **Body**: 400 weight, relaxed leading (1.6)
- **Code/Monospace**: "Fira Code" or "JetBrains Mono" for IDs, tokens, JSON responses

### C. Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12 for consistency
- Component padding: p-6 to p-8
- Section spacing: gap-4 to gap-6
- Form field gaps: space-y-4
- Container max-width: max-w-2xl (centered for readability)

### D. Component Library

**Forms & Auth UI**:
- Input fields: Dark backgrounds (surface color), 1px border, rounded-lg, focus ring with primary color
- Labels: Text-sm, font-medium, mb-2
- Buttons: Primary (filled), Secondary (outline), rounded-lg, px-6 py-3
- Error states: Red border + error message text below field
- Success states: Green checkmark icon + success message

**Testing Interface**:
- Request/Response panels: Monospace font, JSON syntax highlighting (use <pre> with background)
- Status indicators: Badge components (green=success, red=error, blue=info)
- Action buttons: Clear CTAs with loading states (spinner icon)
- Session display: Card component showing user ID, email, expiry timestamp

**Feedback Components**:
- Toast notifications: Fixed bottom-right position for auth feedback
- Loading states: Subtle spinner on buttons, skeleton for data loading
- Empty states: Centered icon + message for no session/logged out

**Developer Features**:
- Clear data button: Destructive red outline style
- Copy to clipboard: Icon button for IDs, tokens
- Toggle dark/light mode: Top-right corner switch

### E. Layout Structure

**Single Page Layout** (public/auth.html):
- Header: App title "Auth Sandbox" + mode toggle
- Main Content Area (centered, max-w-2xl):
  - Authentication Forms Section (tabs or stacked cards)
    - Signup form card
    - Login form card  
    - Logout button (when authenticated)
  - Session Status Panel
    - Current user display (if logged in)
    - Session expiry countdown
    - User details in code block
  - Test Response Area
    - Last API response (collapsible JSON viewer)
    - Request/response logs

**Spacing**: py-12 on main container, gap-8 between major sections

### F. Interaction Patterns
- Form submission: Disable button + show spinner during request
- Success flow: Green toast → auto-update session panel
- Error flow: Red toast + inline field errors
- Logout: Confirm modal → clear session → show logged-out state
- Copy actions: Click icon → brief "Copied!" tooltip

## Images
No hero images needed - this is a functional testing interface. Use simple iconography for visual hierarchy (lock icon for auth, user icon for profile, etc.)