# Material-UI Migration Plan for Carpool Coordination App

## Initial Analysis

### Current Application Structure
Based on the codebase analysis, this is a carpool coordination application with the following key components:

**Core Files:**
- `src/App.tsx` - Main application component (not visible but referenced)
- `src/types.ts` - TypeScript interfaces for Event, Participant, Carpool, etc.
- `src/components/DriverRemovalModal.tsx` - Modal for driver removal functionality
- `src/utils/driverRemoval.ts` - Business logic for driver removal

**Current Tech Stack:**
- React + TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

## Component Mapping for MUI Migration

### Priority 1: Main Application Components (Medium Impact)

#### 1. App.tsx (Main Layout)
**Current Implementation:** Unknown structure (file not visible)
**MUI Replacements Likely Needed:**
- `AppBar` or `Toolbar` (if header exists)
- `Container` or `Box` (layout containers)
- `Grid` or `Stack` (layout organization)
- `Card` + `CardContent` (content containers)
- `Fab` or `Button` (floating action buttons)
- `Drawer` (if sidebar navigation exists)

### Priority 2: Form and Input Components (Medium Impact)

#### 2. Form Elements (Assumed from types)
**MUI Replacements:**
- `TextField` (text inputs)
- `Select` + `MenuItem` (dropdowns for role selection)
- `DatePicker` + `TimePicker` (date/time inputs)
- `FormControl` + `FormLabel` (form organization)
- `RadioGroup` + `Radio` (role selection)
- `Autocomplete` (location inputs)

### Priority 3: Data Display Components (Low Impact)

#### 3. List and Card Components
**MUI Replacements:**
- `List` + `ListItem` + `ListItemText` (participant lists)
- `Card` + `CardHeader` + `CardContent` + `CardActions` (carpool cards)
- `Chip` (status indicators, roles)
- `Avatar` (user representations)
- `Badge` (notification counts)

### Priority 4: Navigation and Layout (Low Impact)

#### 4. Navigation Elements
**MUI Replacements:**
- `BottomNavigation` (if mobile navigation exists)
- `Tabs` + `Tab` (if tabbed interface exists)
- `Breadcrumbs` (if breadcrumb navigation exists)
- `Stepper` (if multi-step processes exist)

### Priority 5: Core Modal Components (High Impact)

#### 5. DriverRemovalModal.tsx
**Current Implementation:** Custom modal with Tailwind classes
**MUI Replacement:**
- `Dialog` (main modal container)
- `DialogTitle` (modal header)
- `DialogContent` (modal body)
- `DialogActions` (modal footer with buttons)
- `IconButton` (close button)
- `TextField` (multiline for reason input)
- `Checkbox` + `FormControlLabel` (confirmation checkbox)
- `Button` (action buttons)
- `Alert` or `Paper` (warning/info boxes)
- `Typography` (text elements)
- `List` + `ListItem` (restriction lists)

**Customizations Needed:**
- Color scheme alignment (red for warnings, blue for info)
- Spacing adjustments to match current layout
- Icon integration from MUI icons vs Lucide

## Custom Elements Requiring Special Attention

### 1. Time-based Warning System
**Current:** Custom styling with Tailwind color classes
**MUI Approach:** Use `Alert` component with different severity levels
- `severity="warning"` for 24-hour warnings
- `severity="error"` for 2-hour warnings
- `severity="info"` for general information

### 2. Role-based UI Elements
**Current:** Custom styling based on participant roles
**MUI Approach:** Use `Chip` with different colors and variants
- Different colors for drive-both, drive-to, drive-from, passenger
- Custom styling with MUI theme customization

### 3. Notification System
**Current:** Custom notification structure
**MUI Approach:**
- `Snackbar` + `Alert` for toast notifications
- `Badge` for notification counts
- `List` + `ListItem` for notification history

## Installation Requirements

```bash
npm add @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-date-pickers
