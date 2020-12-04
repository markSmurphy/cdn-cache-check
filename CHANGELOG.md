# Changelog

## [1.x.x] - *Unreleased*

### Added

* Updated CDN Detection to include **Max CDN**.
* Updated CDN Detection to include **StackPath CDN**.

---

## [1.1.0] - 1<sup>st</sup> December 2020

### Changed

* Updated `--help` text to match `README.md` documentation.

### Fixed

* Refactored `configuration.js` so that `getDefaults()` is called just once, rather than once per exported function. Not only is this now more efficient, but it cuts down on the `--debug` output making it more readable.
* `--headers [collection]` is now case *insensitive*, so argument values that don't match the case in the `defaults.json` file no longer cause a warning.

---

## [1.0.1] - 29<sup>th</sup> November 2020

### Changed

* Updated badge URLs in `README.md`.

---

## [1.0.0] - 29<sup>th</sup> November 2020

Initial release.

---
