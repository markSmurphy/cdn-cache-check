#!/usr/bin/env node

const debug = require('debug')('cloudfront-cache-check');
debug('Entry: [%s]', __filename);

// Command line options parser
var argv = require('yargs')
.help(false)
.argv;

// Console colours
const chalk = require('chalk');

// Initialise configuration
var settings = require('./defaults.json');

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

    // Check for --file
    if (argv.file) {
        debug('--file detected');
        const fs = require('fs');

        const { promisify } = require('util');
        const sleep = promisify(setTimeout);

        //test 'interval' method
        sleep(2500).then(() => {
            console.log('BOOM!');
        });


        var urlFile = JSON.parse(fs.readFileSync(__dirname + '/' + argv.file));

        // **** Include better file support for absolute path or relative to cwd + File Not Found error checking/reporting
    }


} catch (error) {
    console.error('An error occurred: %O', error);
}
