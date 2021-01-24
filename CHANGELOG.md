# Changelog

## [1.6.0] - *unreleased*

### Added

* Improve clarity of service detection when both DNS chain inspection and AWS service CIDR block inspection yield information
* Added `*.fbcdn.net` apex domain to CDN detection for `Facebook CDN`.
* Added `Highwinds Network Group CDN` to CDN detection.
* Added `Shopify CDN` to CDN detection.
* Added `DigitalOcean Spaces` to CDN detection.
* Added Node.js version requirements to `README.md` badges.

### Changed

* Updated [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json) to `2021-01-22-18-04-19` (Sync Token: `1611338659`).
* Updated dependency `jsonexport` to version `3.2.0`.
* Updated dependency `needle` to version `2.6.0`.
* Updated dependency `open` to version `7.3.1`.
* Updated dependency `ora` to version `5.3.0`.
* Updated dependency `pretty-error` to version `3.0.3`.
* Updated dependency `supports-color` to version `8.1.1`.

---

## [1.5.1] - 18<sup>th</sup> December 2020

### Added

* Added `--debug` to help screen text.

### Changed

* Changed the DNS query to use the locally configured resolver via [dns.getServers()](https://nodejs.org/api/dns.html#dns_dns_getservers) instead of a hardcoded `8.8.8.8`, which is still the fallback if an error occurs.

---

## [1.5.0] - 16<sup>th</sup> December 2020

### Fixed

* Fixed the customised `user-agent` not being applied to `HTTP` requests.

### Added

* Added [Yottaa](https://www.yottaa.com/) to CDN detection.

### Changed

* Updated dependency `supports-color` to v8.1.0

---

## [1.4.1] - 11<sup>th</sup> December 2020

### Fixed

* Fixed `ENOENT` error when trying to read `/service.providers/aws/ip-ranges.json` when installed globally.

---

## [1.4.0] - 11<sup>th</sup> December 2020

### Added

* Increased default DNS timeout to `5000`ms.
* Added detection rules for `AWS ELB` DNS CNAME chain.
* Added AWS service detection based upon finding a domain's IP address within the CIDR blocks listed in the [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json).
  This was primarily added to enable detection of CloudFront domains which have been setup using a Route53 `ALIAS` record, but has the secondary benefit of detecting all AWS services not fronted by a CDN ... as demonstrated when executing a detection off a `.har` file recorded from the [AWS Speed Test site](http://awsspeedtest.xvf.dk/)
  ![ccc - AWS Service Detection](https://marksmurphy.github.io/img/ccc.example.aws.service.detection.gif)

### Changed

* Updated detection rules for `MaxCDN/StackPath`.
* Changed `Undetermined` to `Unknown` when CDN detection is inconclusive.
* Updated dependency `tlds` to v1.216.0

### Fixed

* Fixed handling of network level exception handling where a TCP timeout would result in `undefined` being shown in the `Status` column.

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
