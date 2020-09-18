# To Do

* ~~Expand `settings` to incorporate `needle`'s options json~~
* ~~Filter response headers based on selected header collection~~
* ~~Format output into columns~~
* ~~Implement `--header-collections`~~
* ~~Implement `--headers`~~
* Allow request headers to be injected
* Automatically inject request headers array as part of header collection
  * i.e. Add `fastly-debug:1` to all requests when the Fastly header collection is used
* ~~Collect all unique response headers and optionally list them out `--list-response-headers`~~
* Attempt CDN detection based on `CNAME` apex domain.
* ~~Add timestamp into output columns~~
* ~~Colour output to indicate cache hit & cache miss~~
  * Friendly interpretation based on CDN's x-cache documentation
* ~~Implement iterations~~
* Implement `interval` (observed between iterations)
* ~~Expand `user-agent` {variables} when reading config~~
* Command line arguments for:
  * `timeout`
  * `response_timeout`
  * `read_timeout`
  * `follow`
* Export to CSV
  * [jsonexport](https://www.npmjs.com/package/jsonexport)
  * Perhaps export all response headers to separate `csv` file when `debug` is enabled
* Implement full debug request/response logging
* Implement progress bar when issuing many requests and/or many iterations | [npmlog](https://www.npmjs.com/package/npmlog)
* Implement `settings.options` passed through to `needle`
  * Allow `options` override from command line
* ~~Investigate the spurious `400` responses~~
* ~~Allow customisation of user-agent string (avoid bot detection)~~
* ~~Investigate why req.path has `needle` options `json` concatenated~~
* Investigate merits of implementing a custom [http_agent](https://nodejs.org/api/http.html#http_class_http_agent)

## Commands to fix

Doesn't recognise `--header-collections` nor list them out

```bash
ccc --header-collections
Error: No URL(s) provided.
```

Doesn't select the headers collection `cache`

```bash
ccc URLs.txt --headers cache
```
