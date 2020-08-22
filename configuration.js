const debug = require('debug')('cdn-cache-check-configuration');
debug('Entry: [%s]', __filename);

// Global Constants
const CCC_DEFAULT_USERAGENT = 'ccc/1.0';

// Error formatting module
const PrettyError = require('pretty-error');
const pe = new PrettyError();

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
        let defaultSettings = this.getDefaults();
        debug('Loaded default settings: %O', defaultSettings);

        try {
            // Parse the headers collections to select the correct one
            let headerCollection = this.getHeaderCollection(defaultSettings.headersCollection, defaultSettings);
            defaultSettings.headerCollection = headerCollection;
            debug('Using Header Collection: %O', defaultSettings.headerCollection);

        } catch (error) {
            console.log(pe.render(error));
        }

        // Check command line parameters for overrides...
        // HTTP Method
        if (argv.method) {
            const HTTPMethods = ['get', 'head', 'options', 'put', 'patch', 'delete', 'trace', 'connect'];
            if (HTTPMethods.includes(argv.method.toLowerCase())) {
                defaultSettings.method = argv.method.toLowerCase();
                debug('Setting HTTP method to: %s', defaultSettings.method);
            } else {
                console.log(chalk.blue('Warning: %s is not a supported HTTP method. Using %s instead.',argv.method.toUpperCase() , defaultSettings.method.toUpperCase()));
            }
        }

        // Number of iterations
        if (argv.iterations) {
            // Validate that an integer was specified
            if (Number.isInteger(argv.iterations)) {
                defaultSettings.iterations = argv.iterations;
                debug('Iterations set to %s', defaultSettings.iterations);
            } else {
                console.log(chalk.blue('Ignoring "--iterations %s" because iterations must be an integer. Using the default "%s" instead'), argv.iterations, defaultSettings.iterations);
            }
        }

        // Interval in-between requests
        if (argv.interval) {
            // Validate that an integer was specified
            if (Number.isInteger(argv.interval)) {
                defaultSettings.interval = argv.interval;
                debug('The interval is set to %s ms', defaultSettings.interval);
                console.log(chalk.blue('The interval between iterations is set to %s'), utils.millisecondsToHms(defaultSettings.interval));
            } else {
                console.log(chalk.blue('Warning: Ignoring "--interval %s" because interval must be an integer. Using the default "%s" instead'), argv.interval, defaultSettings.interval);
            }
        }

        // Header Collection
        if (argv.headers) {
            // ** We should validate the specified collection actually exists **
            defaultSettings.headersCollection = argv.headers;
            debug('Using Headers Collection: %s', defaultSettings.headersCollection);
        }

        // Check for list-response-headers argument
        if (argv.listResponseHeaders) {
            defaultSettings.listResponseHeaders = true
        } else {
            defaultSettings.listResponseHeaders = false
        }

        // Use a client specific customised user-agent string
        defaultSettings.options.headers['user-agent'] = this.getUserAgent();
        debug('Using the user-agent: %s', defaultSettings.options.headers['user-agent']);

        return defaultSettings;
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
    },
    listHeaderCollections() {
        debug('listHeaderCollections()');
        // Load the defaults
        let defaultSettings = this.getDefaults();

        // Extract the headersCollections array
        let headersCollections = defaultSettings.headersCollections;

        debug('Returning: %O', headersCollections);

        return(headersCollections);
    },
    getUserAgent(){
        try {
            // Load package.json for the version number etc
            const package = require('./package.json');
            // Load O/S module to get client specifics
            const os = require('os');

            // Extract default user-agent string from default config
            let defaultSettings = this.getDefaults();
            let userAgent = defaultSettings.options.headers['user-agent'];

            // Replace embedded variables with platform specifics
            userAgent = userAgent.replace('{version}', package.version);

            userAgent = userAgent.replace('{OS}', os.type());

            userAgent = userAgent.replace('{OSRelease}', os.release());

            return(userAgent);

        } catch (error) {
            return(CCC_DEFAULT_USERAGENT);
        }
    }
};
