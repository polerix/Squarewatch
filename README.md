# Horror & Holiday Movie Hub

A standalone static movie marathon app with automatic seasonal themes and a 5×5 trope Bingo card.

- **Live site:** https://polerix.github.io/halloween/
- **Repository:** https://github.com/polerix/halloween

## Files

```text
halloween/
├── index.html  # Complete UI, calendar theme logic, and Bingo engine
└── README.md   # Usage and deployment instructions
```

## Use

Open `index.html` directly in a browser. No install or build is required. Google Fonts requires an internet connection; fallback fonts work offline.

The local calendar selects Halloween from January through October and Holiday from November 1 through December 31. Force either theme with the header buttons, or select **Match Calendar** to restore the calendar choice. Selecting a theme generates a fresh card.

Click a square, or focus it and press Enter/Space, to mark or unmark it. The center is always free. Complete any row, column, or diagonal to get Bingo. **New Card** shuffles the 24 unique tropes and clears your marks. Cards and manual theme choices reset on reload.

**Today's Triple Feature** shows the supplied fixed picks: Psycho (1960), Troll 2 (1990), and Things (1989). Picks do not rotate by date or theme; tiers are editorial labels.

## GitHub Pages deployment

In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/ (root)**, and save.

To publish subsequent edits:

```sh
git add index.html README.md
git commit -m "Update movie marathon hub"
git push origin main
```

GitHub Pages publishes the root `index.html` to https://polerix.github.io/halloween/. Deployment can take a few minutes; check the repository's Actions tab for progress.
