# Changelog

## [1.4.0] - *Unreleased*

### Changed

* Updated detection rules for `MaxCDN/StackPath` and `AWS ELB`.

---

## [1.3.0] - 7<sup>th</sup> December 2020

### Added

* Added support for parsing HTTP Archive file format (`HAR`).
If you create a `.har` file via your browser's dev tools ...

![ccc - Save as HAR file](https://marksmurphy.github.io/img/ccc.SaveAsHAR.small.png)

You can then pass that `.har` file to `cdn-cache-check` and it will extract the URLs and make fresh requests for them:

![ccc - Example HAR file](https://marksmurphy.github.io/img/ccc.example.file.har.gif)

### Changed

* Updated dependency `yargs` to v16.2.0

---

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
