# cdn-cache-check

![Version](https://img.shields.io/npm/v/cdn-cache-check.svg?style=plastic)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/cc31d7b0b6274073a6181b3e7442d1a3)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=MarkSMurphy/cdn-cache-check&amp;utm_campaign=Badge_Grade)
[![Known Vulnerabilities](https://snyk.io/test/npm/cdn-cache-check/1.0.0/badge.svg)](https://snyk.io/test/npm/cdn-cache-check/1.0.0)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/cdn-cache-check.svg?style=plastic)
![Downloads](https://img.shields.io/npm/dm/cdn-cache-check.svg?style=plastic)
![Licence](https://img.shields.io/npm/l/cdn-cache-check.svg?style=plastic)

## Overview

If you've ever wondered what your CDN might be caching, then this utility may help.  Provide one or more URLs to resources which are behind a CDN and `cdn-cache-check` will parse the response headers to ascertain:

* If the resource is cacheable
* If the response was served via the CDN cache, or via the origin
* The age of the cached object
* If the response was compressed

## Quick Start

```text
npm -g cdn-cache-check

ccc https://example.com/file.js
```

![`ccc-QuickStart`](https://marksmurphy.github.io/img/ccc-QuickStart.gif)

---

## Installation

```text
npm -g install cdn-cache-check
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

## Future support

### Request header amending

* User-Agent
* Cookie
* Authorization
* Accept-Encoding
* Range
* From
* Origin
* Referer

### CORS

Allowing inclusion of CORS request headers and analysis of response

### Entity Tags

Allowing conditional `GET` requests such as `If-None-Match`

### HTTP/2

Allowing HTTP/2 requests could be useful.
