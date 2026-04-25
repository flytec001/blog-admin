# Blog Admin UI Density And Editor-First Design

## Goal

Rework the existing admin UI toward an editor-first workspace:

- Increase overall information density across the app
- Expand the usable writing area on the post editor page
- Reduce decorative whitespace without changing the product's warm visual direction
- Keep mobile behavior functional and predictable

This is a focused UI/layout pass, not a feature expansion.

## Scope

In scope:

- App shell density updates
- Post list density updates
- Media library density updates
- Post editor layout redesign with editor-first priority
- Shared spacing, toolbar, panel, and button refinements that support the above

Out of scope:

- New editing capabilities
- New data fields or content model changes
- Navigation restructuring
- Performance/code-splitting work beyond what is required by the UI edits

## Product Direction

The chosen direction is `editor-first extreme density`.

Desired characteristics:

- Feels like a working CMS, not a presentation-heavy dashboard
- Uses compact spacing and lower visual chrome
- Preserves the current warm palette and overall tone
- Makes writing and scanning faster on desktop

## Layout Strategy

### App Shell

The shell should become tighter and more tool-like:

- Narrower desktop sidebar
- Smaller navigation rows
- Reduced main content padding
- Less vertical space consumed by page headers and top-level panels

The sidebar remains persistent on desktop and drawer-based on mobile. No route structure changes are required.

### Post List

The post list should emphasize scan speed:

- Compress the page header and toolbar
- Reduce table row height
- Tighten title/description spacing inside the title cell
- Keep status and actions accessible without oversized controls
- Preserve existing filters and search, but present them in a denser control bar

The table remains the primary desktop layout. Mobile responsive behavior remains intact.

### Media Library

The media page should shift from roomy cards toward a denser asset browser:

- Tighter header and action bar
- Smaller media cards
- Denser metadata and controls
- More items visible per row on desktop where space allows

Preview modal behavior remains unchanged unless small layout adjustments are needed for consistency.

### Post Editor

The post editor is the highest-priority area and should be rebalanced around writing:

- Remove the permanent desktop split between editor and preview
- Make the writing surface the dominant desktop region
- Move article metadata into a narrower secondary rail or compact section
- Make preview on-demand instead of always consuming half the width
- Increase editor minimum height so the body field becomes the visual center of the page
- Keep mobile edit/preview switching behavior, with only density-oriented refinements

## Component-Level Design

### Shared Panels And Headers

Shared panel styles should move toward lower padding and sharper hierarchy:

- Smaller panel padding
- Smaller header gaps
- More compact action rows
- More restrained heading-to-description spacing

This should make page-level surfaces feel aligned across list, media, and editor views.

### PostForm Restructure

`PostForm` should be reorganized into an editor-first desktop layout:

- A compact top action/header bar
- A dominant content editing column
- A secondary metadata column for title, slug, date, state, taxonomy, and cover
- A preview section that is hidden by default or toggled into view, rather than permanently side-by-side

The editor column must remain primary even when preview is opened.

### Rich Editor Surface

The editor should feel closer to a writing application:

- Increase available height
- Reduce outer panel padding around the writing area
- Make the toolbar more compact
- Keep formatting controls visible and usable without becoming visually heavy

The content area must remain readable while showing more vertical content at once.

### Tables, Filters, And Action Controls

Dense UI changes should include:

- Smaller button heights
- Smaller filter tabs
- Tighter search field spacing
- Reduced table cell padding
- More compact inline metadata blocks

Controls must stay touch-usable on mobile, so density reductions are desktop-first with responsive fallbacks.

## Interaction Model

No new workflows are introduced.

The redesign only changes presentation and layout:

- Existing save/delete/publish interactions remain the same
- Existing mobile edit/preview toggle remains conceptually the same
- Existing media actions remain the same
- Existing list actions remain the same

Desktop preview in the editor becomes an optional surface instead of a permanent paired column.

## Error Handling

No error handling semantics change.

Existing alerts and submission states remain in place. Styling may become more compact, but behavior and messages stay unchanged.

## Testing Strategy

Verification should focus on regressions caused by layout changes:

- Run the existing automated test suite
- Run a production build
- Manually verify desktop layouts for:
  - post list
  - media library
  - post editor
- Manually verify mobile breakpoints for:
  - app shell drawer/top bar
  - post editor edit/preview switch
  - responsive post list table
  - responsive media grid

## Implementation Notes

Expected implementation shape:

- Update shared CSS tokens and layout rules in `src/styles/global.css`
- Adjust `src/app/AppShell.tsx` only if structural changes are needed for denser shell composition
- Restructure `src/features/posts/components/PostForm.tsx` to support editor-first desktop layout
- Keep route and data APIs unchanged

The implementation should avoid bundling unrelated refactors. Any code movement should directly support the density and editor-first layout goals above.
