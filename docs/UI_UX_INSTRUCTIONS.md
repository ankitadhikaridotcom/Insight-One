# Frontend UI & UX Engineering Instructions

This document outlines the mandatory UI/UX standards, layout patterns, and component rules across the **Insight One** application.

---

## 1. Page Routing & Entry Experience

### Rule 1: Public Marketing Entry Point
- **Root URL (`/`)**: Must always render the public **Marketing Landing Page**.
- Features product overviews, multi-tenant agency benefits, live Kanban previews, and feature walkthroughs.
- Includes clear Call-to-Action (CTA) buttons: "Sign In" and "Launch Workspace" navigating to `/login`.
- **Admin & Operations Console (`/dashboard`, `/clients`, `/projects`, etc.)**: Restricted behind authentication.

---

## 2. Navigation & Sidebar Architecture

### Rule 2 & 3: Sidebar Profile Widget & Context Popover
- **Placement**: The logged-in user profile block must reside at the **bottom-left** of the sidebar navigation.
- **Trigger**: Clicking the user block toggles a rich context popover menu anchored above the button.
- **Menu Contents**:
  1. **User Identity Header**: Full name, email address, active role badge.
  2. **View Profile**: Opens the user profile modal.
  3. **Workspace Settings**: Direct link to `/settings`.
  4. **Sign Out**: Safely logs out the session and clears cached state.
- **Elimination of Duplicate Links**:
  - The standard sidebar module list **must NOT** contain "Settings" or "Logout".
  - These functions are consolidated within the profile popover to keep navigation clean and uncluttered.

---

## 3. Fixed Header Bar & Page Action Alignment

### Rule 4: Frozen Header & Top-Right Primary Actions
- **Sticky Positioning**: Every page header uses sticky positioning (`sticky top-0 z-30`) with a blur backdrop (`backdrop-blur-md bg-white/95`).
- **Layout Structure**:
  - **Left Section**: Workspace crumb, mobile menu toggle, and prominent `<h1>` page title.
  - **Right Section**: Primary page actions (e.g., "+ New Client", "+ Create Project", "+ Add Task", "Filter", "Export").
- **Consistency**: Page actions must never float inside the page body or beneath tables; they remain anchored in the top-right header corner for immediate access.

---

## 4. Pipeline Presentations (Kanban Boards)

### Rule 5: Kanban-First Workflow Presentation
- Workflows such as **Project Management** (`/projects`) and **Content Pipelines** (`/content`) must default to a **Kanban Board** view.
- **Columns**: Represent logical lifecycle stages (e.g., `Planning` → `In Progress` → `Review & QA` → `Completed`).
- **Card Contents**:
  - Entity code and title.
  - Priority badge (High, Medium, Low) with distinct color accents.
  - Progress indicators (progress bars or task completion counts).
  - Assigned team member avatars and due date indicators.
  - Quick action controls to advance or revert status.

---

## 5. Modal & Dialog Window Standard

### Rules 6 & 8: Large Dimensions with Three-Tier Fixed Architecture
When creating or editing entities (e.g., Clients, Tasks, Projects, Users):

```
+-------------------------------------------------------+
|  [FIXED HEADER] Modal Title & Subtitle             [X]|
+-------------------------------------------------------+
|                                                       |
|  [SCROLLABLE CONTENT AREA]                            |
|  - Multi-column inputs                                |
|  - Searchable dropdowns                               |
|  - Textareas & options                                |
|  (Only this central section scrolls)                  |
|                                                       |
+-------------------------------------------------------+
|  [FIXED FOOTER] Cancel            Submit / Save Action|
+-------------------------------------------------------+
```

1. **Large Dialog Dimensions**:
   - Modals must be set to `maxWidth="3xl"`, `"4xl"`, or `"5xl"`.
   - Narrow modals (`sm` / `md`) are reserved solely for simple confirmations (e.g., Delete Confirmation).
2. **Fixed Header**:
   - Stays pinned at the top (`shrink-0`). Contains the modal title, descriptive subtitle, and close button (`✕`).
3. **Scrollable Content**:
   - `flex-1 overflow-y-auto overscroll-contain`.
   - Only the form fields scroll when content exceeds viewport height.
4. **Fixed Footer**:
   - Stays pinned at the bottom (`shrink-0`).
   - Houses the secondary action (`Cancel`) and primary action (`Save Changes` / `Create Entity`).

---

## 6. Standard Searchable Dropdown (`SearchableSelect`)

### Rule 7: Universal Replacement of Native Dropdowns
- **Zero Native `<select>` Elements**: Standard HTML select elements provide poor UX, lack search capabilities, and cannot render rich metadata.
- **Component**: Use `@/components/searchable-select.tsx` across all forms.
- **Features Provided**:
  - Real-time search filtering across item labels and secondary descriptions.
  - Support for icons, status indicators, and keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
  - Clearable selection support.
  - Single and multi-select capability.
  - Asynchronous loading state indicators.

### Usage Example:
```tsx
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "Tenant Admin", label: "Tenant Admin", subLabel: "Full organization access" },
  { value: "content creator", label: "Content Creator", subLabel: "Produces content and manages tasks" },
  { value: "content approver", label: "Content Approver", subLabel: "Reviews and approves deliverables" },
  { value: "Viewer", label: "Viewer", subLabel: "Read-only workspace access" },
];

<SearchableSelect
  label="User Role"
  placeholder="Assign access role..."
  options={ROLE_OPTIONS}
  value={selectedRole}
  onChange={(val) => setSelectedRole(val)}
  required
/>
```

---

## 7. Unified Authentication Experience

### Rule 9: Single Login Form Without Role Tabs
- The login view (`/login`) must present a unified form for all users.
- **No separate tabs** for "Admin" and "Employee".
- The system checks credentials against Supabase / PostgreSQL profiles and dynamically retrieves the assigned role (`Role Host`, `Tenant Admin`, `content creator`, `content approver`, or `Viewer`).
- Navigation menus and route authorizations update automatically based on the resolved role.
