const debug = require('debug')('cloudfront-cache-check-configuration');
debug('Entry: [%s]', __filename);

const prettyError = require('pretty-error');
const pe = new prettyError();

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
        debug('Entry::getSettings()');
        // Load the defaults
        let settings = this.getDefaults();
        debug('Loaded default settings: %O', settings);

        try {
            // Parse the headers collections to select the correct one
            let headerCollection = this.getHeaderCollection(settings.headersCollection, settings);
            settings.headerCollection = headerCollection;
            debug('Using Header Collection: %O', settings.headerCollection);

        } catch (error) {
            console.log(pe.render(error));
        }

        // Check command line parameters for overrides...
        // HTTP Method
        if (argv.method) {
            const HTTPMethods = ["get", "head", "options", "put", "patch", "delete", "trace", "connect"];
            if (HTTPMethods.includes(argv.method.toLowerCase())) {
                settings.method = argv.method.toLowerCase();
                debug('Setting HTTP method to: %s', settings.method);
            } else {
                console.log(chalk.blue('Warning: %s is not a supported HTTP method. Using %s instead.',argv.method.toUpperCase() , settings.method.toUpperCase()))
            }
        }

        // Number of iterations
        if (argv.iterations) {
            // Validate that an integer was specified
            if (Number.isInteger(argv.iterations)) {
                settings.iterations = argv.iterations;
                debug('Iterations set to %s', settings.iterations);
            } else {
                console.log(chalk.blue('Ignoring "--iterations %s" because iterations must be an integer. Using the default "%s" instead'), argv.iterations, settings.iterations);
            }
        }

        // Interval in-between requests
        if (argv.interval) {
            // Validate that an integer was specified
            if (Number.isInteger(argv.interval)) {
                settings.interval = argv.interval;
                debug('The interval is set to %s ms', settings.interval);
                console.log(chalk.blue('The interval between iterations is set to %s'), utils.millisecondsToHms(settings.interval));
            } else {
                console.log(chalk.blue('Warning: Ignoring "--interval %s" because interval must be an integer. Using the default "%s" instead'), argv.interval, settings.interval);
            }
        }

        // Header Collection
        if (argv.headers) {
            // ** We should validate the supplied collection name exists **
            settings.headersCollection = argv.headers;
            debug('Using Headers Collection: %s', settings.headersCollection);
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

        // If we get here then no matches were found.
        // Perhaps return something that will collect all headers - return (['*']);
        console.log(chalk.blue('WARNING: The requested header collection [%s] does not exist', collectionName));
        return ([]);
    }
};
