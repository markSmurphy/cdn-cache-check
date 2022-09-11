# To Do

## Bugs

* Improve "Scanning Azure services" UI
* Make sure each domain gets:
  * DNS resolution
  * DNS inspection
  * Service Scans
* Improve constants and general response object property names
* WTF is previousAWS
* `CDN detection complete on {total} unique domains` isn't an accurate message.  HTTP requests are complete, perhaps

---

* [ ] Fix handling services which resolve to known DNS apex zones but are also AWS services (the AWS service details should enrich the DNS zone apex details rather than replace them)
* [ ] Fix AWS service lookup where the IP address appears in multiple CIDR blocks
* [ ] If the input does not have a valid top level domain then assume it's a file, and report `file not found` accordingly; e.g. `ccc filename.txt` as `.txt` is not a valid TLD
* [ ] A URL whose domain is not resolved (`ENOTFOUND`) is still included in the CDN Detection and is reported as `Unknown` - e.g. `node .\ccc.js iplayer.bbc.co.uk`
  * [ ] Need to handle an empty `answer.answer[]` array, and parseAnswer() returning something more useful than `'no_address'`
* [ ] If a request redirects to a new domain and we follow that redirect, the target domain isn't in the `uniqueDomains` Set
* [ ] Handle misspelt filename being treated as URL
* [ ] `--interval` & `--iterations` do not work as intended
* [ ] Check for invalid hostnames in valid URLs (where `https://*.allowed.com/` passes the valid-URL test but `*.allowed.com` is validated as a domain):

  ```text
    Checking if [https://*.allowed.com/] is a file, URL or bare domain ...
    It's a valid URL
  ```

* [ ] Fix the progress indicator flickering. Perhaps move to an alternative library like [Node.CLI-Progress](https://github.com/AndiDittrich/Node.CLI-Progress)
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
  * [X] debug

## Features

* Move DNS timeout (5000 - ccc-dnc.js:150) into configuration and give it a command line override
* [ ] Add Azure IP ranges `json` to `service.providers`
  * [specific json file](https://download.microsoft.com/download/7/1/D/71D86715-5596-4529-9B13-DA13A5DE5B63/ServiceTags_Public_20210524.json)
  * [download page](https://www.microsoft.com/en-us/download/details.aspx?id=56519)
* [ ] Add CloudFlare IP ranges to `service.providers`
  * [ ] [https://www.cloudflare.com/en-gb/ips/](https://www.cloudflare.com/en-gb/ips/)
* [ ] Add Fastly IP ranges to `service.providers`
  * [ ] [https://api.fastly.com/public-ip-list](https://api.fastly.com/public-ip-list)
* [ ] Add GEO location lookup of IP address hosting each resource via [IP Who Is](https://ipwhois.io/documentation#tabs-format)
* [ ] Add option to emulate `user-agent` of popular browsers or provide a custom user-agent string
* [ ] Add an asynchronous update of AWS [ip-ranges.json](https://ip-ranges.amazonaws.com/ip-ranges.json) based on the `syncToken` property
* [ ] Add DNS options to `configuration.json`
  * [ ] Allow command line override for DNS options
* [ ] Add a mechanism to provide advice - when a `read_timeout` occurs inform the user of the argument to increase it
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
* [ ] Some sites (such as `www.etsy.com` & `www.amazon.co.uk`) use multiple CDNs for the domain depending where the client is. Mention this in a *README* section, but fix it by turning `ddig` into a library and querying multiple resolvers for the full `CNAME` chain before performing CDN detection.
* [X] Add a **reason** to `cdnDetection()` output when `--verbose` is enabled
* [ ] Command line arguments for `needle` http options:
  * [ ] `timeout`
  * [ ] `response_timeout`
  * [ ] `read_timeout`
  * [X] `follow`
  * [ ] `compress`
  * [ ] et al
* [ ] Implement full debug request/response logging
  * [ ] Perhaps to a `.har` file
  * [ ] Export all response headers to separate `csv` file when `debug` || `verbose` is enabled
* [ ] Provide a friendly interpretation of caching based on CDN's x-cache documentation
  * [ ] Perhaps workout a score based upon `x-cache`, `cache-control`, `eTag`, et al
* [ ] Investigate merits of implementing a custom [http_agent](https://nodejs.org/api/http.html#http_class_http_agent)

---

## Fixed

* [X] Default DNS resolver is hardcode to `8.8.8.8` but should be local DNS resolver `dns.getServers()`
* [X] The customised `user-agent` isn't being set properly in `needle` client request
* [X] Add AWS service detection based upon [AWS IP Ranges](https://ip-ranges.amazonaws.com/ip-ranges.json) and using [cidr.contains(address)](https://www.npmjs.com/package/ip-cidr#containsaddress)
* [X] ~~The status column may display `undefined` when the error occurred at the network level (not a HTTP response)~~
* [X] ~~Add support for input file type `.har` to extract resource URLs from it~~
* [X] ~~`--open` doesn't work as intended (it doesn't open the csv file)~~
* [X] ~~`--export` doesn't work as intended (it doesn't turn exportToCSV on or off)~~
* [X] ~~`--headers [collection]` is case sensitive meaning `ccc https://www.mozilla.org/ --headers cors` causes a warning while `ccc https://www.mozilla.org/ --headers CORS` succeeds~~
* [X] ~~`--help` examples should match `readme` examples~~
* [X] ~~`getDefaults()` appears to called three times when executing `ccc --list-header-collections`~~
* [X] ~~`--list-header-collections` is not sorted alphabetically~~
* [X] ~~`--list-response-headers` also performs CDN detection but should probably be constrained to *just* listing the headers~~
* [X] ~~Add padding character to CDN Detection table to aid readability~~
* [X] ~~Display an activity indicator whilst the HTTP requests are being made (maybe [ora](https://www.npmjs.com/package/ora))~~
* [X] ~~Add an indicator (®) to the response output row when a redirect was followed, and add the redirect count to the raw `csv` export file~~
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
* [X] ~~Replace `CDN detection` with `DNS Inspection`~~
