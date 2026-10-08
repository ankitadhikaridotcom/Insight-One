# Role & Permissions Matrix (RBAC)

This document specifies the authorization architecture, the 5 platform roles, granular permission scopes, and role-to-menu bindings for **Insight One**.

---

## 1. System Roles Definition

| Role Key | Display Name | Purpose & Hierarchy Level |
| :--- | :--- | :--- |
| **`Role Host`** | Platform Host / Super Admin | The global operator of the entire SaaS platform. Can manage tenants, global configurations, and all subsystem functions. |
| **`Tenant Admin`** | Workspace Administrator | The chief administrator of an individual tenant organization. Full access to their tenant's agencies, team members, billing, and settings. |
| **`content creator`** | Content Creator / Producer | Operational team member responsible for drafting posts, designing creative assets, updating assigned tasks, and tracking project deliverables. |
| **`content approver`** | Content Approver / Strategist | Senior editor or account lead responsible for QA, editorial approvals, client sign-offs, and publishing schedules. |
| **`Viewer`** | Read-Only Observer | Client stakeholder, guest, or executive with read-only visibility into dashboards, analytics, reports, and calendar schedules. |

---

## 2. Granular Permission Scopes

Scopes follow a standard `<module>.<action>` dot-notation. All database RPC functions check for specific scopes via `fn_get_request_context(p_function_name)`:

### 2.1. System & Tenant Management
- `*`: Global wildcard (reserved for `Role Host`).
- `tenant.manage`: Update tenant details, settings, and subscription plans.
- `tenant.audit`: View tenant error logs and security audit trails.
- `agency.manage`: Create and manage agencies within the tenant.

### 2.2. Team & User Administration
- `team.read`: View team member roster and profile details.
- `team.create`: Register new users and issue initial credentials.
- `team.update`: Update member titles, departments, and reset passwords.
- `team.delete`: Deactivate team member access.

### 2.3. Clients & Social Profiles
- `client.read`: View client lists, company info, and assigned agencies.
- `client.create`: Onboard new clients into an agency.
- `client.update`: Edit client contracts, values, notes, and contacts.
- `client.delete`: Archive or deactivate client records.
- `social.manage`: Connect and configure client social media channels.

### 2.4. Projects & Tasks
- `project.read`: View projects in Kanban and list formats.
- `project.create`: Create new projects with deadlines and milestones.
- `project.update`: Update project statuses, progress, and managers.
- `project.delete`: Remove or archive projects.
- `task.read`: View tasks and assignments.
- `task.create`: Create tasks for team members.
- `task.update`: Move tasks across Kanban stages or change assignments.
- `task.delete`: Delete tasks.

### 2.5. Content Pipeline & Approvals
- `content.read`: View content calendar and idea board.
- `content.create`: Draft new content pieces, topics, and copy.
- `content.update`: Edit draft copy, platform tags, and schedules.
- `content.review`: Move content through internal review stages.
- `content.approve`: Issue final editorial and client approvals.
- `content.publish`: Mark content as published or trigger publishing APIs.
- `content.delete`: Delete content entries.

### 2.6. Analytics, Networking & Reporting
- `analytics.read`: View engagement dashboards and follower metrics.
- `networking.manage`: Manage industry networking leads and follow-ups.
- `reports.generate`: Generate and export weekly/monthly performance reports.

---

## 3. Role-to-Scope Mapping Matrix

| Scope Key | Role Host | Tenant Admin | content creator | content approver | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `*` (Wildcard) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `tenant.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `agency.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `team.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `team.create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `team.update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `team.delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `client.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `client.create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `client.update` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `social.manage` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `project.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `project.create` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `project.update` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `task.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `task.create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `task.update` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `content.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `content.create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `content.update` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `content.review` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `content.approve` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `content.publish` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `analytics.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `networking.manage` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `reports.generate` | ✅ | ✅ | ❌ | ✅ | ❌ |

---

## 4. Role Navigation Menu Configuration (`public.role_menu_items`)

Sidebar navigation is stored dynamically in the database and queried via `fn_navigation_menu()`.

### 4.1. Navigation by Role:

```
Role Host & Tenant Admin:
  ├── ▣ Dashboard       (/dashboard)
  ├── 👥 Team           (/team)
  ├── ◎ Clients         (/clients)
  ├── 📁 Projects       (/projects)
  ├── ✦ Content         (/content)
  ├── ✓ Tasks           (/tasks)
  ├── ◌ Networking      (/networking)
  ├── ◔ Engagement      (/engagement)
  ├── ◫ Calendar        (/calendar)
  ├── ▤ Statistics      (/statistics)
  └── ▥ Reports         (/reports)

content approver:
  ├── ▣ Dashboard       (/dashboard)
  ├── ◎ Clients         (/clients)
  ├── 📁 Projects       (/projects)
  ├── ✦ Content         (/content)
  ├── ✓ Tasks           (/tasks)
  ├── ◫ Calendar        (/calendar)
  ├── ◔ Engagement      (/engagement)
  ├── ◌ Networking      (/networking)
  └── ▥ Reports         (/reports)

content creator:
  ├── ▣ Dashboard       (/dashboard)
  ├── 📁 Projects       (/projects)
  ├── ✦ Content         (/content)
  ├── ✓ Tasks           (/tasks)
  ├── ◫ Calendar        (/calendar)
  └── ◔ Engagement      (/engagement)

Viewer:
  ├── ▣ Dashboard       (/dashboard)
  ├── 📁 Projects       (/projects)
  ├── ◫ Calendar        (/calendar)
  └── ▤ Statistics      (/statistics)
```

*(Note: Workspace Settings and Sign Out are accessed exclusively via the profile popover in the bottom-left corner of the sidebar, avoiding duplicate links in the main module list).*
