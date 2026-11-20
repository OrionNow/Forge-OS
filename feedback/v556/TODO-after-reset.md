# v5.5.6 TODO after usage reset
- Misaki has not re-scored the final build c8f7419 (her 7.5 was for 54facb7). All of her quick fixes are applied, and she projected 8.5+. Next step: one verify pass.
- Misaki MINOR: card subtype tags are shortened with an ellipsis (accepted, because the pane shows the full text).
- Check that the 62/38 builder split feels right at 1366–1599 (only 1280 and 1920 were tested).
- Spec Compare (option 4) is not built. It's deferred until the Overseer asks for it.
- Release v5.5.6 stays a preview (not latest) until the Overseer approves.

## Pass 8 (TACTICAL ARMORY CONSOLE) leftovers
- No faction field in item data, so the faction corner notch is not built; add it if the data gets one.
- Dead code to remove: ltSnip and LT_TAPE in terminal.html.
- The full layout suite wasn't rerun for pass 8. Pass 8 ran the catalogue check (65/65) and the quick suite, and both are green.
- The original check-v555-workflows.cjs fails on dimmed (.lt-dim) items. The v556 copy uses :visible:not(.lt-dim).
- Known UI flake: "DMG rolls the recorded hit" (also on 5.5.5) passes on rerun.
- /workspace/forge-tc has no node_modules. The test env is /workspace/forge-tc-556, with node_modules symlinked to forge-test-d1/tc.
