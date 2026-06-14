# UI Design Conventions

Reference for AI agents and contributors working on the agent-dashboard frontend (`web/src/`).

## Border radius

Use a five-tier system. Match element **type**, not arbitrary preference.

| Tier | Value | Tailwind class | Use for |
|------|-------|----------------|---------|
| Surface | 12px | `rounded-xl` | Top-level surfaces: modals, dashboard panels |
| Card / container | 8px | `rounded-lg` | Nested cards, tooltips, icon buttons, event feed, blast-radius rows |
| Button / input | 6px | `rounded-md` | Primary and secondary action buttons, text inputs, checkboxes, project selector |
| Chart detail | 4px | Recharts `radius` prop | Bar chart corner radii, scrollbars |
| Pill | 9999px | `rounded-full` | Status dots, badge pills, gauge rings, circular icon buttons |

### Hierarchy

- Outer surfaces (`rounded-xl`) wrap inner cards (`rounded-lg`).
- Interactive controls (buttons, inputs) use `rounded-md`, not `rounded-lg`.
- Icon buttons in the header/toolbar use `rounded-lg` (card tier), not bare `rounded` (4px).
- Pills and dots always use `rounded-full`.

### Recharts

Recharts `contentStyle` does not accept Tailwind classes. Use inline values that match the tier:

- Tooltips: `borderRadius: 8` (card tier)
- Horizontal bar ends: `radius={[0, 4, 4, 0]}` (chart detail tier)
- Vertical sparkline bar tops: `radius={[4, 4, 0, 0]}` (chart detail tier)

### Scrollbars

Defined in `index.css`. Track and thumb use `border-radius: 4px` (chart detail tier).

### New elements

When adding UI:

1. Identify the element type in the table above.
2. Use the matching tier; do not introduce new radius values without updating this doc.
3. If unsure, prefer the tier used by similar existing elements in the same file.
