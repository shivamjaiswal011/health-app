# health-app

An offline-first training and nutrition tracker. Everything is computed and stored on
the phone: no server, no account, no background process, nothing sent anywhere.

Built for Indian users first — the food database ranks dishes like roti, dal and paneer
above generic entries, and portions are in katoris and rotis rather than grams alone.

> Working title. Nothing in the code depends on the name.

## Why it works this way

A manual logging app has no reason to need a server. Sensors and radios cost battery;
arithmetic over a few thousand SQLite rows does not. Closed, the app is not running at
all — the operating system suspends it, and the daily reminder is scheduled by the OS
rather than by waking the app to decide whether to remind you.

That buys three things worth having: it works in a gym basement with no signal, it costs
nothing to run, and your health data genuinely never leaves your device.

## What it does

**Training.** A 90-exercise catalogue, routines with target sets and ordering, and a set
logger that shows what you did last time behind each empty row. Rest timer, personal
records, and a session you can force-quit mid-set without losing anything.

**Nutrition.** 8,114 USDA foods plus 30 Indian dishes with household portions, searched
offline via FTS5. Custom foods, multi-ingredient recipes, one-tap repeats of anything you
have eaten before, and copy-yesterday.

**Progress.** Bodyweight and per-lift strength trends drawn over the raw series, weekly
training volume, and a dashboard covering both halves.

**Insights.** Ten rules over your own history, each stating the numbers behind it —
including cross-domain observations neither log could make alone, like eating less on the
days you train.

## Running it

Native modules (SQLite, Skia, MMKV) mean **Expo Go will not work**; a development build is
required.

```sh
npm install
npm run ios        # or: npm run android
```

```sh
npm test           # 185 tests
npm run typecheck
npm run lint
```

Rebuilding the bundled food database is documented in
[`scripts/build-food-db/README.md`](scripts/build-food-db/README.md).

## How it is organised

```
src/domain/    pure TypeScript — no React, no SQL. Every calculation lives here.
src/db/        Drizzle schema, migrations, connection
src/features/  screens and components, one repository module each
src/ui/        design system primitives
```

Two rules carry the architecture. `domain/` stays pure, which is what makes estimated
one-rep max, macro maths and the insight rules testable without a database. And features
never write SQL — each owns a repository exposing intention-revealing functions, which is
the seam that would let device sync be added later without touching the screens.

Every user-owned row carries a UUIDv7 id, timestamps and a soft-delete tombstone, and
every mutation appends to a `change_log`. The app is local-only today; that table becomes
the sync oplog unchanged if it ever is not.

## Food data

| Source | Licence |
|---|---|
| USDA FoodData Central | CC0 1.0 (public domain) |
| Indian dishes composed from those ingredients | This project |

Indian dishes are recipes of USDA ingredients plus the weight the batch reaches once
cooked, with fibre-adjusted Atwater factors and retention modelling for what drains away.
Every number is traceable to its ingredients.

**IFCT 2017 is deliberately not included.** Its licence requires written permission before
its data may be stored electronically to create a product, and being free and open-source
is not an exemption. The reasoning is written up in
[`docs/licensing/`](docs/licensing/) along with the permission request.

## Status

All six planned milestones are built and the app runs end to end. It has not been
released, and a few things are known-unfinished: there is no onboarding flow, the daily
reminder toggle does not work, and swipe-to-delete on set rows is untested.

## Licence

MIT — see [LICENSE](LICENSE).
