# To Do

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
