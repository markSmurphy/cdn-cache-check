# To Do

## Bugs

* [ ] The customised `user-agent` isn't being set properly in `needle` client request
* [ ] If the input does not have a valid top level domain then assume it's a file, and report `file not found` accordingly; e.g. `ccc filename.txt` as `.txt` is not a valid TLD
* [ ] A URL whose domain is not resolved (`ENOTFOUND`) is still included in the CDN Detection and is reported as `Indeterminate` - e.g. `node .\ccc.js iplayer.bbc.co.uk`
  * [ ] Need to handle an empty `answer.answer[]` array, and parseAnswer() returning something more useful than `'no_address'`
* [ ] If a request redirects to a new domain and we follow that redirect, the target domain isn't in the `uniqueDomains` Set
* [ ] Handle misspelt filename being treated as URL
* [ ] `--interval` & `--iterations` do not work as intended
* [ ] Check for invalid hostnames in valid URLs (where `https://*.allowed.com/` passes the valid-URL test but `*.allowed.com` is validated as a domain):

  ```text
    Checking if [https://*.allowed.com/] is a file, URL or bare domain ...
    It's a valid URL
  ```

* [ ] Investigate the wisdom of waiting for the external app to close before continuing when opening the `.csv` file. Perhaps make the behavior a switch:

  ```JavaScript
  (async () => {
    // Opens the image in the default image viewer and waits for the opened app to quit.
    await open(filename);
  })();
  ```

* [ ] `--help` screen doesn't reflect all command line switches
  * [X] export
  * [X] open
  * [ ] http options
  * [ ] debug

## Features

* [ ] Add AWS service detection based upon [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json) and using [cidr.contains(address)](https://www.npmjs.com/package/ip-cidr#containsaddress)
* [ ] Improve CDN Detection by examining telltale response headers (such as `server: cloudfront`)
* [ ] Detect if `--list-header-collections` is being piped to a file and output raw `json` (i.e. only use `prettyjson` for console output)
* [ ] Add colour indicators for the response headers:
  * [ ] `vary` - where `*`, `user-agent`, `cookie` are all anti-patterns for CDN caching
  * [ ] `content-encoding` - where not being `gzip`, `br`, et al is sub-optimal
* [ ] HTTP/2 Support (or reporting support against each unique domain)
* [ ] Change the `exportToCSV()` function to save files to a `ccc` specific subfolder
* [ ] Add a modifier to `--open` which opens the folder
* [ ] Add support for input file type Lighthouse `.json` to extract resource URLs from
* [ ] Allow modification of DNS question (`resolver` etc) and move defaults to config file.
* [ ] Report on CNAME TTL for each unique domain
* [ ] eTag support - Allow conditional `GET` requests such as `If-None-Match` to analyse Entity Tags
* [ ] Allow request headers to be injected
  * [ ] Automatically inject request headers array as part of header collection
    * [ ] i.e. Add `fastly-debug:1` to all requests when the Fastly header collection is used
* [ ] Add console width warning if it's too narrow (`process.stdout.columns`)
* [ ] Some sites (such as `www.etsy.com` & `www.amazon.co.uk`) use multiple CDNs. Mention this in a *README* section, but fix it by turning `ddig` into a library and querying multiple resolvers for the full `CNAME` chain before performing CDN detection.
* [ ] Add a **reason** to `cdnDetection()` output when `--verbose` is enabled
* [ ] Command line arguments for `needle` http options:
  * [ ] `timeout`
  * [ ] `response_timeout`
  * [ ] `read_timeout`
  * [ ] `follow`
  * [ ] et al
* [ ] Implement full debug request/response logging
  * [ ] Perhaps to a `.har` file
  * [ ] Export all response headers to separate `csv` file when `debug` || `verbose` is enabled
* [ ] Provide a friendly interpretation of caching based on CDN's x-cache documentation
  * [ ] Perhaps workout a score based upon `x-cache`, `cache-control`, `eTag`, et al
* [ ] Investigate merits of implementing a custom [http_agent](https://nodejs.org/api/http.html#http_class_http_agent)

---

## Fixed

* [X] Add support for input file type `.har` to extract resource URLs from it
* [X] ~~`--open` doesn't work as intended (it doesn't open the csv file)~~
* [X] ~~`--export` doesn't work as intended (it doesn't turn exportToCSV on or off)~~
* [X] ~~`--headers [collection]` is case sensitive meaning `ccc https://www.mozilla.org/ --headers cors` causes a warning while `ccc https://www.mozilla.org/ --headers CORS` succeeds~~
* [X] ~~`--help` examples should match `readme` examples~~
* [X] ~~`getDefaults()` appears to called three times when executing `ccc --list-header-collections`~~
* [X] ~~`--list-header-collections` is not sorted alphabetically~~
* [X] ~~`--list-response-headers` also performs CDN detection but should probably be constrained to *just* listing the headers~~
* [X] ~~Add padding character to CDN Detection table to aid readability~~
* [X] ~~Display an activity indicator whilst the HTTP requests are being made (maybe [ora](https://www.npmjs.com/package/ora))~~
* [X] ~~Add an indicator [®] to the response output row when it's followed a redirect, and the redirect count to the raw `csv` export file~~
* [X] ~~Add the actual `hostname` being resolved to `parseAnswer()` so that it's included in the `determineCDN()` logic~~
* [X] ~~Export to CSV~~
* [X] ~~Expand `settings` to incorporate `needle`'s options json~~
* [X] ~~Filter response headers based on selected header collection~~
* [X] ~~Format output into columns~~
* [X] ~~Implement `--header-collections`~~
* [X] ~~Implement `--headers`~~
* [X] ~~Collect all unique response headers and optionally list them out `--list-response-headers`~~
* [X] ~~Add timestamp into output columns~~
* [X] ~~Colour output to indicate cache hit & cache miss~~
* [X] ~~Implement iterations~~
* [X] ~~Expand `user-agent` {variables} when reading config~~
* [X] ~~Investigate the spurious `400` responses~~
* [X] ~~Allow customisation of user-agent string (avoid bot detection)~~
* [X] ~~Investigate why req.path has `needle` options `json` concatenated~~
* [X] ~~Added `exportToCSV` to settings~~
* [X] ~~Add option to `openAfterExport`~~
* [X] ~~Implement command line switch to enable/disable `openAfterExport`~~
* [X] ~~Implement command line switch to enable/disable `exportToCSV`~~
* [X] ~~Implement `settings.options.httpOptions` passed through to `needle`~~
* [X] ~~Attempt CDN detection based on `CNAME` apex domain.~~
