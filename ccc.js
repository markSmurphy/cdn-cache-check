#!/usr/bin/env node

const debug = require('debug');//('cdn-cache-check');
debug('Entry: [%s]', __filename);
debug('Command line arguments: %O', process.argv);

// Global Constants
const constants = require('./constants');
constants.init();

// Command line options parser
const argv = require('yargs')
    .help(false)
    .argv;

// check if "debug" mode is enabled via the command line
if (argv.debug) {
    debug.enable('*');
}

// cdn-cache-check's own DNS helper functions
const cccDNS = require('./ccc-dns');

// cdn-cache-check's library functions
const cccLibrary = require('./ccc-lib');

// HTTP Archive Parsers
const harParser = require('./harparser');

// Initialise console colours
const chalk = require('chalk');

// Console output formatting for columns and colours
const columnify = require('columnify');

// Initialise File System object
const fs = require('fs');

// For exporting JSON to CSV
const jsonexport = require('jsonexport');

// Cache-control header parser
const { parse } = require('@tusbar/cache-control');

// File path parsing object
const path = require('path');

// Platform independent new line character and path separator
const EOL = require('os').EOL;

// Initialise URL validation object
const validUrl = require('valid-url');

// Initialise Domain validation object
const isValidDomain = require('is-valid-domain');

// Initialise 'needle' HTTP client
const needle = require('needle');

// Initialise wildcard string parser
const matcher = require('multimatch');

// Import terminal spinner library
const ora = require('ora');

// Initialise configuration
const config = require('./configuration');

// Library of general helper functions
const utils = require('./utils');

// Populate the settings object
var settings = config.getSettings();

if (settings.listResponseHeaders) {
    // Array to store names of received response headers, used
    var responseHeadersReceived = [];
}

