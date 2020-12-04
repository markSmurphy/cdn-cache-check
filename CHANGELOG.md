# Changelog

## [1.2.0] - 4<sup>th</sup> December 2020

### Added

* Updated CDN Detection to include **Max CDN**.
* Updated CDN Detection to include **StackPath CDN**.
* Added the argument `--export` which accepts a boolean value controlling whether the output is also written to a `.csv` file. Defaults to `true`.
* Added the argument `--open` which accepts a boolean value controlling whether the exported `.csv` file is automatically opened. Defaults to `false`.
![ccc - Open exported .csv file Screenshot](https://marksmurphy.github.io/img/ccc.example.open.gif)

### Changed

* Removed the ~~strikethrough~~ formatting when reporting `Undetermined` because what it conveyed was confusing.

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
