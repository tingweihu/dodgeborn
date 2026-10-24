# Contributing to DODGEBORN

1. Keep match rules in `packages/core`, numbers in `packages/content`, and visual/input code in `apps/web`.
2. Preserve deterministic 60Hz simulation and add focused tests for changes to ball possession, damage, collision, or AI.
3. Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` before proposing a release. In an offline environment, run the `:local` scripts and state which gates remain unverified.
4. New characters, art, animation, music, and sounds must be original or include a clear compatible license and attribution in `docs/ASSET_LICENSES.md`. Do not submit assets copied from an existing game.
5. Keep controls readable at 480×270 and verify gameplay in a real browser. Update `docs/DECISIONS.md` and `docs/KNOWN_ISSUES.md` when behavior changes; include exact test evidence in the pull request.

Use small, focused pull requests. Describe player-visible changes and the exact verification commands and results. The repository has no backend or account system.
