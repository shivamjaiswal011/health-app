# OneHealth

An offline-first training and nutrition tracker. Everything is computed and stored on
the phone: no server, no account, no background process, nothing sent anywhere.

Built for Indian users first — the food database ranks dishes like roti, dal and paneer
above generic entries, and portions are in katoris and rotis rather than grams alone.

> The repository is still named `health-app`; only the app's display name changed.

## Why it works this way

A manual logging app has no reason to need a server. Sensors and radios cost battery;
arithmetic over a few thousand SQLite rows does not. Closed, the app is not running at
all — the operating system suspends it, and the daily reminder is scheduled by the OS
rather than by waking the app to decide whether to remind you.

That buys three things worth having: it works in a gym basement with no signal, it costs
nothing to run, and your health data genuinely never leaves your device.

## What it does

**Training.** A 90-exercise catalogue, routines with target sets and ordering, and a set
logger that opens each row with what you lifted last time. Weights go in as kilograms or
pounds — a gym marks its barbell one way and its leg press the other — and the unit
follows the lift rather than a global setting. Rest timer, personal records, a session
you can force-quit mid-set without losing anything, and every finished session readable
afterwards.

**Challenge mode.** Opt-in progressive overload. Each session asks for one more rep than
the weakest working set managed last time; miss it and the same target is re-issued until
it is cleared. Clear the top of the range and the weight rises by the smallest jump the
equipment actually loads with, in that equipment's unit, and the reps restart at the
bottom. A back-off set follows at 20% lighter for four more reps. Rep ranges default per
muscle — calves and shoulders ladder higher than chest and back — and are overridable per
exercise. No progression state is stored: the target is derived from what was logged, so
correcting a past set corrects the next target with it.

**Nutrition.** 8,114 USDA foods plus 30 Indian dishes with household portions, searched
offline via FTS5. Custom foods, multi-ingredient recipes, one-tap repeats of anything you
have eaten before, and copy-yesterday.

**Progress.** Bodyweight and per-lift strength trends drawn over the raw series, weekly
training volume, and a dashboard covering both halves.

**Setup.** A first run asks height, weight, activity and goal, derives calorie and macro
targets from Mifflin-St Jeor, and records a first weigh-in so trends start on day one.
Skippable, and every figure is editable afterwards. A profile screen shows what you
entered and the targets it produced.

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
npm test           # 308 tests
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

## Installing it on a phone

No App Store listing, and none planned — this is a personal app published as source. To
run it on your own iPhone, plug the phone in and build a release straight to it:

```sh
npm install
npx expo run:ios --device --configuration Release
```

Xcode will ask which device and which signing team. A free Apple ID works and needs no
paid membership, with one catch: apps signed by a personal team stop launching after
seven days and the same command re-signs them. A paid Apple Developer account raises that
to a year.

`--configuration Release` matters. Without it the app expects a Metro dev server on your
laptop and will not open on its own.

## Status

Version 1.0.0. Everything above is built and works end to end, verified on the iOS
simulator; 308 unit and integration tests cover the domain logic and the data layer.

Three things are known-unfinished: the daily reminder toggle does not work, swipe-to-delete
on set rows is untested on hardware, and past sessions are readable but not editable.

## Licence

MIT — see [LICENSE](LICENSE).
