# Product research notes

Research date: **21 November 2026**. These notes summarise current public product pages for the reference apps, then translate the observations into decisions for Form Fitness. This is product research, not a copy of any interface or brand.

## Sources reviewed

| Source | What was useful |
| --- | --- |
| [Hevy — features](https://www.hevyapp.com/features/) | Feature taxonomy across logging, progress tracking, muscle-group reporting, measurements, progress photos, consistency/streaks and monthly reports. |
| [Strong](https://www.strong.app/) | Simplicity positioning (“Think less. Lift more.”), routine planning, RPE, warm-up calculator, body measurements, scheduling, muscle heat map, workout sharing. |
| [Boostcamp](https://www.boostcamp.app/) | Fast logging with previous weights, rest timer, plate calculator, auto-progression, programme library/editor and analytics (estimated 1RM, muscle balance, strength score). |
| [JEFIT](https://www.jefit.com/) | Planner/tracker framing; the page is a marketing shell behind a consent layer. |
| [MYBOD on Google Play](https://play.google.com/store/apps/details?id=com.trainerize.mybod) | Store page content is heavily client-rendered; the supplied reference brief was the more useful source for the MYBOD concept. |
| [Gabrisp — workout tracker comparison](https://gabrisp.com/best-workout-tracker-app) | Initial discovery source; page content is largely client-rendered/truncated in a text fetch. |

The supplied reference pack also contained the five-day Push/Pull/Legs/Upper/Lower programme, the product brief and the MYBOD link. The programme is imported as **ordinary editable seed data**, not hardcoded logic.

## Patterns worth adopting

### 1. Logging must survive a tired brain
Across Hevy, Strong and Boostcamp the shared pattern is a short loop:

- previous weight and reps are visible while you log;
- each set has one large completion target;
- rest starts automatically;
- the next session's values carry forward;
- the workout summary is immediate and legible.

Form Fitness implements this with prefilled weights/reps from the last matching session, one-tap set completion, an automatic rest timer that survives navigation, a persistent floating timer, per-exercise notes and a finish sheet that validates that at least one working set exists.

### 2. Programming is a first-class object
Boostcamp's programme editor and Strong's routines both treat a programme as days → exercises → sets/reps/rest. Form Fitness mirrors that hierarchy but keeps the editor local and direct: rename days, reorder, add/remove exercises, edit set/rep/rest targets, add notes, duplicate, schedule, delete. The library underpins the editor so every lift has muscle/equipment metadata and alternatives.

### 3. Planning beats a to-do list
Strong and Boostcamp both support scheduling routines. Most trackers make the user pick a date repeatedly. Form Fitness adds a **repeating calendar**:

- drag a programme day onto a date on desktop;
- tap a day then a date on touch devices;
- repeat once, weekly, every two weeks or daily;
- pause or delete the repeating rule without touching completed history.

This was a direct response to the “survive a real week” problem in the reference brief.

### 4. Progress needs context, not just numbers
Hevy's feature list includes muscle-group charts, sets per muscle, measurements, photos, consistency and monthly reports. Form Fitness combines:

- volume/workout/consistency trends;
- estimated 1RM and personal bests;
- muscle balance (primary = 1, secondary = 0.5 weighted set);
- a 12-week rhythm heatmap;
- monthly reports with comparisons to the previous month;
- a private progress-photo journal with front / side / freeform poses.

### 5. Nutrition should be quicker than a spreadsheet
The practical pattern is search, serving quantity, meal slot and a macro summary. Form Fitness adds saved meals, quick-add calories, daily targets estimated from profile + goal, and a seven-day calorie strip. It deliberately avoids pretending to have a barcode database.

### 6. Body context and recovery
Strong tracks body measurements; Hevy tracks measurements and photos. Form Fitness adds a lightweight check-in: weight, ten measurements, sleep, energy, soreness, mood and notes, plus a transparent readiness score. Sleep and weight trends are charted, not just stored.

### 7. Social is a product decision, not a checkbox
Hevy and Strong both have social layers; building a genuine one requires accounts, a backend, identity and moderation. Form Fitness's first release is deliberately local-first. The Training Circle page explains the limitation honestly and offers a local “beat last week” challenge and copyable session summaries instead of fake rankings.

### 8. Dark, fast, mobile-first
All reference apps are dark-friendly, thumb-first trackers. Form Fitness uses a dark-first design with a real light theme, tabular numerals, 44px+ touch targets, bottom navigation on phones, a sidebar on desktop, and reduced-motion support. The active session hides the app chrome so the logging surface is the whole screen.

## What Form Fitness does differently

| Reference pattern | Form Fitness interpretation |
| --- | --- |
| Account-first cloud apps | Local profile, no sign-in, export/import, explicit privacy note |
| Routine scheduler buried in settings | Calendar-first planning with drag-and-drop and repeat rules |
| Progress photos as a separate feature | Session check-in photos in three named poses, visible in history and report |
| One-screen workout logger | Programme → calendar → active session → summary → history as one coherent flow |
| Leaderboard/social feed | Honest local-only circle, personal weekly challenge, shareable plain-text summary |
| Generic set table | Previous-value placeholders, warm-up marking, per-set RPE option, weight adjustment for all sets |

## Second-iteration additions

The second pass focused on the “next rep” decisions that the research apps make easier:

- **Progression guidance.** Boostcamp's auto-progression and Strong's simple logging both reduce the mental load of choosing a load. Form Fitness stays manual but shows an explainable suggestion: if every working set reached the top of the programme's rep range, it proposes a specific increase (using smaller steps for dumbbells); otherwise it says how many reps remain before adding weight.
- **Warm-up generator and plate calculator.** Strong lists a warm-up calculator and Boostcamp a plate calculator as workout tools. Form Fitness adds a 40/60/80% warm-up ramp and a per-side plate breakdown for a standard metric or imperial bar.
- **Faster food reuse.** Nutrition diaries are repetitive, so Form Fitness can copy the previous day's food into the current day; this sits alongside quick-add and saved meals.
- **Plain-language report insights.** Instead of only charts, the monthly report states what changed versus the previous month, where the weighted sets went, the top estimated 1RM and how many progress photos were captured.
- **PWA-ready identity.** PNG 192/512/maskable icons and an Apple touch icon make the local-first web app installable rather than only browser-first.

## Sources and inspiration for the learning library

The article library links to established public resources rather than reproducing proprietary content:

- ACSM progression models (PubMed), Stronger by Science, Renaissance Periodization, Jeff Nippard, Squat University, Barbell Medicine, Examine, Precision Nutrition, Sleep Foundation, WHO.

Articles are original summaries written for this project and are explicitly labelled as general information, not medical advice.

## Ethical and legal notes

- No MYBOD branding, screenshots, copy or proprietary assets are used.
- The five-day plan supplied in the reference image is used as data with attribution in the README and programme description.
- No fake users, ratings, leaderboards or social proof are shown.
- Measurements, calorie targets and readiness are estimates, explained in the UI.