try {
    // Check for '--help' command line parameters
    if (argv.help) {
        debug('--help detected.  Showing help screen.');
        // Show help screen
        let help = require('./help');
        help.helpScreen(argv.verbose);
        //Exit to terminal
        process.exit();
    }

    // '--header-collections' command line parameter is not valid. Suggest possible correction
    if (argv.headerCollections) {
        console.log(`--header-collections is not valid. Did you mean ${chalk.cyan('--list-header-collections')} ?`);
    }

    // Check for '--list-header-collections' command line parameters
    if (argv.listHeaderCollections) {
        debug('--list-header-collections detected.  Retrieving all Headers Collections....');
        // Get an array of Header Collections and render them to the console
        config.listHeaderCollections(config.getHeaderCollections());

        // Display config file location
        config.displayConfigFileLocation();

        // Exit to terminal
        process.exit();
    }

    debug('Looking for URLs to check...');
    // Initialise array of URLs to check
    var urls = [];

    // Iterate through all parameters looking for ones that are URLs or files
    for (let i = 2; i < process.argv.length; ++i) {
        let currentArgument = process.argv[i];
        // Check if it's a valid file
        try {
            debug('Checking if [%s] is a file, URL or bare domain ...', currentArgument);
            if (fs.existsSync(currentArgument)) { // File exists.  Extract URLs from it
                try {
                    if (path.extname(currentArgument).toLowerCase() === '.har') {
                        debug('It\'s a HTTP Archive (.har) file. Reading its contents ...');
                        let harURLs = harParser.getURLs(currentArgument); // Parse HAR file for a list of URLs
                        debug('The HAR file referenced %s URLs', harURLs.length);
                        urls.push(...harURLs); // Append the HAR's URLs to the global URL array
                    } else {
                        // Read the text file
                        debug('It\'s a text file. Reading its contents ...');
                        let data = fs.readFileSync(currentArgument, 'UTF-8');

                        // Split the contents by new line
                        let lines = data.split(EOL);

                        // Examine each line
                        debug('Examining %i lines looking for URLs...', lines.length);
                        for (let i = 0; i < lines.length; ++i) {
                            if (validUrl.isWebUri(lines[i])) {
                                debug('Found a URL [%s]', lines[i]);
                                urls.push(lines[i]);

                            } else if (isValidDomain(lines[i], { subdomain: true, wildcard: false })) {
                                debug('Found a bare domain [%s]', lines[i]);
                                urls.push(`https://${lines[i]}`);

                            } else if (lines[i].length > 0) {
                                // This line didn't pass any tests so log it to debug output, but only if it's not a blank line
                                debug('Ignoring [%s]', lines[i]);
                            }
                        }
                    }
                } catch (error) {
                    debug('An error occurred when parsing the file [%s]: %O', currentArgument, error);
                }
            } else if (validUrl.isWebUri(currentArgument)) {
                // It's a valid URL.  Add it to the urls array
                debug('It\'s a valid URL');
                urls.push(currentArgument);

            } else if (isValidDomain(currentArgument, { subdomain: true, wildcard: false })) {
                // It's a bare domain (i.e. there's no protocol)
                debug('It\'s a valid domain but not a URL. Adding "https://" to it');
                urls.push(`https://${currentArgument}`);

            } else {
                // It doesn't pass any tests. Ignore it
                debug('Ignoring [%s]', currentArgument);
            }
        } catch (error) {
            console.error(`An error occurred - ${error.message}`);
            debug(error);
        }
    }

    // We've got a list of URLs to check in the ${urls} array
    if (urls.length === 0) {
        console.log(chalk.red('Error: No URL(s) provided.'));
        // Show some advice
        console.log(chalk.grey(`Try ${chalk.grey.italic('ccc --help')} for syntax.`));

    } else {
        // The main work starts here
        debug('Using settings: %O', settings);

        // Initialise variables to keep track of progress
        const totalRequests = urls.length * settings.iterations;
        var requestCounter = 0;

        // Extract a list of each distinct FQDN from the list of URLs
        var uniqueDomains = cccDNS.getUniqueDomains(urls);
        debug('Unique Domains: %O', uniqueDomains);

        // Calculate how many requests we're going to make and display a notification if it exceeds the threshold
        debug('Checking these %s URLs %s times (%s requests in total across %s domain(s)): %O', urls.length, settings.iterations, totalRequests, uniqueDomains.count, urls);
        if (totalRequests > global.CCC_REQUEST.WARNING_THRESHOLD) {
            // Display how many requests we're about to make if it's a *lot* (there's no point saying we're about to make 2 requests)
            cccLibrary.displayRequestSummary(urls.length,uniqueDomains.count, totalRequests, settings.iterations);
        }

        // Create and start the HTTP requests activity spinner
        const spinnerHTTPRequests = ora('Issuing HTTP requests ...').start();

        // Loop around the number of iterations
        for (let iterationCounter = 1; iterationCounter <= settings.iterations; iterationCounter++) {

            // Keep array of response headers with request details
            let responses = [];

            for (let i in urls) {
                // Increment the request counter and update process
                requestCounter++;

                debug('(%s of %s) Issuing HTTP %s request to [%s]...', requestCounter, urls.length, settings.method.toUpperCase(), urls[i]);

                // Initialise result object
                let result = {
                    error: false,
                    statusCode: 0,
                    request: {},
                    response: {},
                    redirectCount: 0,
                    ipAddress: null,
                    ipFamily: null
                };

                // Parse URL into component parts (since we don't have a response object when there's an error)
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

                        // The 'error' object may have different properties depending on its cause (e.g. HTTP error vs network error)
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
                        if (typeof (response.socket.remoteAddress) === 'string') {
                            result.ipAddress = response.socket.remoteAddress;
                        }

                        // Get the IP Family (IPv4 or IPv6) from the response if it exists
                        if (typeof (response.socket.remoteFamily) === 'string') {
                            result.ipFamily = response.socket.remoteFamily;
                        }

                    }

                    // Add request/response result to array (for later parsing once we have them all)
                    responses.push(result);

                    debug('Completed request %s of %s', responses.length, urls.length);

                    // Check if there's been a response for each of the requests

                    debug('Received %i of %i responses', responses.length, urls.length);
                    if (responses.length === urls.length) {
                        // Stop the HTTP Requests spinner
                        spinnerHTTPRequests.succeed(chalk.green(`Completed ${urls.length} HTTP requests`));
                        debug('Parsing %s responses', responses.length);

                        // We'll collate the parsed results into an output array
                        let outputTable = [];

                        // We'll also collect the raw (unformatted for console output) which we'll use in exportToCSV;
                        let outputTableRaw = [];
                        // Iterate through Responses array (we now have all the responses in this iteration)
                        for (let i = 0; i < responses.length; i++) {
                            //Write to debug file here *****
                            //debug('Request  [   %i]: %O', responses[i], responses[i].request);
                            //debug('Response [   %1]: %O', responses[i], responses[i].response);

                            // Each request/response will constitute a row in each of the output tables
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
                            // let responseTimestamp = `${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}:${timestamp.getMilliseconds()}`;
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
                            // Write it to the raw output row regardless of its value
                            rowRaw.Status = responses[i].statusCode;

                            row.Host = chalk.cyan(responses[i].request.host);
                            rowRaw.Host = responses[i].request.host;

                            row.Path = chalk.cyan(responses[i].request.path);
                            rowRaw.Path = responses[i].request.path;
                            // row.Protocol = chalk.cyan(responses[i].request.protocol);
                            rowRaw.Protocol = responses[i].request.protocol;

                            // row['URL'] = chalk.cyan(responses[i].request.url);
                            rowRaw.URL = responses[i].request.url;

                            // ***** Copy rowRaw into new rowDebug here *****
                            // Pull out select response headers
                            for (let attributeName in responses[i].response.headers) {
                                let attributeValue = responses[i].response.headers[attributeName];
                                //debug('Examining header %s : %s', attributeName, attributeValue);

                                // Save the name of the header in an array
                                if (settings.listResponseHeaders) {
                                    responseHeadersReceived.push(attributeName);
                                }

                                // **** Save all response headers into rowDebug here, if --verbose is on ****


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

                        // Send output results to console, formatted into columns
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
                        console.log(columns);

                        // Export to CSV
                        if (settings.options.exportToCSV) {
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

                        if (settings.listResponseHeaders) {
                            // Dedupe the list of collected response headers
                            debug('De-duplicating the collection of %i response headers', responseHeadersReceived.length);
                            let uniqueResponseHeaders = [...new Set(responseHeadersReceived.sort())];
                            debug('%i unique response headers', uniqueResponseHeaders.length);
                            console.log('%i unique response headers (from %i collected):%s%O', uniqueResponseHeaders.length, responseHeadersReceived.length, EOL, uniqueResponseHeaders);
                        }

                        if (settings.serviceDetection) {
                            // Create and start the CDN Detection activity spinner
                            const spinnerServiceDetection = ora(`CDN detection being performed on ${uniqueDomains.domains.length} unique domains ...`).start();

                            // Determine the CDN or service behind each unique domain
                            uniqueDomains.domains.forEach((domain) => {
                                cccDNS.determineCDN(domain, settings, (cdn) => {
                                    debug('determineCDN(%s) returned: %O', domain, cdn);
                                    // Construct the console message array
                                    var serviceDetection = [{
                                        hostname: chalk.cyan(cdn.hostname)
                                    }];

                                    // Get the last message from the "message" array
                                    let messageStr = cdn.message[cdn.message.length - 1];
                                    // Get the reason for the detection
                                    let reasonStr = cdn.reason;
                                    debug(reasonStr);
                                    // Add colour to the message depending upon the success of otherwise of the determination
                                    switch (cdn.status) {
                                        case global.CCC_SERVICE_DETECTION_LABELS.UNKNOWN: {
                                            serviceDetection[0].message = chalk.grey(messageStr);
                                            break;
                                        }
                                        case global.CCC_SERVICE_DETECTION_LABELS.ERROR: {
                                            serviceDetection[0].message = chalk.redBright(messageStr);
                                            break;
                                        }
                                        case global.CCC_SERVICE_DETECTION_LABELS.CDN: {
                                            serviceDetection[0].message = chalk.greenBright(messageStr);
                                            break;
                                        }
                                        case global.CCC_SERVICE_DETECTION_LABELS.OTHER: {
                                            serviceDetection[0].message = chalk.yellowBright(messageStr);
                                            break;
                                        }
                                        default:
                                            serviceDetection[0].message = chalk.yellowBright(messageStr);
                                    }

                                    // Record the reason against the message if verbose output is enabled
                                    if (settings.options.verbose) {
                                        serviceDetection[0].reason = reasonStr;
                                    }

                                    let hostnameColumnWidth = uniqueDomains.domainNameLength + 5;

                                    // Format text into spaced columns
                                    let columns = columnify(serviceDetection, {
                                        showHeaders: false,
                                        paddingChr: global.CCC_OUTPUT.PADDING_CHARACTER,
                                        config: {
                                            hostname: { minWidth: hostnameColumnWidth }
                                        }
                                    });

                                    // Display results
                                    console.log(columns);
                                });
                            });

                            // Stop the CDN Detection spinner
                            spinnerServiceDetection.succeed(chalk.green(`DNS inspection complete on ${uniqueDomains.domains.length} unique domains`));
                        }

                        // Pause for configured interval (when we're looping through URLs more than once and there are still iterations left, and when the interval isn't zero) ...
                        debug('iterationCounter: %i ::: settings.iterations: %i', iterationCounter, settings.iterations);
                        if ((iterationCounter < settings.iterations) && (settings.interval > 0)) {
                            debug('Sleeping for %i milliseconds', settings.interval);
                            let resumeTime = Date.now() + settings.interval;
                            while (resumeTime > Date.now()) {
                                //debug('waiting...');
                                if (Number.isInteger((Date.now() - resumeTime) / 1000)) {
                                    process.stdout.write('.');
                                }
                            }
                            console.log('.');
                            debug('...resuming');
                        }
                    }
                });

                resp.on('redirect', (url) => {
                    result.redirectCount += 1;
                    debug('redirectCount incremented to %s by redirect event to [%s] ', result.redirectCount, url);
                });
            }

            debug('Completed iteration %s of %s', iterationCounter, settings.iterations);
        }
    }
} catch (error) {
    console.error(`An error occurred - ${error.message}`);
    debug(error);
}