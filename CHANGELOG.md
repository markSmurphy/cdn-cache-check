# Changelog

## v2.0.0 - MMM DD<sup>th</sup> 2022

### Breaking Change

* `cdn-cache-check` now requires node version 14 or above (previously version 10 or above was supported).

### Security

* Updated `minimist` to version `1.2.6` to address [CVE-2021-44906](https://nvd.nist.gov/vuln/detail/CVE-2021-44906) (introduced via `prettyjson@1.2.5` --> `minimist@1.2.5`).
* Update `ip-cidr` to version `3.0.10`.

### Added

* A much improved service detection engine which queries cloud providers' publish IP address ranges.
* Added `Azure Service Detection`.
* Added `--verbose` option which includes a descriptive reason for the service detection results.
* Added reporting of **Application Path** to `--help --verbose` output to aid finding the `configuration.json` configuration file.
* Added `WordPress Hosting Engine` to CDN Detection

### Changed

* Updated [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json) to `"2022-03-17-23-23-26"` (Sync Token: `1647559406`).
* Updated [Azure IP Ranges](https://www.microsoft.com/en-us/download/details.aspx?id=56519) to `"2022-03-14"` (changeNumber: `193`).
* Updated dependency `debug` to version `4.3.4`.
* Updated dependency `TLDS` to version `1.231.0`.
* Updated dependency `ip-cidr` to version `3.0.9`.

---

## v1.7.0 - March 13<sup>th</sup> 2022

### Added

* Added the option `--follow` which specifies the number of chained HTTP requests to follow (`0` to disable following redirects).
* Improved `EXAMPLES` in `--help` screen.
* `Atlassian Status Page` added to service detection.

### Changed

* Updated [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json) to `"2021-06-09-19-14-14"` (Sync Token: `1623266054`).
* Updated dependency `prettyjson` to version `1.2.5`.
* Updated dependency `ip-cidr` to version `3.0.4`.
* Updated dependency `ora` to version `5.4.1`.
* Updated dependency `pretty-error` to version `3.0.4`.
* Updated dependency `is-valid-domain` to version `0.1.6`.
* Updated dependency `debug` to version `4.3.3`.
* Updated dependency `needle` to version `2.9.1`.
* Updated dependency `chalk` to version `4.1.2`.
* Updated dependency `tlds` to version `1.230.0`.
* Updated dependency `@tusbar/cache-control` to version `0.6.1`.
* Updated dependency `is-valid-domain` to version `0.1.4`.
* Updated dependency `columnify` to version `1.6.0`.

---

## v1.6.4 - May 31<sup>st</sup> 2021

### Changed

* Fixed a CDN/Service Detection bug which could result in known AWS services being listed as `Unknown`.
* Fixed a CDN/Service Detection bug which could result in a blank response for known services.
* Added HubSpot CMS Website Hosting to Service Detection

---

## v1.6.3 - May 29<sup>th</sup> 2021

### Changed

* Fixed a few string substitution bugs in `debug` logging output.
* Fixed a bug where AWS services would be reported as `Unknown` even though the IP address was in the `ip-ranges.json`
* Updated [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json) to `2021-05-28-19-24-13` (Sync Token: `1622229853`).

---

## v1.6.2 - May 11<sup>th</sup> 2021

### Security

* Updated deep dependencies to apply `lodash` fix addressing [CVE-2021-23337](https://nvd.nist.gov/vuln/detail/CVE-2021-23337).

### Changed

* Fixed a help screen typo so that it now correctly states that the default HTTP method is `GET`.
* Automatically show the help screen when there's a syntax error.
* Updated dependency `ip-cidr` to version `2.1.4`.
* Updated dependency `open` to version `7.4.2`.
* Updated dependency `tlds` to version `1.221.1`.
* Updated dependency `ora` to version `5.4.0`.
* Updated dependency `chalk` to version `4.1.1`.
* Updated dependency `is-valid-domain` to version `0.0.19`.

---

## v1.6.1 - 5<sup>th</sup> February 2021

### Changed

* Fixed a bug in `--debug` output which reported the number of unique domains as `undefined`.
* Fixed an incorrect JSON property name type in the internal default settings (i.e. the ones used if `default.json` isn't loaded correctly).
* Updated dependency `open` to version `7.4.0`.
* Fixed a bug which would result in a blank CDN Determination status instead of `Unknown`.

---

## v1.6.0 - 24<sup>th</sup> January 2021

### Added

* Improve clarity of service detection when both DNS chain inspection and AWS service CIDR block inspection yield information.
* Added `*.fbcdn.net` apex domain to CDN detection for `Facebook CDN`.
* Added `Highwinds Network Group CDN` to CDN detection.
* Added `Shopify CDN` to CDN detection.
* Added `DigitalOcean Spaces` to CDN detection.
* Added Node.js version requirements to `README.md` badges.
  * ![node-current](https://img.shields.io/node/v/cdn-cache-check?style=plastic)

### Changed

* Updated [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json) to `2021-01-22-18-04-19` (Sync Token: `1611338659`).
* Updated dependency `jsonexport` to version `3.2.0`.
* Updated dependency `needle` to version `2.6.0`.
* Updated dependency `open` to version `7.3.1`.
* Updated dependency `ora` to version `5.3.0`.
* Updated dependency `pretty-error` to version `3.0.3`.
* Updated dependency `supports-color` to version `8.1.1`.

---

## v1.5.1 - 18<sup>th</sup> December 2020

### Added

* Added `--debug` to help screen text.

### Changed

* Changed the DNS query to use the locally configured resolver via [dns.getServers()](https://nodejs.org/api/dns.html#dns_dns_getservers) instead of a hardcoded `8.8.8.8`, which is still the fallback if an error occurs.

---

## v1.5.0 - 16<sup>th</sup> December 2020

### Fixed

* Fixed the customised `user-agent` not being applied to `HTTP` requests.

### Added

* Added [Yottaa](https://www.yottaa.com/) to CDN detection.

### Changed

* Updated dependency `supports-color` to v8.1.0

---

## v1.4.1 - 11<sup>th</sup> December 2020

### Fixed

* Fixed `ENOENT` error when trying to read `/service.providers/aws/ip-ranges.json` when installed globally.

---

## v1.4.0 - 11<sup>th</sup> December 2020

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

## v1.3.0 - 7<sup>th</sup> December 2020

### Added

* Added support for parsing HTTP Archive file format (`HAR`).
If you create a `.har` file via your browser's dev tools ...

![ccc - Save as HAR file](https://marksmurphy.github.io/img/ccc.SaveAsHAR.small.png)

You can then pass that `.har` file to `cdn-cache-check` and it will extract the URLs and make fresh requests for them:

![ccc - Example HAR file](https://marksmurphy.github.io/img/ccc.example.file.har.gif)

### Changed

* Updated dependency `yargs` to v16.2.0

---

## v1.2.0 - 4<sup>th</sup> December 2020

### Added

* Updated CDN Detection to include **Max CDN**.
* Updated CDN Detection to include **StackPath CDN**.
* Added the argument `--export` which accepts a boolean value controlling whether the output is also written to a `.csv` file. Defaults to `true`.
* Added the argument `--open` which accepts a boolean value controlling whether the exported `.csv` file is automatically opened. Defaults to `false`.
![ccc - Open exported .csv file Screenshot](https://marksmurphy.github.io/img/ccc.example.open.gif)

### Changed

* Removed the ~~strikethrough~~ formatting when reporting `Undetermined` because what it conveyed was confusing.

---

## v1.1.0 - 1<sup>st</sup> December 2020

### Changed

* Updated `--help` text to match `README.md` documentation.

### Fixed

* Refactored `configuration.js` so that `getDefaults()` is called just once, rather than once per exported function. Not only is this now more efficient, but it cuts down on the `--debug` output making it more readable.
* `--headers [collection]` is now case *insensitive*, so argument values that don't match the case in the `configuration.json` file no longer cause a warning.

---

## v1.0.1 - 29<sup>th</sup> November 2020

### Changed

* Updated badge URLs in `README.md`.

---

## v1.0.0 - 29<sup>th</sup> November 2020

Initial release.

---
