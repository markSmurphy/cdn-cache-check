const debug = require('debug')('ccc-render-results');
debug('Entry: [%s]', __filename);

// Initialise console colours
const chalk = require('chalk');

function exportToCSV(outputTableRaw, settings) {
   if (settings.options.exportToCSV) {          // Check if `export to CSV` is enabled
      // Import packages
      const jsonexport = require('jsonexport'); // For converting JSON to CSV
      const utils = require('./utils');         // Library of general helper functions
      const fs = require('fs');                 // Initialise File System object
      const EOL = require('os').EOL;            // Platform independent new line character and path separator

      // Perform conversion of JSON output to CSV
      jsonexport(outputTableRaw, (err, csv) => {

         if (err) { // Check for an error
            console.error(`${chalk.redBright('An error occurred converting the results into a CSV format: ')}%O`, err);
         } else {
            let filename = utils.generateUniqueFilename('csv');

            // Write the results to file
            try {
               fs.writeFileSync(filename, csv);

               // Notify the user where the file is saved
               console.log(EOL); // New line
               console.log(chalk.grey('Results written to [%s]'), filename);
               console.log(EOL); // New line

               // Open the file if configured to do so
               if (settings.options.openAfterExport) {
                  debug('Opening [%s] ...', filename);

                  let open = require('open');

                  (async () => {
                     // Opens the image in the default image viewer and waits for the opened app to quit.
                     await open(filename);
                  })();
               }
            } catch (error) {
               settings.options.exportToCSV = false; // Switch off further exporting to a file seeing as it hasn't worked
               debug('An error occurred writing to results to disk. Switching off "exportToCSV".');
               console.error(`${chalk.redBright('An error occurred writing to the file [%s]: ')}%O`, filename, error);
            }
         }
      });
   }
}


