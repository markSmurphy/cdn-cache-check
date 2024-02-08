const debug = require('debug')('cdn-cache-check-http');
debug('Entry: [%s]', __filename);

//Load configuration library
const config = require('./ccc-configuration');

// Initialise 'needle' HTTP client
const needle = require('needle');

let issueRequests = (urls, settings) => {
   debug('issueRequests() :: Entry');

   return new Promise(function (resolve, reject) {

      if ((Array.isArray(urls) && urls.length)) { // Process urls[] array
         // Keep array of request/response headers
         let responses = [];

         // Initialise variable to keep track of progress
         let requestCounter = 0;

         debug(`The urls[] array has ${urls.length} entries`);

         for (let i = 0; i < urls.length; i++) { // Loop through each URL

            requestCounter++; // Increment the request counter

            debug(`(${requestCounter} of ${urls.length}) - Issuing HTTP ${settings.method.toUpperCase()} request to [${urls[i]}]...`);

            // Initialise result object
            let result = config.initResponseObject();

            // Parse URL into component parts
            let requestURL = new URL(urls[i]);

            // Populate the request properties for reference
            result.request.protocol = requestURL.protocol;
            result.request.host = requestURL.hostname;
            result.request.path = requestURL.pathname;
            result.request.url = urls[i];

            // Send HTTP request for current URL
            let resp = needle.request(settings.method, urls[i], '', settings.options.httpOptions, (error, response) => {

               debug('Callback for [%s] received', urls[i]);

               if (error) {
                  debug('Error for [%s]: %O', urls[i], error);

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
                     debug('A response error occurred when requesting [%s] but the specific error code could not be extracted from the error object:', urls[i]);
                     debug(error);
                  }
               } else {
                  // We got a HTTP response
                  debug(`${response.statusCode} ${urls[i]}`);

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

               // Add request/response result to array (for later parsing once we have them all)
               responses.push(result);

               debug('Completed request %s of %s', responses.length, urls.length);

               if (responses.length === urls.length) {
                  debug(`About to resolve the issueRequests() Promise after ${responses.length} responses out of ${urls.length} requests`);
                  resolve(responses);
               }

            });

            resp.on('redirect', (url) => {
               result.redirectCount += 1;
               debug('redirectCount incremented to %s by redirect event to [%s] ', result.redirectCount, url);
            });
         }
      } else {
         // urls[] array does not exist, is not an array, or is empty ⇒ do not attempt to process url array
         reject(new Error('issueRequests() :: urls[]] array either does not exist, is not an array, or is empty.'));
      }
   });
};

module.exports = { issueRequests };