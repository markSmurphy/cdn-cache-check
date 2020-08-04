#!/usr/bin/env node

const debug = require('debug')('cloudfront-cache-check');
debug('Entry: [%s]', __filename);
debug('Command line arguments: %O', process.argv);

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

// Initialise Promisify object, used to sleep the thread when injecting intervals
// const { promisify } = require('util');
// const sleep = promisify(setTimeout);

// Platform independent new line character
const EOL = require('os').EOL;

// Initialise URL validation object
const validUrl = require('valid-url');

// Initialise 'needle' HTTP client
const needle = require('needle');

const matcher = require('multimatch');

// Error formatting
const PrettyError = require('pretty-error');
const pe = new PrettyError();


// Initialise configuration
var settings = require('./configuration').getSettings();

try {
    // Check for 'help' command line parameters
    if (argv.help) {
        debug('--help detected.  Showing help screen.');
        // Show help screen
        const help = require('./help');
        help.helpScreen(argv.verbose);
        return;
    }

    debug('Looking for URLs to check...');
    // Initialise array of URLs to check
    var urls = [];

    // Iterate through all parameters looking for ones that are URLs or files
    for (let i = 2; i < process.argv.length; ++i) {
        // Check if it's a valid file
        try {
            debug('Checking if [%s] is a file...', process.argv[i]);
            if (fs.existsSync(process.argv[i])) {
                // File exists.  Extract URLs from it
                try {
                    // Read contents of the file
                    debug('Reading file [%s]...', process.argv[i]);
                    let data = fs.readFileSync(process.argv[i], 'UTF-8');

                    // Split the contents by new line
                    //let lines = data.split(/\r?\n/);
                    let lines = data.split(EOL);

                    // Examine each line
                    debug('Examining %i lines looking for URLs...', lines.length);
                    for (let i = 0; i < lines.length; ++i) {
                        if (validUrl.isWebUri(lines[i])) {
                            debug('Found [%s]', lines[i]);
                            urls.push(lines[i]);
                        } else if (lines[i].length > 0) {
                            debug('Ignoring [%s]', lines[i]);
                        }
                    }
                } catch (err) {
                    debug('An error occurred while parsing the file [%s]: %O', process.argv[i], err);
                }
            } else {
                debug('Checking if [%s] is a URL...', process.argv[i]);
                if (validUrl.isWebUri(process.argv[i])) {
                    // It's a valid URL.  Add it to the urls array
                    urls.push(process.argv[i]);
                }
            }
        } catch(err) {
            console.log(pe.render(err));
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

        console.log(chalk.cyan('Checking %i URLs %i times'), urls.length, settings.iterations);
        debug('Checking these URLs %i times (%s requests in total): %O', settings.iterations, totalRequests, urls);

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
                    debug(response.statusCode + ' ' + urls[i]);

                    // Save request details and HTTP response headers as JSON
                    let result = {
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
                    // Add request/response result to array (for later parsing once we have them all)
                    responses.push(result);

                    debug('Completion check: %s of %s', responses.length, urls.length);

                    // Check if there's a response for each request

                    if (responses.length === urls.length) {

                        debug('Parsing %s responses', responses.length);

                        // We'll collate the parsed results into an output array
                        let outputTable = [];

                        // Iterate through Responses array (we now have all the responses in this iteration)
                        for (let i = 0; i < responses.length; i++) {
                            debug('Parsing response for: %s', responses[i].request);
                            debug('%O, responses[i].response');
                            // Each request/response will constitute a row in the output table
                            let row = {};

                            // Populate response status code, with colour indicator of success or failure
                            if ((Number.isInteger(responses[i].statusCode)) && (responses[i].statusCode >= 400)) {
                                // Failure response code, 4xx & 5xx
                                row = {
                                    'Status': chalk.red(responses[i].statusCode)
                                };

                            } else {
                                // Success response code
                                row = {
                                    'Status': chalk.green(responses[i].statusCode)
                                };
                            }

                            // Populate basic request details
                            row['host'] = chalk.blue(responses[i].request.host);
                            row['path'] = chalk.blue(responses[i].request.path);
                            //row['protocol'] = responses[i].request.protocol;
                            //row['url'] = responses[i].request.url;

                            // Pull out select response headers
                            for(let attributeName in responses[i].response.headers){
                                let attributeValue = responses[i].response.headers[attributeName];
                                debug('Examining header %s : %s', attributeName, attributeValue);
                                // Check if the response header's name matches one in the header collection
                                if (matcher(attributeName, settings.headerCollection, {nocase: true}).length > 0) {
                                    debug('Extracting ==> %s : %s', attributeName, attributeValue);

                                    switch(attributeName.toLowerCase()) {
                                        case 'cache-control':
                                            // code block
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
                                            row[attributeName] = attributeValue;
                                      }

                                } else {
                                    debug('Ignoring ==> %s : %s', attributeName, attributeValue);
                                }
                            }

                            outputTable.push(row);
                        }

                        // Send output results to console, formatted into columns
                        let columns = columnify(outputTable, {
                            showHeaders: true,
                            preserveNewLines: true,
                        });
                        console.log(columns);
                    }
                });
            }

            debug('Completed iteration %s of %s', iterationCounter, settings.iterations);
        // *** pause for configured interval here

        }
    }
} catch (error) {
    console.error('An error occurred: %O', error);
}
