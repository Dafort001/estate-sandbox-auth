# 📋 Replit Note – Internal Editorial & Change Backlog  
**Project:** pix.immo  
**File:** /docs/editorial_backlog_note.md  
**Priority:** Medium-High  
**Author:** Daniel Fortmann  

---

## 🎯 Purpose
Create an internal admin section within the **pix.immo dashboard** to manage all editorial topics, blog ideas, and website change requests in one place.  
This board serves as a **central planning and coordination tool** for all updates, improvements, and upcoming articles.

---

## 🧩 What Replit Should Build
- Protected admin page (accessible only for logged-in editors/admins).  
- A **list or kanban-style board** to show all pending topics and change items.  
- Ability to **create, edit, comment, assign and mark items as done.**  
- Persistent data storage (via database or internal JSON).  
- Simple, clear UI with filters and basic CRUD actions.

---

## 🗂️ Core Fields per Item
| Field | Description |
|-------|--------------|
| Title | Short descriptive title of the task or blog idea |
| Type | `blog_post` or `change_request` |
| Category | e.g. `photo`, `ai`, `marketing`, `infra`, `legal`, `other` |
| Status | `idea`, `queued`, `drafting`, `in_review`, `scheduled`, `published`, `done` |
| Priority | `low`, `normal`, `high`, `urgent` |
| Description | Short Markdown note explaining the purpose or details |
| Due Date / Publish Week | Optional scheduling info |
| Assignee | Optional user responsible for the task |
| Tags | Optional keywords for filtering |

---

## 🧭 Workflow
1. New ideas are created as **status = idea**.  
2. Editors or admins can move them along the workflow:
   - **idea → queued → drafting → in review → scheduled → published/done**  
3. Change requests follow a simplified flow:
   - **queued → doing → in review → done**  
4. Comments or notes can be added to each entry.  
5. Completed items remain visible under a “Done” tab.

---

## 🖥️ UI Suggestion
**Path:** `/admin/editorial`  

Tabs:
- **All**
- **Blog**
- **Website**
- **Completed**

Buttons:
- **+ New Item**
- **Edit**
- **Mark as Done**

Display (per card):
- Title  
- Type + Category (badge)  
- Status (color-coded)  
- Priority  
- Assignee (if any)  
- Optional publish week (e.g. `2025-W44`)  

---

## 🔧 Optional Features (Later)
- Email notifications via Mailgun for new or reviewed items.  
- “Generate outline” button for blog ideas (connects to GPT).  
- Export of publishing schedule as CSV or Markdown.  
- Weekly overview calendar view.

---

## ✅ Outcome
A simple, visual **Editorial & Change Management Tool** directly integrated in the pix.immo admin area.  
It should help track blog progress, coordinate website updates, and prepare publishing schedules without leaving the dashboard.

---

*End of document*
