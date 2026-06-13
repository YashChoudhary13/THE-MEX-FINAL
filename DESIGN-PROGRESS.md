# MEX Design Polish — Progress Log

Autonomous design-polish backlog for https://themexcobh.shop. Each entry: what changed, build result, deploy result. The scheduled task `mex-design-polish-loop` (runs every 3h) picks the next backlog item, verifies a local `npx vite build`, pushes, and waits for the green deploy.

## Done
- **2026-06-13** — Initial polish pass (commit 2cb1349, deploy green):
  - Replaced broken Facebook-CDN hero background (403) with self-hosted animated flame-glow + grain.
  - Hero differential parallax (image vs text) + fade-on-scroll.
  - Menu grid: tighter springy stagger; cards re-cascade on category switch.
  - Sections reveal on scroll (whileInView) instead of all-at-mount.
  - Cart badge spring-pop on count change.
  - Add-to-cart checkmark success state.
  - Global scroll-progress bar + page transitions.
  - `<MotionConfig reducedMotion="user">` + CSS reduced-motion guard.

## Backlog (in priority order)
1. [ ] Photoless menu cards: branded gradient/utensil placeholder so text-only items look intentional.
2. [ ] Customization modal: staggered option-row entrance + spring on selection; more padding/hierarchy.
3. [ ] Typography pass: heading rhythm, line-heights, muted-text contrast to WCAG AA.
4. [ ] Hero CTAs: magnetic/spring hover; count-up on "FROM €9.99".
5. [ ] Category sidebar: animated `layoutId` active indicator.
6. [ ] Footer + section vertical-spacing cadence review.
7. [ ] Loading skeletons: shimmer instead of static muted blocks.
8. [ ] Mobile: fix "Scroll to See Menu" button overlapping the hero burger image.

## Guardrails
- Frontend design only. Do not touch backend/.env/DNS/infra or the "Sold Out" data state.
- Respect prefers-reduced-motion. One focused commit per run. Never push a broken build.

## Known non-code issues (for the user, not this task)
- Menu items show **Sold Out** + lack photos — these are admin/data, fixed in the dashboard, not in code.
