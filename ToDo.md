# To Do

* HTTP/2 Support (or reporting support against each unique domain)
* Report on CNAME TTL for each unique domain
* eTag support - Allow conditional `GET` requests such as `If-None-Match` to analyse Entity Tags
* If a request redirects to a new domain and we follow that redirect, add the target domain to the `uniqueDomains` Set
* Add console width warning if it's too narrow (`process.stdout.columns`)
* Add a **reason** to `cdnDetection()` output when `--verbose` is enabled
* Try to make console output easier to follow by having column headings (`HOST` and `PATH`) match output string colour (`chalk.cyan`)
  * Perhaps offer a progress monitor whilst the requests are being made and out all the columns at once using `columnify` formatting options
* ~~Implement `interval` (observed between iterations)~~
* Handle misspelt filename being treated as URL

  ```bash
  ccc URLs.CloudFront.txt --iterations 5 --interval 10000
  ```

* Check for invalid hostnames in valid URLs (where `https://*.allowed.com/` passes the valid-URL test but `*.allowed.com` is validated as a domain):

```text
  Checking if [https://*.allowed.com/] is a file, URL or bare domain ...
  It's a valid URL
```

* Fix erroneous and sporadic CDN detection. E.g. `www.amazon.co.uk` cdnDetection() erroneously being reported as `Akamai`:

```bash
ccc www.amazon.co.uk
TIME        STATUS HOST             PATH SERVER CACHE-CONTROL CONTENT-ENCODING X-CACHE
11:37:00:33 200    www.amazon.co.uk /    Server no-cache      gzip             Miss from cloudfront
Results written to [C:\Users\markm\AppData\Local\Temp\ccc-2020112-32ce04e5.csv]

CDN Detection in progress ...
www.amazon.co.uk Akamai
```

```bash
dig www.amazon.co.uk +answer

;; ANSWER SECTION:
www.amazon.co.uk.       1782    IN      CNAME   tp.bfbdc3ca1-frontier.amazon.co.uk.
tp.bfbdc3ca1-frontier.amazon.co.uk. 42 IN CNAME dmv2ch3zz9u6u.cloudfront.net.
dmv2ch3zz9u6u.cloudfront.net. 42 IN     A       143.204.189.105
```

* Investigate the wisdom of waiting for the external app to close before continuing when opening the `.csv` file. Perhaps make the behaviour a switch:

  ```JavaScript
  (async () => {
    // Opens the image in the default image viewer and waits for the opened app to quit.
    await open(filename);
  })();
  ```

* ~~Add the actual `hostname` being resolved to `parseAnswer()` so that it's included in the `determineCDN()` logic~~
* Add `error` handling to `needle` callback
* Command line arguments for:
  * `timeout`
  * `response_timeout`
  * `read_timeout`
  * `follow`
* Export to CSV
  * ~~[jsonexport](https://www.npmjs.com/package/jsonexport)~~
  * Perhaps export all response headers to separate `csv` file when `debug` is enabled
  * ~~Added `exportToCSV` to settings~~
  * ~~Add option to `openAfterExport`~~
  * Implement command line switch to enable/disable `openAfterExport`
  * Implement command line switch to enable/disable `exportToCSV`
* Implement full debug request/response logging
  * Perhaps to a `har` file
* Implement progress bar when issuing many requests and/or many iterations | [npmlog](https://www.npmjs.com/package/npmlog)
* Allow request headers to be injected
* Automatically inject request headers array as part of header collection
  * i.e. Add `fastly-debug:1` to all requests when the Fastly header collection is used
* Friendly interpretation of caching based on CDN's x-cache documentation
  * Perhaps workout a score based upon `x-cache`, `cache-control`, `eTag`, et al
* ~~Implement `settings.options.httpOptions` passed through to `needle`~~
  * Allow `options` override from command line
* ~~Attempt CDN detection based on `CNAME` apex domain.~~
* Investigate merits of implementing a custom [http_agent](https://nodejs.org/api/http.html#http_class_http_agent)
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
