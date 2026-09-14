# Squarewatch

A neon movie-night hub for the Canadian and New Brunswick calendar, using the supplied Squarewatch logo and its lime, pink, and dark plum palette.

**[Live site](https://polerix.github.io/Squarewatch/)** · **[Repository](https://github.com/polerix/Squarewatch)**

## What it does

- Automatically chooses the next occasion, keeping it active on its date and advancing the next day.
- Uses **America/Moncton** time for the calendar and daily three-film rotation, including when an open page crosses midnight or returns from a background tab.
- Provides matching seasonal accents, decorations, full movie collections, and 24-trope Bingo cards with a free centre. Remembrance Day and Truth and Reconciliation use restrained decoration and an optional reflective viewing card.
- Supports manual programme selection and date previews. **Back to today** restores the live automatic calendar. Previewing a date never implies future streaming availability.
- Lists dated Canadian subscription, free/ad-supported, library, rental, and purchase offers with provider links. NFB selections link to the film player page; this verifies the page, not playback entitlement.
- Keyboard-accessible Bingo supports marking, unmarking, shuffling, and all rows, columns, and diagonals. Reloading or changing occasions resets the card.

## Calendar coverage

The ten federal general holidays: New Year’s Day, Good Friday, Victoria Day, Canada Day, Labour Day, National Day for Truth and Reconciliation, Thanksgiving, Remembrance Day, Christmas, and Boxing Day.

NB additions: Family Day (third Monday in February) and New Brunswick Day (first Monday in August). Easter Monday is labelled as a federal/NB public-service occasion. Halloween, National Acadian Day (August 15), and New Year’s Eve are labelled cultural observances, not statutory holidays.

Thanksgiving is the **second Monday in October**. Easter dates are calculated annually using the Gregorian calendar. Victoria Day is the Monday on or before May 24. Canada Day follows July 2 when July 1 is a Sunday, per the Holidays Act. Other workplace substitute days do not change this screening calendar.

The eight NB paid public holidays are labelled separately from NB prescribed days of rest and public-service holidays. The app is not an employment-entitlement calculator. Film selections are editorial; some Thanksgiving films depict the American holiday.

Sources:

- [Federal general holidays](https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html)
- [NB paid public holidays](https://www.gnb.ca/en/topic/jobs-workplaces/labour-market-workforce/employment-standards/holiday-vacation.html)
- [NB prescribed days of rest](https://www2.gnb.ca/content/gnb/en/departments/elg/local_government/content/governance/content/days_of_rest_act.html)
- [NB public-service holidays](https://www2.gnb.ca/content/gnb/en/departments/finance/human_resources/content/policies_and_guidelines/leave_policies/statutory_public_holidays.html)
- [Federal 2026 calendar dates](https://www.canada.ca/en/revenue-agency/services/tax/public-holidays.html)
- [National Acadian Day](https://www.canada.ca/en/canadian-heritage/campaigns/celebrate-canada/acadian-day.html)

## Canadian availability

`data/movies.json` is the curated catalogue. Each title has a specific Canadian JustWatch page or NFB film page. The refresh script reads public JSON-LD from those pages, validates film identity and release year (with reviewed title aliases and release-year exceptions), and accepts only offers explicitly marked for CA (CAD for priced offers; unpriced offers may omit currency). It distinguishes subscription, rental, purchase, and library access; prices are not copied. It does not call a private API or use a secret.

`data/availability.json` stores the last successful check for each film and the provider URLs. A failed check retains the last good result and marks it stale; it never becomes a fabricated “not available” result. Results also become stale after 48 hours. A valid title page explicitly reporting zero offers or stating the film is unavailable is shown as no Canadian offers listed. The UI always links to the original source. NFB entries confirm a film/player page only; viewers must confirm playback on NFB. Provider subscriptions, geography, ads, and participating library access can still affect viewing.

The GitHub Actions workflow checks all films daily at **06:23 UTC**, saves the dated snapshot, and deploys the updated site. It also runs on pushes and manual dispatch. GitHub may delay scheduled runs and can disable schedules in inactive public repositories after 60 days; use **Actions → Refresh Canadian availability and publish → Run workflow** to check manually or re-enable a disabled workflow. Changes to source-page structure can require a parser update; stale labels remain honest during failures.

## Develop and test

No build or frontend dependencies are required. Serve the folder rather than opening `index.html` directly because the app uses modules and JSON requests:

```sh
python3 -m http.server 4187 --bind 127.0.0.1
# Open http://127.0.0.1:4187
node --test tests/core.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/refresh_availability.py
# Optional targeted recheck:
python3 scripts/refresh_availability.py --only psycho stillmine
```

The supplied logo is in `assets/squarewatch-logo.jpg`. Google Fonts are optional; system fonts are used if unavailable. Local date/card interactions work with loaded assets even if a provider is unreachable; viewing links require a connection.

## Deployment

GitHub Pages uses **GitHub Actions**, through `.github/workflows/pages.yml`. The workflow uploads only staged public assets, then explicitly deploys them; it does not rely on a bot commit triggering a second workflow. Push changes to `main` to publish. The workflow needs repository contents write permission to save availability snapshots and Pages/OIDC write permission to deploy.

```text
index.html, styles.css   — branded interface
app.mjs, core.mjs        — rendering, calendar, daily cycle, Bingo
assets/                 — supplied logo
data/                   — curated films and dated availability
scripts/                — availability refresh and public asset staging
tests/                  — date, rotation, Bingo, and parser checks
.github/workflows/      — daily refresh and Pages deployment
```
