# cloudfront-cache-check

![Version](https://img.shields.io/npm/v/cloudfront-cache-check.svg?style=plastic)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/acf4ae9001a0486497a4b12c4ccbbd44)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=MarkSMurphy/cloudfront-cache-check&amp;utm_campaign=Badge_Grade)
[![Known Vulnerabilities](https://snyk.io/test/npm/cloudfront-cache-check/1.0.0/badge.svg)](https://snyk.io/test/npm/cloudfront-cache-check/1.0.0)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/cloudfront-cache-check.svg?style=plastic)
![Downloads](https://img.shields.io/npm/dm/cloudfront-cache-check.svg?style=plastic)
![Licence](https://img.shields.io/npm/l/cloudfront-cache-check.svg?style=plastic)

## Overview

If you've ever wondered what CloudFront might be doing then this utility may help.  Provide one or more URLs to resources which are behind CloudFront and `cloudfront-cache-check` will parse the response headers to ascertain:

* If the resource is cacheable
* If the response was served via the CDN cache, or via the origin
* The age of the cached object
* If the response was compressed

## Quick Start

```text
npm -g cloudfront-cache-check

ccc https://example.com/file.js
```

![`ccc-QuickStart`](https://marksmurphy.github.io/img/ccc-QuickStart.gif)

---

## Installation

```text
npm -g install cloudfront-cache-check
```

---

## Options

You can use the `--help` option to list all of the options.

### URL

---TBC---

### --no-color

Switches off colour output.  Useful if piping output somewhere which doesn't handle the unicode control codes.

### --version

Display the version number.

### --help

Display the help screen.

![`ccc --help`](https://marksmurphy.github.io/img/ccc-help.png)