let renderHTTPResponses = (responses, settings) => {
   return new Promise(function (resolve, reject) {

      // Import packages
      const { parse } = require('@tusbar/cache-control'); // Cache-control header parser
      const matcher = require('multimatch');              // Initialise wildcard string parser
      const columnify = require('columnify');             // Console output formatting into columns

      if ((Array.isArray(responses) && responses.length)) { // Process responses[] array
         debug('Parsing %s responses', responses.length);

         // We'll collate the parsed results into an output array
         let outputTable = [];

         // We'll also collect the raw (unformatted for console output) which we'll use in exportToCSV;
         let outputTableRaw = [];

         // Iterate through responses[] array
         for (let i = 0; i < responses.length; i++) {
            // Each request/response will constitute a row in each of the output tables (formatted & raw)
            let row = {};
            let rowRaw = {};

            // Indicate if a redirect was followed
            if (settings.options.httpOptions.follow > 0) {
               // Add the column and a placeholder for the redirects indicator
               row.Redirects = ' ';
               // Add the integer value to the raw results
               rowRaw.Redirects = responses[i].redirectCount;
               if (responses[i].redirectCount > 0) { // If the request resulted in one or more redirects, add the indicator character to the results
                  row.Redirects = global.CCC_OUTPUT.REDIRECT_INDICATOR;
               }
            }

            // Populate basic request details
            let timestamp = new Date();

            // Pad the hours/mins/secs/mSecs with a leading '0' and then return (trim) the last 2 rightmost characters to ensure a leading zero for 1 digit numbers
            let responseTimestamp = `${(`0${timestamp.getHours()}`).slice(-2)}:${(`0${timestamp.getMinutes()}`).slice(-2)}:${(`0${timestamp.getSeconds()}`).slice(-2)}:${(`0${timestamp.getMilliseconds()}`).slice(-2)}`;
            row.Time = chalk.reset(responseTimestamp);
            rowRaw.Time = responseTimestamp;

            // Populate response status code, with colour indicator of success or failure
            if (Number.isInteger(responses[i].statusCode)) {

               if (responses[i].statusCode >= 400) {
                  // Failure response code, 4xx & 5xx
                  row.Status = chalk.red(responses[i].statusCode);

               } else if (responses[i].statusCode >= 300) {
                  // Redirect response code (3xx)
                  row.Status = chalk.yellow(responses[i].statusCode);

               } else {
                  // Success response code (1xx, 2xx)
                  row.Status = chalk.green(responses[i].statusCode);
               }
            } else if (responses[i].error) {
               row.Status = chalk.bgRed.whiteBright(responses[i].statusCode);
            }

            // Write the status code to the raw output
            rowRaw.Status = responses[i].statusCode;

            // Record server hostname
            row.Host = chalk.cyan(responses[i].request.host);
            rowRaw.Host = responses[i].request.host;

            // Record URL path
            row.Path = chalk.cyan(responses[i].request.path);
            rowRaw.Path = responses[i].request.path;
            rowRaw.Protocol = responses[i].request.protocol;
            rowRaw.URL = responses[i].request.url;

            // Pull out select response headers
            for (let attributeName in responses[i].response.headers) {
               let attributeValue = responses[i].response.headers[attributeName];

               // Check if the response header's name matches one in the header collection
               if (matcher(attributeName, settings.headerCollection, { nocase: true }).length > 0) {
                  debug('Extracting header ==> %s : %s', attributeName, attributeValue);

                  // Add all response headers/values to raw collection here, for use in exportToCSV()
                  rowRaw[attributeName] = attributeValue;

                  // Parse header value for cache-control directives (for use inside the following switch blocks)
                  let clientCache = parse(attributeValue);

                  switch (attributeName.toLowerCase()) {
                     case 'cache-control': {
                        if ((clientCache.noStore === false) && (clientCache.maxAge > 0)) {
                           // Response IS cacheable.  Colour it GREEN
                           row[attributeName] = chalk.green(attributeValue);

                        } else if ((clientCache.noStore === true) || (clientCache.maxAge === 0)) {
                           // Response is NOT cacheable.  Colour it RED
                           row[attributeName] = chalk.red(attributeValue);

                        } else {
                           // Unknown cache state.  Colour it YELLOW
                           row[attributeName] = chalk.yellow(attributeValue);
                        }
                        break;
                     }
                     case 'x-cache': {
                        // Examine x-cache value
                        if (attributeValue.toLowerCase().search('hit') !== -1) {
                           // Cache HIT.  Colour it GREEN
                           row[attributeName] = chalk.green(attributeValue);

                        } else if (attributeValue.toLowerCase().search('miss') !== -1) {
                           // Cache MISS.  Colour it RED
                           row[attributeName] = chalk.red(attributeValue);

                        } else {
                           // Unknown cache state.  Colour it YELLOW
                           row[attributeName] = chalk.yellow(attributeValue);
                        }
                        break;
                     }
                     default:
                        // Add row with no formatting
                        row[attributeName] = chalk.reset(attributeValue);
                  }

               } else {
                  debug('Ignoring header --> %s', attributeName);
               }
            }

            outputTable.push(row); // Append completed row to the table
            outputTableRaw.push(rowRaw);
         }

         // The Raw output is complete. Export it to CSV
         if (settings.options.exportToCSV) {
            exportToCSV(outputTableRaw, settings);
         }

         // Format output into columns for console output
         let columns = columnify(outputTable, {
            maxWidth: 35,
            showHeaders: true,
            preserveNewLines: true,
            truncate: true,
            config: {
               'vary': { maxWidth: 20 },
               'Host': { maxWidth: 30 },
               'Path': { maxWidth: 60 },
               'Redirects': { showHeaders: false }
            }
         });

         // Return formatted output
         resolve(columns);

      } else {
         reject(new Error('renderHTTPResponses() :: responses[] array either does not exist, is not an array, or is empty.'));
      }
   });
};


let renderHTTPResponseHeaders = (responses) => {
   return new Promise(function (resolve, reject) {

      if ((Array.isArray(responses) && responses.length)) { // Process responses[] array
         // Import packages
         const EOL = require('os').EOL;                     // Platform independent new line character and path separator
         debug('Parsing %s responses for unique HTTP headers', responses.length);

         let responseHeadersReceived = [];                  // Array to store names of received response headers

         for (let i = 0; i < responses.length; i++) {                   // For each HTTP response
            for (let attributeName in responses[i].response.headers) {  // Loop through each response header
               responseHeadersReceived.push(attributeName);             // Save the header's name to an array
            }
         }

         // Dedupe the list of collected response headers
         debug('De-duplicating the collection of %i response headers', responseHeadersReceived.length);
         let uniqueResponseHeaders = [...new Set(responseHeadersReceived.sort())];
         debug('%i unique response headers', uniqueResponseHeaders.length);
         // Render results to console
         console.log('%i unique response headers (from %i collected):%s%O', uniqueResponseHeaders.length, responseHeadersReceived.length, EOL, uniqueResponseHeaders);

         resolve(true);

      } else {
         reject(new Error('renderHTTPResponseHeaders() :: responses[]] array either does not exist, is not an array, or is empty.'));
      }
   });
};

module.exports = { renderHTTPResponses, renderHTTPResponseHeaders };