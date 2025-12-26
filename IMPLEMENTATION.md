# 10,000 Arrows – Implementation Plan

## Acceptance Invariants
- The home page always renders a haiku.
- Haiku occupies approximately 80 percent of visual weight.
- Navigation does not dominate above-the-fold space.
- Manifest and tag loading never block first paint.
- Mobile interaction works for tags and exploration.

## Phase 1: Deterministic Home State
- Default to most recent haiku.
- Fallback to random haiku.
- Recover gracefully if filters return no matches.

Acceptance:
- No blank state on refresh or first visit.

## Phase 2: Hall View Layout
- Center the haiku as the dominant panel.
- Reduce or collapse list-based navigation.
- Display total haiku count unobtrusively.

Acceptance:
- Screenshot clearly prioritizes poetry.

## Phase 3: Consolidated Explore Entry
Replace multiple controls with links:
- Explore by Tag
- Explore by Date
- Enter the Hall

Acceptance:
- No search inputs on the home view.

## Phase 4: Lazy Loading Strategy
- Load current haiku immediately.
- Fetch manifest and tags asynchronously.
- Optionally introduce a lightweight latest pointer file.

Acceptance:
- Haiku renders before metadata completes loading.

## Phase 5: Dedicated Explorer Views
- Tag Explorer: tag cloud and filtering.
- Date Explorer: chronological navigation.
- Hall Explorer: full listing experience.

Acceptance:
- Home remains calm and uncluttered.

## Phase 6: Background Rotation
- Choose from a curated background set.
- Persist per session.
- Maintain text contrast.

Acceptance:
- Readability is never compromised.

## Phase 7: About and Research Links
- Replace Contact with About Haiku.
- Add lineage and research links.

Acceptance:
- Visitors understand context without UI clutter.
