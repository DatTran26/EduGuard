# Changelog

## Frontend

### Feature: Teacher dashboard concept preview
- Date: 2026-06-26
- Branch/source: `devH`
- Type: Feature
- Description: Added a preview-only teacher dashboard mode with a denser, higher-contrast data-first direction so the team can review a more designer-led layout without replacing the current production dashboard.
- Changed files: `src/features/dashboard/pages/TeacherDashboardPage.jsx`, `src/features/dashboard/components/TeacherDashboardConceptPreview.jsx`
- Validation: `npx eslint src/features/dashboard/pages/TeacherDashboardPage.jsx src/features/dashboard/components/TeacherDashboardConceptPreview.jsx`, `npm run build`
- Notes: Open `/teacher/dashboard?ui=concepts` to review the editorial preview. The latest pass trims header copy, promotes classroom cards higher in the layout, and deepens contrast while the default dashboard remains unchanged when the query param is absent.

### Feature: Teacher classroom main UI refresh
- Date: 2026-06-26
- Branch/source: `devH`
- Type: Feature
- Description: Replaced the teacher `Lớp học` list with the newer compact layout so the main screen focuses on classroom cards instead of summary blocks and filter chrome.
- Changed files: `src/features/classrooms/pages/ClassroomListPage.jsx`, `src/features/classrooms/components/TeacherClassroomListPreview.jsx`
- Validation: `npm run build`, `npx eslint src/features/classrooms/pages/ClassroomListPage.jsx src/features/classrooms/components/TeacherClassroomListPreview.jsx`
- Notes: The refreshed teacher classroom layout is now the default UI. It removes the old preview toggle path and keeps only lightweight inline summary badges above the classroom cards.
