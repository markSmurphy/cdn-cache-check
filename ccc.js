#!/usr/bin/env node

const debug = require('debug')('cloudfront-cache-check');
debug('Entry: [%s]', __filename);

debug('Initialising all external modules...');
// Command line options parser
var argv = require('yargs')
.help(false)
.argv;

// Initialise console colours
const chalk = require('chalk');

// Initialise File System object
const fs = require('fs');

// Initialise Promisify object, used to sleep the thread when injecting intervals
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Platform independent new line character
const EOL = require('os').EOL;

// Initialise URL validation object
const validUrl = require('valid-url');

// Initialise 'needle' HTTP client
const needle = require('needle');

// Initialise configuration
var settings = require('./configuration').getSettings();

const matcher = require('multimatch');

debug('External modules have been initialised.');

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
        debug('Examining command line argument [%i]: %s', i, process.argv[i]);

        // Check if it's a valid file
        try {
            debug('Checking if it is a file...');
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
                debug('Checking if it is a valid URL...');
                if (validUrl.isWebUri(process.argv[i])) {
                    // It's a valid URL.  Add it to the urls array
                    debug('It looks like a URL');
                    urls.push(process.argv[i]);
                } else {
                    debug('It is not a URL.');
                }
            }
        } catch(err) {
            debug('Error: %O', err);
        }
    }

    if (urls.length === 0) {
        console.log(chalk.red('Error: No URL(s) provided.'));
    } else {
        // The main work starts here
        debug('Using settings: %O', settings);
        console.log('Checking %i URLs %i times', urls.length, settings.iterations);
        debug('Checking %i URLs %i times: %O', urls.length, settings.iterations, urls);

        // Initialise variables to keep track of progress
        let totalRequests = urls.length * settings.iterations;
        let requestCounter = 0;

        // Loop around the number of iterations
        for (let iterationCounter = 1; iterationCounter <= settings.iterations; iterationCounter++) {

            for (let i in urls) {
                // Initialise variables scoped within the loop
                var responses = [];
                var Completed_requests = 0;

                // Increment the request counter and update process
                requestCounter++;

                debug('Issuing HTTP %s request to [%s]...', settings.method.toUpperCase(), urls[i]);

                // Send HTTP request for current URL
                needle.request(settings.method, urls[i], settings.options, function(error, response) {
                    debug('Response [%s] headers: %O', response.statusCode, response.headers);
                    console.log('%s - %s', response.statusCode, urls[i]);

                    // Save HTTP response headers
                    let result = {'request': {
                        'protocol': response.req.protocol,
                        'host': response.req.host,
                        'path': response.req.path,
                        'url' : urls[i]
                        },
                        'response': {
                            'headers': response.headers
                        }
                    };
                    responses.push(result);

                    // Increment responses counter
                    Completed_requests++;

                    console.log('*** sent %s of %s', Completed_requests, urls.length);

                    // Check if response for each request has been received
                    if (Completed_requests === urls.length) {

                        // Iterate through Responses array
                        for (let i = 0; i < responses.length; i++) {
                            console.log(chalk.blueBright(responses[i].request.url));

                            for(let attributeName in responses[i].response.headers){
                                debug('Examining header %s : %s', attributeName, responses[i].response.headers[attributeName]);
                                // Check if the response header's name matches one in the header collection
                                if (matcher(attributeName, settings.headerCollection, {nocase: true}).length > 0) {
                                    console.log('%s : %s', attributeName, responses[i].response.headers[attributeName]);
                                } else {
                                    debug('IGNORING %s : %s', attributeName, responses[i].response.headers[attributeName]);
                                }

                            }
                        }

                    }
                });
            }

            // ** pause for configured interval here

        }
    }
} catch (error) {
    console.error('An error occurred: %O', error);
}
