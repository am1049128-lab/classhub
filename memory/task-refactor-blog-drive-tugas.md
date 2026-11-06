---
name: task-refactor-blog-drive-tugas
description: Implemented Class Hub cleanup by removing Blog, adding Google Drive task links, and sharing synchronized task data with Beranda.
metadata:
  type: project
---

Class Hub now removes the Blog route/page, stores optional Google Drive URLs on tasks, and loads task data once in App so Tugas and Beranda share the same task list. Supabase schema/API support `google_drive_url`.

**Why:** This is an ongoing product requirement for the Class Hub task workflow.
**How to apply:** Preserve shared task state when modifying task CRUD or Beranda deadline/announcement widgets. Related: [[classhub-project]]

- [Task refactor Blog Drive Tugas](task-refactor-blog-drive-tugas.md) — Blog removed; task links and synchronized dashboard data added.
---
MEMORY.md pointer: - [Task refactor Blog Drive Tugas](task-refactor-blog-drive-tugas.md) — Blog removed; task links and synchronized dashboard data added.
