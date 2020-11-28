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

If you're looking into web site performance you'll be interested, at some stage of your analysis, in caching, compression and CDNs. `cdn-cache-check` (or `ccc` when installed globally) aims to help with this task by making HTTP requests and reporting on the response headers that control these aspects across multiple URLs at a time.

![cdn-cache-check - Example of e-commerce domains](https://marksmurphy.github.io/img/ccc.example.ecommerce.gif)

---

## Usage

Supply `cdn-cache-check` with a URL, or the name of a text file containing URLs, and it will issue HTTP requests for each. You can supply multiple URLs or multiple filenames (separated by a `space`), and you can mix-and-match them too if you wish.

It will also attempt to detect the CDN serving each unique domain by performing a recursive DNS resolution and check if the domain resolves to a known CDN's apex domain.

```text
ccc [URL|file [URL|file […]]] [options]
```

## Options

### URL

The `URL` can be any valid URL or a bare domain, in which case `HTTPS` will be used when making the request.

```text
ccc https://example.com
```

```text
ccc example.com
```

### filename

The file should be a plain text file with a URL on each line. Lines which do not contain a valid URL or valid domain name are ignored, so you can have comments and annotation in the file if you so wish.

### --method

The default HTTP method is `GET` but you can modify this

```text
ccc example.com --method head
```

### --headers *collection*

By default the listed response headers are limited to `x-cache`, `cache-control`, `server`, `content-encoding`, `vary`, `age`; but this is just the **default** headers collection. You can use the `--headers` switch to specify and alternate collection of headers, and can use ``list-header-collections` to view all collections as described [here](#list-header-collections).

For example, there's a collection that lists **security** related response headers:

```text
ccc https://www.mozilla.org/ --headers security
```

![cdn-cache-check - Example of header collection 'security'](https://marksmurphy.github.io/img/ccc.example.header.security.gif)

### --list-header-collections

```text
ccc --list-header-collections
```

![cdn-cache-check - Example listing all header collections](https://marksmurphy.github.io/img/ccc.example.list-header-collections.gif)


### --list-response-headers



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

```text
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
