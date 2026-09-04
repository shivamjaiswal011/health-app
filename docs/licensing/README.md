# Food data licensing

Provenance for every nutrient source the app ships. Kept in the repo because an
open-source project distributes its data to everyone who clones it, and "where did
these numbers come from and may we ship them" needs an answer that outlives memory.

## Status

| Source | License | Ship it? |
|---|---|---|
| USDA FoodData Central | CC0 1.0 (public domain) | **Yes** — unrestricted |
| Indian Nutrient Databank (INDB) | CC BY 4.0 per the paper; repo has no LICENSE file | **Pending** — see `indb-license-request.md` |
| IFCT 2017 (ICMR-NIN) | All rights reserved; written permission required | **No** — see below |
| Composite dishes computed in-repo from CC0 ingredients | Ours | **Yes** |

## IFCT 2017 — why it is not bundled

From the copyright page of [IFCT 2017](https://www.nin.res.in/ebooks/IFCT2017.pdf), verbatim:

> The use and dissemination of the data in this book is encouraged. This publication
> can be reproduced for personal use with full acknowledgment of the source. However,
> no part of this publication can be stored or reproduced in any electronic format for
> creating a product without the prior written permission of the National Institute of
> Nutrition, Hyderabad.

Bundling a `foods.db` into a shipped app is storing it in an electronic format for
creating a product. Three points that are easy to get wrong:

1. The clause says **"a product"**, not "a commercial product". Being free changes nothing.
2. Indian government publications are **not** public domain. Copyright vests in the
   Government under §17(d) of the Copyright Act 1957 for 60 years — unlike US federal
   works, which is where the CC0 intuition comes from.
3. Open-sourcing raises exposure rather than lowering it: shipping this data under a
   permissive licence would grant downstream users rights we do not hold.

The [ifct2017](https://github.com/ifct2017/ifct2017) project redistributes this data
under AGPL-3.0 with no evidence of permission. That suggests NIN is not enforcing, but
another party relicensing data they do not own confers nothing on us.

A permission request is drafted in `nin-permission-request.md`. Nothing is blocked on
its answer — if it arrives, Indian coverage improves and the pipeline already accepts
a new source.

## Indian coverage without IFCT

- **USDA FDC** covers whole foods, meats, produce, dairy, pulses.
- **Composite Indian dishes** are computed in-repo from CC0 ingredients with cooking
  retention factors. Deriving a dish's composition from public-domain ingredient data
  is original work we own outright.
- **INDB**, if licensed explicitly, supplies 1,095 foods and 1,014 Indian recipes with
  serving sizes — a better fit than IFCT alone, which has no recipes or portions.

## Attribution shipped in the app

USDA asks (does not require) to be named as the source. The About screen credits every
source regardless; for CC BY sources attribution is a licence condition, not a courtesy.
