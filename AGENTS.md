# health-app

Offline-first exercise and diet tracker. React Native + Expo SDK 57, TypeScript.
Everything runs on device: no server, no accounts, no background process.

Plan of record: `~/.claude/plans/woolly-mixing-wren.md`.

## Expo has changed

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
using an Expo API. `expo-file-system` and `expo-sqlite` both changed shape recently;
do not write these from memory.

## Layers

```
src/app/       expo-router routes only — thin, no logic
src/db/        drizzle schema, migrations, connection
src/domain/    pure TypeScript — no React, no SQL, no Drizzle imports
src/features/  screens + components + one repository module each
src/ui/        design system primitives
```

Two rules carry the architecture:

1. **`src/domain/` stays pure.** Every calculation — estimated 1RM, macro totals,
   insight rules — is a pure function over plain objects. This is what unit tests
   cover and what keeps the insight engine cheap to extend.
2. **Features never write SQL.** Each feature owns a `repository.ts` exposing
   intention-revealing functions (`recordCompletedSet`, `loadPreviousPerformance`)
   with Drizzle confined inside. This is the seam that makes adding sync later a
   change in one layer.

## Database

- `user.db` — created on first launch, holds everything the user does.
- `foods.db` — bundled read-only asset (IFCT + USDA), arrives in M4.

Every user table carries `id` (UUIDv7 via `newId()`), `createdAt`, `updatedAt`,
`deletedAt`. Soft deletes only — reads must filter `deletedAt IS NULL`. Every
mutation writes a `change_log` row; that table becomes the sync oplog in v2.

`food_entries` snapshots macros at log time. Never resolve a logged entry's macros
through `foodId` on read — correcting a food definition must not rewrite history.

Dates that mean a calendar day (`loggedOn`, `measuredOn`, `effectiveFrom`) are
`YYYY-MM-DD` text, not timestamps. A meal belongs to the day the user considers it.

## Commands

```
npm run typecheck     tsc --noEmit
npm test              vitest run
npm run db:generate   drizzle-kit generate  (after any schema change)
npm run ios           requires a native dev build, not Expo Go
```

Native modules (MMKV, Skia, SQLite) mean **Expo Go will not work** — a development
build is required.

## Code standard

The house `clean-code` skill governs: functions ≤20 lines, one job each, ≤3 params,
no flag parameters, named constants, guard clauses over nesting, comments explain
*why*. Run `clean-code-review` over the diff before calling a milestone done.
