# Working rules for this repository

## Git: push automatically
- After every finished change, commit and **push to GitHub without asking**.
- Branch choice:
  - If the user names a branch, use it.
  - Changes to the main game (Meow Sushi Conveyor) go to **`main`**.
  - Separate features / variants get their own branch, created proactively: `feature/web-platforms` (Playgama, CrazyGames, GameMonetize, Y8 ports), `feature/hotpot-reskin` (Meow Hotpot Conveyor), or a new `feature/<name>` for new work.
  - **If the user says nothing about where it goes, push to `main`.**
- Before pushing, check nothing secret is staged: `native/hs-config.json` (HS SDK key) is gitignored and must never be committed; the repo is public.
- This clone is shallow and only tracks `main`; fetch a feature branch explicitly before working on it: `git fetch origin +refs/heads/<branch>:refs/remotes/origin/<branch>`.
