const debug = require('debug')('cloudfront-cache-check-configuration');
debug('Entry: [%s]', __filename);

// Command line options parser
var argv = require('yargs')
.help(false)
.argv;

// Initialise console colours
const chalk = require('chalk');

// Initialise collection of Utilities
const utils = require('./utils');

module.exports = {
    getSettings() {
        // Load the defaults
        let settings = this.getDefaults();

        try {
            // Parse the headers collections to select the correct one
            let headerCollection = this.getHeaderCollection(settings.headersCollection, settings);
            settings.headerCollection = headerCollection;

        } catch (error) {
            console.log(error);
        }

        // Check command line parameters for overrides...
        // HTTP Method
        if (argv.method) {
            // ** We should valid the specified method **
            settings.method = argv.method;
        }

        // Number of iterations
        if (argv.iterations) {
            // Validate that an integer was specified
            if (Number.isInteger(argv.iterations)) {
                settings.iterations = argv.iterations;
            } else {
                console.log(chalk.blue('Ignoring "--iterations %s" because iterations must be an integer. Using the default "%s" instead'), argv.iterations, settings.iterations);
            }
        }

        // Interval in-between requests
        if (argv.interval) {
            // Validate that an integer was specified
            if (Number.isInteger(argv.interval)) {
                settings.interval = argv.interval;
                console.log(chalk.blue('The interval in-between requests is set to %s'), utils.millisecondsToHms(settings.interval));
            } else {
                console.log(chalk.blue('Ignoring "--interval %s" because interval must be an integer. Using the default "%s" instead'), argv.interval, settings.interval);
            }
        }

        // Header Collection
        if (argv.headers) {
            // ** We should validate the supplied collection name exists **
            settings.headersCollection = argv.headers;
        }
        return settings;
    },
    getDefaults() {
        let defaultSettings = require('./defaults.json');
        return defaultSettings;
    },
    getHeaderCollection(collectionName, settings) {
        // Iterate through each header collection definition
        for (let i = 0; i < settings.headersCollections.length; i++) {
            // Check if its name matches the supplied one
            if (settings.headersCollections[i][collectionName]) {
                // Return the array of headers
                return (settings.headersCollections[i][collectionName]);

            }
        }

        // If we get here then no matches were found
        return ([]);
    }
};
