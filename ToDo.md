# To Do

## Bugs

* `--open` doesn't work as intended (it doesn't open the csv file)
* `--export` doesn't work as intended (it doesn't turn exportToCSV on or off)
* If a request redirects to a new domain and we follow that redirect, the target domain isn't in the `uniqueDomains` Set
* Handle misspelt filename being treated as URL
* `--interval` & `--iterations` do not work as intended
* Check for invalid hostnames in valid URLs (where `https://*.allowed.com/` passes the valid-URL test but `*.allowed.com` is validated as a domain):

  ```text
    Checking if [https://*.allowed.com/] is a file, URL or bare domain ...
    It's a valid URL
  ```

* Investigate the wisdom of waiting for the external app to close before continuing when opening the `.csv` file. Perhaps make the behaviour a switch:

  ```JavaScript
  (async () => {
    // Opens the image in the default image viewer and waits for the opened app to quit.
    await open(filename);
  })();
  ```

* `--help` screen doesn't reflect all command line switches
  * export
  * open
  * http options
  * debug

## Features

* HTTP/2 Support (or reporting support against each unique domain)
* Change the `exportToCSV()` function to save files to a `ccc` specific subfolder
* Add a modifier to `--open` which opens the folder
* Report on CNAME TTL for each unique domain
* eTag support - Allow conditional `GET` requests such as `If-None-Match` to analyse Entity Tags
* Allow request headers to be injected
  * Automatically inject request headers array as part of header collection
    * i.e. Add `fastly-debug:1` to all requests when the Fastly header collection is used
* Add console width warning if it's too narrow (`process.stdout.columns`)
* Some sites (such as `www.etsy.com` & `www.amazon.co.uk`) use multiple CDNs. Mention this in a *README* section, but fix it by turning `ddig` into a library and querying multiple resolvers for the full `CNAME` chain before performing CDN detection.
* Add a **reason** to `cdnDetection()` output when `--verbose` is enabled
* Command line arguments for `needle` http options:
  * `timeout`
  * `response_timeout`
  * `read_timeout`
  * `follow`
  * et al
* Implement full debug request/response logging
  * Perhaps to a `har` file
  * Export all response headers to separate `csv` file when `debug` || `verbose` is enabled
* Provide a friendly interpretation of caching based on CDN's x-cache documentation
  * Perhaps workout a score based upon `x-cache`, `cache-control`, `eTag`, et al
* Investigate merits of implementing a custom [http_agent](https://nodejs.org/api/http.html#http_class_http_agent)

---

* ~~Add padding character to CDN Detection table to aid readability~~
* ~~Display an activity indicator whilst the HTTP requests are being made (maybe [ora](https://www.npmjs.com/package/ora))~~
* ~~Add an indicator [®] to the response output row when it's followed a redirect, and the redirect count to the raw `csv` export file~~
* ~~Add the actual `hostname` being resolved to `parseAnswer()` so that it's included in the `determineCDN()` logic~~
* ~~Export to CSV~~
* ~~Expand `settings` to incorporate `needle`'s options json~~
* ~~Filter response headers based on selected header collection~~
* ~~Format output into columns~~
* ~~Implement `--header-collections`~~
* ~~Implement `--headers`~~
* ~~Collect all unique response headers and optionally list them out `--list-response-headers`~~
* ~~Add timestamp into output columns~~
* ~~Colour output to indicate cache hit & cache miss~~
* ~~Implement iterations~~
* ~~Expand `user-agent` {variables} when reading config~~
* ~~Investigate the spurious `400` responses~~
* ~~Allow customisation of user-agent string (avoid bot detection)~~
* ~~Investigate why req.path has `needle` options `json` concatenated~~
* ~~Added `exportToCSV` to settings~~
* ~~Add option to `openAfterExport`~~
* ~~Implement command line switch to enable/disable `openAfterExport`~~
* ~~Implement command line switch to enable/disable `exportToCSV`~~
* ~~Implement `settings.options.httpOptions` passed through to `needle`~~
* ~~Attempt CDN detection based on `CNAME` apex domain.~~
