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
const { settings } = require('cluster');

// Initialise default settings
var defaultSettings = {};

try {
    defaultSettings = require('./defaults.json'); // Load the defaults
} catch (error) {
    debug('An error occurred loading the defaults.json file: %O', error);
    // The defaults.json didn't load.  Return a bare and very basic config
    defaultSettings = {
        method: 'get',
        iterations: 1,
        interval: 5000,
        headersCollection: 'default',
        CDNDetection: true,
        headersCollections: [
            {
                default: [
                    'x-cache',
                    'cache-control',
                    'server',
                    'content-encoding',
                    'vary',
                    'age'
                ]
            }
        ],
        ApexDomains: {},
        options : {
            exportToCSV: true,
            openAfterExport: false,
            headers: {
                'user-agent': 'ccc/{version} {OS}/{OSRelease}',
                'Connection': 'close'
            },
            httpOptions: {
                timeout: 6000,
                response_timeout: 6000,
                read_timeout: 6000,
                follow: 5,
                compressed: true
            }
        }
    };
}


module.exports = {
    getSettings() {
        debug('Entry::getSettings()');
        try {
            // Load the defaults
            let settings = defaultSettings;
            debug('Loaded default settings: %O', settings);

            // Check command line parameters for overrides...
            debug('Looking for overrides to default settings');

            // Header Collection
            if (argv.headers) {
                // ** We should validate the specified collection actually exists **
                settings.headersCollection = argv.headers;
                debug('Using the specified Headers Collection: %s', settings.headersCollection);
            } else {
                debug('Using the default Headers Collection: %s', settings.headersCollection);
            }

            // Load the headers collections
            let headerCollection = this.getHeaderCollection(settings.headersCollection, settings);
            // Add it into the Settings object
            settings.headerCollection = headerCollection;
            debug('Will collect response header matching any of: %O', settings.headerCollection);

            // HTTP Method
            if (argv.method) {
                const HTTPMethods = ['get', 'head', 'options', 'put', 'patch', 'delete', 'trace', 'connect'];
                if (HTTPMethods.includes(argv.method.toLowerCase())) {
                    settings.method = argv.method.toLowerCase();
                    debug('Setting HTTP method to: %s', settings.method);
                } else {
                    console.log(chalk.blue('Warning: %s is not a supported HTTP method. Using %s instead.',argv.method.toUpperCase() , settings.method.toUpperCase()));
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

            // Check for list-response-headers argument
            if (argv.listResponseHeaders) {
                settings.listResponseHeaders = true;
                // We can switch off the CDN detection output because we're just listing response headers
                settings.CDNDetection = false;
            } else {
                settings.listResponseHeaders = false;
            }

            // Check for '--open' argument
            if (argv.open) {
                settings.options.openAfterExport = true;
            }

            // Check for '--export false' argument
            if (argv.export){
                if(typeof argv.export === 'string') {
                    if (argv.export.toLowerCase() === 'false') {
                        settings.options.exportToCSV = false;
                        // Switch off openAfterExport because we're not exporting anything
                        settings.options.openAfterExport = true;
                    }
                }
            }

            // Use a client specific customised user-agent string
            // settings.options.headers['user-agent'] = this.getUserAgent();
            settings.options.httpOptions['user_agent'] = this.getUserAgent();
            debug('Using the user-agent: %s', settings.options.httpOptions['user_agent']);

            return settings;

        } catch (error) {
            console.error(pe.render(error));
            return(settings);
        }
    },
    getHeaderCollection(collectionName, settings) {
        debug('getHeaderCollection(%s)', collectionName);
        // Iterate through each header collection definition
        for (let i = 0; i < settings.headersCollections.length; i++) {
            let currentCollection = Object.keys(settings.headersCollections[i])[0];
            debug('comparing %s with %s', collectionName.toLowerCase(), currentCollection.toLowerCase());
            // Check if its name matches the supplied one
            if (collectionName.toLowerCase() === currentCollection.toLowerCase()) {
                // Return the array of headers
                debug('getHeaderCollection() returning: %O', settings.headersCollections[i][currentCollection]);
                return (settings.headersCollections[i][currentCollection]);
            }
        }

        // If we get here then no matches were found.
        // Perhaps return something that will collect all headers - return (['*']);
        console.log(chalk.blue('WARNING: The requested header collection ') + collectionName + chalk.blue(' does not exist'));
        return ([]);
    },
    listHeaderCollections() {
        debug('listHeaderCollections():: Entry');
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
