const debug = require('debug')('cdn-cache-check-http');
debug('Entry: [%s]', __filename);

//Load configuration library
const config = require('./ccc-configuration');

// Load error handling
const { CccError, CccErrorTypes } = require('./ccc-lib');

// Initialise 'needle' HTTP client
const needle = require('needle');

/**
 * Issue HTTP request with rate limiting
 * @param {string} url - The URL to request
 * @param {string} method - HTTP method
 * @param {object} httpOptions - HTTP options
 * @returns {Promise} Promise that resolves with the result object
 */
function issueRequest(url, method, httpOptions) {
   return new Promise((resolve) => {
      // Initialise result object
      let result = config.initResponseObject();

      // Parse URL into component parts
      let requestURL = new URL(url);

      // Populate the request properties for reference
      result.request.protocol = requestURL.protocol;
      result.request.host = requestURL.hostname;
      result.request.path = requestURL.pathname;
      result.request.url = url;

      debug(`Issuing HTTP ${method.toUpperCase()} request to [${url}]...`);

      // Send HTTP request for current URL
      let resp = needle.request(method, url, '', httpOptions, (error, response) => {
         debug('Callback for [%s] received', url);

         if (error) {
            debug('Error for [%s]: %O', url, error);

            // Log error to JSON result
            result.error = true;
            result.response.headers = [];

            // The 'error' object may have different properties depending on the cause (e.g. HTTP error vs network error)
            if (Object.prototype.hasOwnProperty.call(error, 'code')) {
               result.statusCode = error.code;
            } else if (Object.prototype.hasOwnProperty.call(error, 'message')) {
               result.statusCode = error.message;
            } else {
               result.statusCode = 'error';
               debug('A response error occurred when requesting [%s] but the specific error code could not be extracted from the error object:', url);
               debug(error);
            }
         } else {
            // We got a HTTP response
            debug(`${response.statusCode} ${url}`);

            // Save request details and HTTP response headers as JSON
            result.statusCode = response.statusCode;
            result.request.protocol = response.req.protocol;
            result.request.host = response.req.host;
            result.request.path = response.req.path;
            result.response.headers = response.headers;
            // Get IP Address from response if it exists
            if (typeof (response.socket?.remoteAddress) === 'string') {
               result.ipAddress = response.socket.remoteAddress;
            }

            // Get the IP Family (IPv4 or IPv6) from the response if it exists
            if (typeof (response.socket?.remoteFamily) === 'string') {
               result.ipFamily = response.socket.remoteFamily;
            }
         }

         resolve(result);
      });

      resp.on('redirect', (redirectUrl) => {
         result.redirectCount += 1;
         debug('redirectCount incremented to %s by redirect event to [%s] ', result.redirectCount, redirectUrl);
      });
   });
}

/**
 * Issue HTTP requests to multiple URLs with concurrency limit
 * @param {string[]} urls - Array of URLs to request
 * @param {object} settings - Settings object with method and HTTP options
 * @returns {Promise<Array>} Promise that resolves with array of response objects
 */
let issueRequests = (urls, settings) => {
   debug('issueRequests() :: Entry');

   return new Promise(function (resolve, reject) {
      if ((Array.isArray(urls) && urls.length)) { // Process urls[] array
         debug(`The urls[] array has ${urls.length} entries`);

         // Set concurrency limit (default: 10, configurable via settings)
         const concurrencyLimit = settings.options.httpOptions.concurrency || global.CCC_HTTP_CONCURRENCY_LIMIT || 10;
         debug(`Using concurrency limit of ${concurrencyLimit}`);

         // Keep array of request/response headers
         let responses = [];
         let activeRequests = 0;
         let currentIndex = 0;

         /**
          * Process the next URL in the queue
          */
         function processNext() {
            // Check if we've processed all URLs
            if (currentIndex >= urls.length && activeRequests === 0) {
               debug(`About to resolve the issueRequests() Promise after ${responses.length} responses out of ${urls.length} requests`);
               resolve(responses);
               return;
            }

            // Process URLs while under concurrency limit
            while (activeRequests < concurrencyLimit && currentIndex < urls.length) {
               const urlIndex = currentIndex;
               const url = urls[urlIndex];
               currentIndex++;
               activeRequests++;

               debug(`(${urlIndex + 1} of ${urls.length}) - Starting request [${url}] (active: ${activeRequests})`);

               // Issue the HTTP request
               issueRequest(url, settings.method, settings.options.httpOptions)
                  .then((result) => {
                     responses.push(result);
                     activeRequests--;
                     debug('Completed request %s of %s (active: %s)', responses.length, urls.length, activeRequests);
                     processNext();
                  })
                  .catch((error) => {
                     // This shouldn't happen as issueRequest() always resolves, but handle it just in case
                     debug('Unexpected error in issueRequest: %O', error);
                     activeRequests--;
                     processNext();
                  });
            }
         }

         // Start processing
         processNext();
      } else {
         // urls[] array does not exist, is not an array, or is empty ⇒ do not attempt to process url array
         reject(new CccError(
            'URLs array either does not exist, is not an array, or is empty',
            CccErrorTypes.VALIDATION,
            { urls }
         ));
      }
   });
};

module.exports = { issueRequests };