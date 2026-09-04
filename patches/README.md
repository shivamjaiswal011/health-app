# Patches

Applied automatically by `patch-package` on `postinstall`.

## expo-modules-jsi+57.0.7.patch

**Why:** Expo SDK 57 does not compile against Xcode 26.3. `RuntimeScheduler.h`
annotates two C++ *constructors* with `SWIFT_RETURNS_RETAINED`, and the Swift
compiler shipped with Xcode 26.3 rejects that attribute on constructors:

```
error: 'RuntimeScheduler' cannot be annotated with either SWIFT_RETURNS_RETAINED
or SWIFT_RETURNS_UNRETAINED because it is not returning a SWIFT_SHARED_REFERENCE type
```

**Fix:** remove the attribute from both constructors. Swift already imports
constructors of a `SWIFT_SHARED_REFERENCE` type as `+1` retained, so the annotation
was redundant — which is exactly why the newer compiler now rejects it. Behaviour
is unchanged.

**Upstream status:** present in 57.0.7 and 57.0.8 (latest at time of writing).
Re-check on every Expo upgrade; delete this patch once upstream fixes it, or
regenerate it if the header moves.
