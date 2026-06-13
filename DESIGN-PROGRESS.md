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

## Premium pass (redesign-skill)
- **2026-06-13** — Professional polish (commit 9a36adc, build green, deployed). Applied redesign-skill audit, perf-safe: font-smoothing + `text-wrap:balance` headings + branded `::selection`; tabular figures on prices; menu cards use `.card-premium` (hairline brand-tinted border + layered orange-tinted shadow, GPU-only hover lift); all buttons get `active:scale` press feedback; fixed 2.5%-opacity grain overlay (own layer); `scroll-behavior:smooth`. **No blur()/backdrop-filter** — verified 60fps on a warm scroll (0 frames >32ms, max 18.7ms). Headless-no-GPU cold pass = 57fps avg.

## Perf
- **2026-06-13** — Fixed hero scroll lag (commit 79cba73, build green, deployed). Cause: `filter: blur(60px)` on the animated `.hero-flame-glow` layers re-rasterized every frame and composited against the whole hero on scroll. Fix: removed `blur()` (multi-stop radial gradients give the same soft glow), `isolation/contain` on the glow, `translateZ` on the grain, static glow ≤768px. **Do not reintroduce `filter: blur()` on animated hero layers.**

## Backlog (in priority order)
1. [x] Photoless menu cards: branded gradient + Flame-glyph placeholder (commit 719a833, build green). Done 2026-06-13.
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
