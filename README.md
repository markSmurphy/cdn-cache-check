# cdn-cache-check

![Version](https://img.shields.io/npm/v/cdn-cache-check.svg?style=plastic)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/9036b897af074a8ba94d5a22e24e5680)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=MarkSMurphy/cdn-cache-check&amp;utm_campaign=Badge_Grade)
[![Known Vulnerabilities](https://snyk.io/test/npm/cdn-cache-check/1.0.0/badge.svg)](https://snyk.io/test/npm/cdn-cache-check/1.0.0)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/cdn-cache-check?style=plastic)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/cdn-cache-check.svg?style=plastic)
![Downloads](https://img.shields.io/npm/dm/cdn-cache-check.svg?style=plastic)
![Licence](https://img.shields.io/npm/l/cdn-cache-check.svg?style=plastic)

## Quick Start

```text
npm -g cdn-cache-check

ccc https://example.com/file.js
```

![`ccc-QuickStart`](https://marksmurphy.github.io/img/ccc-QuickStart.gif)

---

## Overview

If you've ever wondered what your CDN might be caching, then this utility may help.  Provide one or more URLs to resources which are behind a CDN and `cdn-cache-check` will parse the response headers to ascertain:

* If the resource is cacheable
* If the response was served via the CDN cache, or via the origin
* The age of the cached object
* If the response was compressed

## Installation

```text
npm -g install cdn-cache-check
```

---

## Usage

## Options

### url

### filename

### method

### headers *collection*

### list-header-collections

### list-response-headers

### iterations

### interval

### --no-color

Switches off colour output.  Useful if piping output somewhere which doesn't handle the unicode control codes.

### --version

Display the version number.

### --help

Display the help screen.

## Examples

### Check a single URL

### Check multiple URLs

### Check URLs from a text file

### Select **Header Collection**

### Create new **Header Collection**

---

## Features

### CDN Detection

### Handling redirects

---

## Debugging

## FAQ

* [Where is the Change Log?](#where-is-the-change-log)

### Where is the Change Log

The `CHANGELOG.md` can be found [here](./CHANGELOG.md)
