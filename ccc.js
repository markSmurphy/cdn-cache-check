#!/usr/bin/env node

const debug = require('debug');//('cdn-cache-check');

// Command line options parser
const argv = require('yargs')
    .help(false)
    .argv;

// Check if "debug" mode is enabled via the command line
if (argv.debug) {
    debug.enable('*');
}

debug('Entry: [%s]', __filename);
debug('Command line arguments: %O', process.argv);

// Global Constants
const constants = require('./ccc-constants');
constants.init();

// Initialise configuration
const config = require('./ccc-configuration');

// Populate the settings object
const settings = config.getSettings();
debug('Using settings: %O', settings);

// cdn-cache-check's DNS library
const cccDNS = require('./ccc-dns');

// cdn-cache-check's HTTP library
const cccHTTP = require('./ccc-http');

// cdn-cache-check's rendering library
const cccRender = require('./ccc-render-results');

// cdn-cache-check's library
const cdn_cache_check = require('./ccc-lib');

// HTTP Archive Parsers
const harParser = require('./harparser');

// Initialise console colours
const chalk = require('chalk');

// Initialise File System object
const fs = require('fs');

// File path parsing object
const path = require('path');

// Platform independent new line character and path separator
const EOL = require('os').EOL;

// Initialise URL validation object
const validUrl = require('valid-url');

// Initialise Domain validation object
const isValidDomain = require('is-valid-domain');

// Import terminal spinner library
const ora = require('ora');
const cloudServices = require('./ccc-service-detection');

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
        config.displayHeaderCollections(config.getHeaderCollections());

        // Display config file location
        config.displayConfigFileLocation();

        // Exit to terminal
        process.exit();
    }

    debug('Looking for URLs to check...');
    console.info('Looking for URLs to check...');
    // Initialise array of URLs to check
    let urls = [];

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

                        // Sanitize HAR URLs
                        for (let harUrl of harURLs) {
                            try {
                                let sanitizedUrl = cdn_cache_check.sanitizeUrl(harUrl);
                                urls.push(sanitizedUrl);
                            } catch (error) {
                                console.warn(chalk.yellow(`Warning: Skipping invalid URL from HAR [${harUrl}] - ${error.message}`));
                                debug('URL validation error: %O', error);
                            }
                        }
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
                                try {
                                    let sanitizedUrl = cdn_cache_check.sanitizeUrl(lines[i]);
                                    debug('Found a URL [%s]', sanitizedUrl);
                                    urls.push(sanitizedUrl);
                                } catch (error) {
                                    console.warn(chalk.yellow(`Warning: Skipping invalid URL [${lines[i]}] - ${error.message}`));
                                    debug('URL validation error: %O', error);
                                }

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
                try {
                    let sanitizedUrl = cdn_cache_check.sanitizeUrl(currentArgument);
                    debug('It\'s a valid URL');
                    urls.push(sanitizedUrl);
                } catch (error) {
                    console.warn(chalk.yellow(`Warning: Skipping invalid URL [${currentArgument}] - ${error.message}`));
                    debug('URL validation error: %O', error);
                }

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

    // We've parsed the URLs into an array
    if (urls.length === 0) {
        console.log(chalk.red('Error: No URL(s) provided.'));
        // Show some advice
        console.log(chalk.grey(`Try ${chalk.grey.italic('ccc --help')} for syntax.`));

    } else {
        // The main work starts here

        // Extract a list of each distinct FQDN from the list of URLs
        let uniqueDomains = cccDNS.getUniqueDomains(urls);
        debug('Unique Domains: %O', uniqueDomains);

        // Calculate how many requests we're going to make and display a notification if it exceeds the threshold
        debug('Checking these %s URLs across %s domain(s): %O', urls.length, uniqueDomains.count, urls);
        if (urls.length > global.CCC_REQUEST.WARNING_THRESHOLD) {
            // Display how many requests we're about to make, but only if it's a *lot* (there's no point saying we're about to make 2 requests)
            cdn_cache_check.displayRequestSummary(urls.length, uniqueDomains.count);
        }

        // Create and start the HTTP requests activity spinner
        const spinnerHTTPRequests = ora('Issuing HTTP requests ...').start();

        cccHTTP.issueRequests(urls, settings).then((responses) => {                                         // Issue HTTP requests for each URL
            debug('Received %i responses from %i URLs', responses.length, urls.length);

            spinnerHTTPRequests.succeed(chalk.green(`Completed ${urls.length} HTTP requests`));             // Stop the HTTP Requests spinner

            cccRender.renderHTTPResponses(responses, settings).then((columns) => {                          // Format HTTP responses into tabulated output
                console.log(columns);                                                                       // Display HTTP response results in console

                if (settings.listResponseHeaders) {                                                         // Check if switch to list unique response headers is enabled
                    cccRender.renderHTTPResponseHeaders(responses);                                         // Display all unique HTTP response headers
                }
            }).catch((error) => {
                console.error(chalk.red(`Error rendering HTTP responses: ${error.message}`));
                if (settings.options.verbose) {
                    debug('Render error: %O', error);
                }
            });

            if (settings.serviceDetection) {                                                                // Check if Service Detection is enabled
                // Create and start the Service Detection activity spinner
                let spinnerServiceDetection = ora(`Service detection being performed on ${uniqueDomains.domains.length} unique domains ...`).start();

                cloudServices.serviceDetection(uniqueDomains, settings).then(() => {
                    // Stop the Service Detection spinner
                    spinnerServiceDetection.succeed(chalk.green(`Service inspection complete on ${uniqueDomains.domains.length} unique domains`));
                }).catch((error) => {
                    // Stop the Service Detection spinner and report the error
                    spinnerServiceDetection.succeed(chalk.green(`Service inspection completed, albeit with errors, on ${uniqueDomains.domains.length} unique domains`));

                    if (settings.options.verbose) { // Report the error if --verbose is supplied
                        console.error(`${chalk.bgRed.whiteBright('Service Detection error')}: ${error.message}`);
                    } else {
                        console.log(`${chalk.grey('Use')} ${chalk.grey.bold('--verbose')} ${chalk.grey('to show the error')}`);
                    }
                });
            }
        }).catch((error) => {
            spinnerHTTPRequests.fail(chalk.red('HTTP requests failed'));
            console.error(chalk.red(`Error issuing HTTP requests: ${error.message}`));
            if (settings.options.verbose) {
                debug('HTTP request error: %O', error);
            }
            process.exit(1);
        });
    }
} catch (error) {
    console.error(`An error occurred - ${error.message}`);
    debug(error);
}