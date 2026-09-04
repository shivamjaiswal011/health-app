# Food database build

Produces `assets/foods.db`, the read-only database bundled into the app. Run on a
developer machine, never in the app.

## Rebuilding

```sh
mkdir -p /tmp/usda && cd /tmp/usda
curl -LO https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2026-04-30.zip
curl -LO https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip
unzip -o '*.zip'

cd -
npm run db:food -- /tmp/usda
```

The SR Legacy JSON is 200 MB, hence the raised heap in the npm script. Source archives
are not committed; `assets/foods.db` is, because the app cannot ship without it.

## What goes in

| Source | Foods | Licence |
|---|---|---|
| USDA Foundation Foods (2026-04-30) | ~320 | CC0 |
| USDA SR Legacy (2018-04) | ~7,800 | CC0 |
| Composed Indian dishes | 30 | ours |

Foods missing any macronutrient are dropped rather than shipped with zeroes that would
quietly understate someone's intake. Where a food appears in both USDA releases the
Foundation record wins, being newer and analytically stronger.

See `docs/licensing/` for why IFCT 2017 is not among these.

## Composed dishes

`dishes.mts` defines each Indian preparation as a recipe of USDA ingredients plus the
weight the batch reaches once cooked. Composition per 100 g is the ingredient totals
divided by that cooked weight. Deriving a dish from public-domain ingredients makes the
result our own work rather than a redistribution of someone else's table.

Three modelling decisions worth knowing:

- **Energy is recomputed** from the retained macros using fibre-adjusted Atwater factors
  (protein 4, digestible carbohydrate 4, fibre 2, fat 9). USDA carbohydrate is "by
  difference" and includes fibre; charging it the full 4 kcal/g overstates energy in
  wholegrain and pulse dishes by 5-8%. The adjustment reproduces USDA's own figures.
- **Retention factors** model what is discarded. Paneer drains its whey, taking most of
  the lactose and the whey-protein fraction with it, so a flat "nothing is lost" model
  put its carbohydrate an order of magnitude too high.
- **Dishes can build on dishes** (`dish:paneer`), so Palak Paneer uses the paneer defined
  above it and the two agree by construction.

Cooked weights are considered estimates of typical home cooking, not measurements. They
were calibrated against published per-100 g values for each dish — paneer 273 kcal, roti
299, idli 99, dosa 205 — all within range. Every number remains traceable to its
ingredients, which is more than a crowd-sourced database can say.

Two substitutions are documented in `dishes.mts` where USDA has no equivalent: urad dal
uses mung (both *Vigna*, dry macros within a few percent), and paneer is set from milk
at a raised volume because USDA's whole milk is 3.25% fat against the 6-7% buffalo milk
Indian paneer is usually made from.
