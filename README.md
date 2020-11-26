# cdn-cache-check

![Version](https://img.shields.io/npm/v/cdn-cache-check.svg?style=plastic)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/9036b897af074a8ba94d5a22e24e5680)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=MarkSMurphy/cdn-cache-check&amp;utm_campaign=Badge_Grade)
[![Known Vulnerabilities](https://snyk.io/test/npm/cdn-cache-check/1.0.0/badge.svg)](https://snyk.io/test/npm/cdn-cache-check/1.0.0)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/cdn-cache-check?style=plastic)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/cdn-cache-check.svg?style=plastic)
![Downloads](https://img.shields.io/npm/dm/cdn-cache-check.svg?style=plastic)
![Licence](https://img.shields.io/npm/l/cdn-cache-check.svg?style=plastic)

HTTP caching is an important component in the delivery of a fast web site. This command line utility helps to analyse URLs to determine if they're served via a CDN and the caching behaviours of both the CDN and the user-agent.

## Quick Start

Install globally using:

```text
npm -g install cdn-cache-check
```

Check a single URL using `ccc [URL]`:

```text
ccc https://www.rolex.com/
```

![cdn-cache-check - Single URL](https://marksmurphy.github.io/img/ccc.single.url.gif)

---
Check multiple URLs using `ccc [URL [URL […]]]`:

```text
ccc https://www.rolls-royce.com/ https://www.rolls-roycemotorcars.com/
```

![cdn-cache-check - Multiple URLs](https://marksmurphy.github.io/img/ccc.multiple.urls.gif)

---
Check a list of URLs read from a text file using `ccc [filename]`:

```text
ccc URLs.examples.txt
```

![cdn-cache-check - Single text file](https://marksmurphy.github.io/img/ccc.single.file.gif)

Where `URLs.examples.txt` contains:

```text
#List of example URLs
www.twitch.tv
www.reddit.com
www.stackoverflow.com
www.adobe.com
https://www.wired.com/
https://www.rolex.com/
```

---

## Overview

If you're looking into web site performance then, at some stage of your analysis, you'll be interested in caching, compression and CDNs.  `cdn-cache-check` aims to help with this task by making HTTP requests to one, or 100's of, URLs and analysing certain response headers.

The headers are displayed in columns with colours indicating how optimal they are.

![cdn-cache-check - Example of e-commerce domains](https://marksmurphy.github.io/img/ccc.example.ecommerce.gif)

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

### Explanation of header analysis and colour coding

### Handling redirects

Also mention the redirect indicator ® and hte redirect count in the `csv` export file

### Error handling/reporting

Example:

```bash
node ccc.js https://www.wallmart.com/
TIME        STATUS                       HOST             PATH
12:25:27:06 ERR_TLS_CERT_ALTNAME_INVALID www.wallmart.com /
Results written to [C:\Users\markm\AppData\Local\Temp\ccc-2020112-6fe61c30.csv]

CDN Detection in progress ...
www.wallmart.com Akamai
```

---

## Debugging

## FAQ

* [Where is the Change Log?](#where-is-the-change-log)

### Where is the Change Log

The `CHANGELOG.md` can be found [here](./CHANGELOG.md)
