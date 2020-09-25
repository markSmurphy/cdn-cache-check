#!/usr/bin/env node

const debug = require('debug')('cdn-cache-check');
debug('Entry: [%s]', __filename);
debug('Command line arguments: %O', process.argv);

// Global Constants
const CCC_REQUEST_WARNING_THRESHOLD = 100;

// Command line options parser
var argv = require('yargs')
.help(false)
.argv;

// Initialise console colours
const chalk = require('chalk');

// Console output formatting for columns and colours
const columnify = require('columnify');

// Initialise File System object
const fs = require('fs');

// Cache=control header parser
const {parse} = require('@tusbar/cache-control');

// Platform independent new line character
const EOL = require('os').EOL;

// Initialise URL validation object
const validUrl = require('valid-url');

// Initialise Domain validation object
const isValidDomain = require('is-valid-domain')

// Initialise 'needle' HTTP client
const needle = require('needle');

// Initialise wildcard string parser
const matcher = require('multimatch');

// Error formatting
const PrettyError = require('pretty-error');
const pe = new PrettyError();

// Initialise configuration
const config = require('./configuration');
var settings = config.getSettings();

if (settings.listResponseHeaders) {
    // Array to store names of received response headers, used
    var responseHeadersReceived= [];
}

try {
    // Check for '--help' command line parameters
    if (argv.help) {
        debug('--help detected.  Showing help screen.');
        // Show help screen
        const help = require('./help');
        help.helpScreen(argv.verbose);
        //Exit to terminal
        return;
    }

    // Check for '--header-collections' command line parameters
    if (argv.headerCollections) {
        console.log('Did you mean to use ' + chalk.cyan('--list-header-collections') + ' ?');
    }

    // Check for '--list-header-collections' command line parameters
    if (argv.listHeaderCollections) {
        debug('--list-header-collections detected.  Retrieving all Headers Collections....');
        // Get an array of Header Collections
        let collections = config.listHeaderCollections();

        // Initialise prettyJson object, to format output
        let prettyJson = require('prettyjson');

        // Output the formatted json contained within each array element
        collections.forEach((element) => console.log(prettyJson.render(element)));

        // Exit to terminal
        return;
    }

    debug('Looking for URLs to check...');
    // Initialise array of URLs to check
    var urls = [];

    // Iterate through all parameters looking for ones that are URLs or files
    for (let i = 2; i < process.argv.length; ++i) {
        // Check if it's a valid file
        try {
            debug('Checking if [%s] is a file, URL or bare domain ...', process.argv[i]);
            if (fs.existsSync(process.argv[i])) {
                // File exists.  Extract URLs from it
                try {
                    // Read contents of the file
                    debug('It\'s a file. Reading its contents ...');
                    let data = fs.readFileSync(process.argv[i], 'UTF-8');

                    // Split the contents by new line
                    let lines = data.split(EOL);

                    // Examine each line
                    debug('Examining %i lines looking for URLs...', lines.length);
                    for (let i = 0; i < lines.length; ++i) {
                        if (validUrl.isWebUri(lines[i])) {
                            debug('Found a URL [%s]', lines[i]);
                            urls.push(lines[i]);

                        } else if (isValidDomain(lines[i], {subdomain: true, wildcard: false})) {
                            debug('Found a bare domain [%s]', lines[i]);
                            urls.push('https://' + lines[i]);

                        } else if (lines[i].length > 0) {
                            // This line didn't pass any tests so log it to debug output, but only if it's not a blank line
                            debug('Ignoring [%s]', lines[i]);
                        }
                    }
                } catch (err) {
                    debug('An error occurred while parsing the file [%s]: %O', process.argv[i], err);
                    //console.error(pe.render(err));
                }
            } else if (validUrl.isWebUri(process.argv[i])) {
                // It's a valid URL.  Add it to the urls array
                debug('It\'s a valid URL');
                urls.push(process.argv[i]);

            } else if (isValidDomain(process.argv[i], {subdomain: true, wildcard: false})) {
                // It's a bare domain (i.e. there's no protocol)
                debug('It\'s a valid domain but not a URL. Adding "https://" to it');
                urls.push('https://' + process.argv[i]);

            } else {
                // It doesn't pass any tests. Ignore it
                debug('Ignoring [%s]', process.argv[i]);
            }
        } catch(err) {
            console.error(pe.render(err));
        }
    }

    if (urls.length === 0) {
        console.log(chalk.red('Error: No URL(s) provided.'));
    } else {
        // The main work starts here
        debug('Using settings: %O', settings);

        // Initialise variables to keep track of progress
        const totalRequests = urls.length * settings.iterations;
        let requestCounter = 0;

        // Workout how many requests we're going to make and display a notification if it exceeds the threshold
        debug('Checking these URLs %i times (%s requests in total): %O', settings.iterations, totalRequests, urls);
        if (totalRequests > CCC_REQUEST_WARNING_THRESHOLD) {
            // Display a subtly different notification if there are multiple iterations
            if (settings.iterations > 1) {
                console.log(chalk.cyan('Checking %i URLs * %i times (%i requests)'), urls.length, settings.iterations, totalRequests);
            } else {
                console.log(chalk.cyan('Checking %i URLs'), urls.length);
            }
        }

        // Loop around the number of iterations
        for (let iterationCounter = 1; iterationCounter <= settings.iterations; iterationCounter++) {
            // Keep array of response headers with request details
            let responses = [];

            for (let i in urls) {
                // Increment the request counter and update process
                requestCounter++;

                debug('(%s of %s) Issuing HTTP %s request to [%s]...', requestCounter, urls.length, settings.method.toUpperCase(), urls[i]);

                // Send HTTP request for current URL

                needle.request(settings.method, urls[i], {}, function(error, response) {
                    // Initialise result object
                    let result = {};
                    debug('Callback for [%s] received', urls[i]);

                    if (error) {
                        debug('Error for [%s]: %O', urls[i], error);
                        // Parse URL into component parts (since we don't have a response object when there's an error)
                        let requestURL = new URL(urls[i]);

                        // Log error to JSON result
                        result = {
                            'error': true,
                            'statusCode': error.code,
                            'request': {
                                'protocol': requestURL.protocol,
                                'host': requestURL.hostname,
                                'path': requestURL.pathname,
                                'url' : urls[i],
                            },
                            'response': {
                                'headers': []
                            }
                        };

                    } else {
                        // We got a HTTP response
                        debug(response.statusCode + ' ' + urls[i]);

                        // Save request details and HTTP response headers as JSON
                        result = {
                            'error': false,
                            'statusCode': response.statusCode,
                            'request': {
                                'protocol': response.req.protocol,
                                'host': response.req.host,
                                'path': response.req.path,
                                'url' : urls[i],
                            },
                            'response': {
                                'headers': response.headers
                            }
                        };
                    }

                    // Add request/response result to array (for later parsing once we have them all)
                    responses.push(result);

                    debug('Completed request %s of %s', responses.length, urls.length);

                    // Check if there's been a response for each of the requests

                    debug('Received %i of %i responses', responses.length, urls.length);
                    if (responses.length === urls.length) {
                        debug('Parsing %s responses', responses.length);

                        // We'll collate the parsed results into an output array
                        let outputTable = [];

                        // Iterate through Responses array (we now have all the responses in this iteration)
                        for (let i = 0; i < responses.length; i++) {
                            //Write to debug file here *****
                            //debug('Request  [   %i]: %O', responses[i], responses[i].request);
                            //debug('Response [   %1]: %O', responses[i], responses[i].response);
                            // Each request/response will constitute a row in the output table
                            let row = {};

                            // Populate basic request details
                            let timestamp = new Date();
                            // let responseTimestamp = `${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}:${timestamp.getMilliseconds()}`;
                            // Pad the hours/mins/secs/mSecs with a leading '0' and then return (trim) the last 2 rightmost characters to ensure a leading zero for 1 digit numbers
                            let responseTimestamp = ('0' + timestamp.getHours()).slice(-2) + ':' + ('0' + timestamp.getMinutes()).slice(-2) + ':' + ('0' + timestamp.getSeconds()).slice(-2) + ':' + ('0' + timestamp.getMilliseconds()).slice(-2);
                            row['Time'] = chalk.reset(responseTimestamp);

                            // Populate response status code, with colour indicator of success or failure
                            if (Number.isInteger(responses[i].statusCode)) {

                                if (responses[i].statusCode >= 400) {
                                    // Failure response code, 4xx & 5xx
                                    row['Status'] = chalk.red(responses[i].statusCode);

                                } else if (responses[i].statusCode >= 300) {
                                    // Redirect response code (3xx)
                                    row['Status'] = chalk.yellow(responses[i].statusCode);

                                } else {
                                    // Success response code (1xx, 2xx)
                                    row['Status'] = chalk.green(responses[i].statusCode);
                                }
                            } else if (responses[i].error) {
                                row['Status'] = chalk.bgRed.whiteBright(responses[i].statusCode);

                            }

                            row['Host'] = chalk.cyan(responses[i].request.host);
                            row['Path'] = chalk.cyan(responses[i].request.path);
                            // row['Protocol'] = chalk.cyan(responses[i].request.protocol);
                            // row['URL'] = chalk.cyan( responses[i].request.url);

                            // Pull out select response headers
                            for(let attributeName in responses[i].response.headers){
                                let attributeValue = responses[i].response.headers[attributeName];
                                //debug('Examining header %s : %s', attributeName, attributeValue);

                                // Save the name of the header in an array
                                if (settings.listResponseHeaders){
                                    responseHeadersReceived.push(attributeName);
                                }

                                // Check if the response header's name matches one in the header collection
                                if (matcher(attributeName, settings.headerCollection, {nocase: true}).length > 0) {
                                    debug('Extracting header ==> %s : %s', attributeName, attributeValue);

                                    //
                                    // Parse header value for cache-control directives (can't do this inside the following case blocks)
                                    let clientCache = parse(attributeValue);

                                    switch(attributeName.toLowerCase()) {
                                        case 'cache-control':
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
                                        case 'x-cache':
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
                                        default:
                                            // Add row with no formatting
                                            row[attributeName] = chalk.reset(attributeValue);
                                      }

                                } else {
                                    debug('Ignoring header --> %s', attributeName);
                                }
                            }

                            outputTable.push(row);
                        }

                        // Send output results to console, formatted into columns
                        let columns = columnify(outputTable, {
                            showHeaders: true,
                            preserveNewLines: true,
                            truncate: true,
                            config: {
                                'URL': {maxWidth: 60},
                                'Host': {maxWidth: 30},
                                'Path': {maxWidth: 60}
                            }
                        });
                        console.log(columns);

                        if (settings.listResponseHeaders) {
                            // Dedupe the list of collected response headers
                            debug('De-duplicating the collection of %i response headers', responseHeadersReceived.length);
                            let uniqueResponseHeaders = [...new Set(responseHeadersReceived)];
                            debug('%i unique response headers', uniqueResponseHeaders.length);
                            console.log('%i unique response headers (from %i collected): %O', uniqueResponseHeaders.length, responseHeadersReceived.length, uniqueResponseHeaders);
                        }

                        // Pause for configured interval (when we're looping through URLs more than once and there are still iterations left, and when the interval isn't zero) ...
                        debug('iterationCounter: %i ::: settings.iterations: %i', iterationCounter, settings.iterations);
                        if ((iterationCounter < settings.iterations) && (settings.interval > 0)){
                            debug('Sleeping for %i milliseconds', settings.interval);
                            let resumeTime = Date.now() + settings.interval;
                            while (resumeTime > Date.now()) {
                                //debug('waiting...');
                            }
                            debug('...resuming');
                        }
                    }
                });
            }

            debug('Completed iteration %s of %s', iterationCounter, settings.iterations);
        }
    }
} catch (error) {
    console.error(pe.render(error));
}
