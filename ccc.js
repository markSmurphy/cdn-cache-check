#!/usr/bin/env node

const debug = require('debug')('cloudfront-cache-check');
debug('Entry: [%s]', __filename);

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

// Initialise progress bar
const cliProgress = require('cli-progress');

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

    if (urls.length==0) {
        console.log(chalk.red('Error: No URL(s) provided.'));
    } else {
        // The main work starts here
        debug('Setting: %O', settings);
        debug('Testing %i URLs %i times: %O', urls.length, settings.iterations, urls);
        let totalRequests = urls.length * settings.iterations;
        let requestCounter = 0;

        // create a new progress bar instance
        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_grey);

        // Start the progress bar with a starting value of 0 and a total equal to the number of requests we're going to make
        progressBar.start(totalRequests, 0);

        sleep(settings.interval).then(() => {
            // Increment counter
            requestCounter++;

            // Move the progress bar on
            progressBar.update(requestCounter);

            // Construct HTTP request
            
        });


        // Stop the progress bar
        progressBar.stop();
    }
} catch (error) {
    console.error('An error occurred: %O', error);
}
