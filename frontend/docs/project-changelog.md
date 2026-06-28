# Project Changelog

## Feature: Teacher dashboard concept preview
- Date: 2026-06-26
- Branch/source: `devH`
- Area: Frontend
- Purpose and impact: Let the team review a more designer-led teacher dashboard direction in the live app before deciding whether to replace the current dashboard.
- Files changed: `src/features/dashboard/pages/TeacherDashboardPage.jsx`, `src/features/dashboard/components/TeacherDashboardConceptPreview.jsx`
- Technical summary:
  Rebuilt the teacher dashboard preview as a single editorial, data-first layout instead of the earlier multi-concept comparison.
  The new preview pushes action items, risky classrooms, and near-term exam information above supporting analytics so the hierarchy feels more intentional and designer-led.
  The latest refinement removes extra hero copy, tightens section spacing, moves classroom cards higher, and uses stronger navy/slate contrast so the preview feels less pale and less empty.
  `TeacherDashboardPage.jsx` still opens the preview only when the route includes `?ui=concepts`, so the production dashboard remains the default render path.
- Validation:
  `npx eslint src/features/dashboard/pages/TeacherDashboardPage.jsx src/features/dashboard/components/TeacherDashboardConceptPreview.jsx`
  `npm run build`
- Risks and limitations:
  This is a preview-only layer and does not yet replace the main teacher dashboard.
  The preview still reuses the current data shape and chart components, so it is primarily a hierarchy and visual-direction review rather than a new data model.
- Rollback notes:
  Remove the preview import and the `?ui=concepts` query-param branch from `TeacherDashboardPage.jsx` if the concept preview is no longer needed.
- Unresolved questions:
  Whether this editorial direction is strong enough to become the next main teacher dashboard UI.

## Feature: Teacher classroom main UI refresh
- Date: 2026-06-26
- Branch/source: `devH`
- Area: Frontend
- Purpose and impact: Promote the compact teacher classroom layout to the default experience so lecturers see classroom cards immediately, with less empty space and less visual chrome above the content.
- Files changed: `src/features/classrooms/pages/ClassroomListPage.jsx`, `src/features/classrooms/components/TeacherClassroomListPreview.jsx`
- Technical summary:
  Kept the compact teacher classroom component and applied it as the default teacher list UI.
  The final layout keeps a short title row with lightweight inline summary badges and removes the larger summary/filter sections so classroom cards surface immediately.
  Removed the old preview toggle path from the teacher classroom page and routed the teacher role directly into the compact layout.
- Validation:
  `npm run build` completed successfully.
  `npx eslint src/features/classrooms/pages/ClassroomListPage.jsx src/features/classrooms/components/TeacherClassroomListPreview.jsx` completed successfully.
- Risks and limitations:
  This refresh targets the teacher classroom list page only; the classroom detail page still uses the current UI.
  Build output still includes existing Vite warnings from `@microsoft/signalr` pure annotations and large chunk size, but the build succeeds.
- Rollback notes:
  Revert the teacher list render in `ClassroomListPage.jsx` back to the older teacher-specific components if the compact layout needs to be rolled back.
- Unresolved questions:
  Whether the same compact treatment should be extended to the teacher classroom detail page.
