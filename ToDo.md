# To Do

* ~~Expand `settings` to incorporate `needle`'s options json~~
* Filter response headers based on selected header collection
* Format output into columns
* Colour output to indicate cache hit & cache miss
  * Friendly interpretation based on CloudFront's x-cache documentation
* Implemented iterations (with interval in=between)
* Expand `user-agent` {variables} when reading config
* Command line arguments for:
  * `timeout`
  * `response_timeout`
  * `read_timeout`
  * `follow`
* Export to CSV
  * [jsonexport](https://www.npmjs.com/package/jsonexport)
  * Perhaps export whole response(s) when `debug` is enabled

## Unused components

* cli-progress
* columnify
* is-valid-domain
* matcher
* pretty-error
* supports-color
* valid-url
