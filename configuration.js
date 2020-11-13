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
        try {
            // Load the defaults
            let Settings = this.getDefaults();
            debug('Loaded default settings: %O', Settings);

            // Check command line parameters for overrides...
            debug('Looking for overrides to default settings');

            // Header Collection
            if (argv.headers) {
                // ** We should validate the specified collection actually exists **
                Settings.headersCollection = argv.headers;
                debug('Using the specified Headers Collection: %s', Settings.headersCollection);
            } else {
                debug('Using the default Headers Collection: %s', Settings.headersCollection);
            }

            // Load the headers collections
            let headerCollection = this.getHeaderCollection(Settings.headersCollection, Settings);
            // Add it into the Settings object
            Settings.headerCollection = headerCollection;
            debug('Will collect response header matching any of: %O', Settings.headerCollection);

            // HTTP Method
            if (argv.method) {
                const HTTPMethods = ['get', 'head', 'options', 'put', 'patch', 'delete', 'trace', 'connect'];
                if (HTTPMethods.includes(argv.method.toLowerCase())) {
                    Settings.method = argv.method.toLowerCase();
                    debug('Setting HTTP method to: %s', Settings.method);
                } else {
                    console.log(chalk.blue('Warning: %s is not a supported HTTP method. Using %s instead.',argv.method.toUpperCase() , Settings.method.toUpperCase()));
                }
            }

            // Number of iterations
            if (argv.iterations) {
                // Validate that an integer was specified
                if (Number.isInteger(argv.iterations)) {
                    Settings.iterations = argv.iterations;
                    debug('Iterations set to %s', Settings.iterations);
                } else {
                    console.log(chalk.blue('Ignoring "--iterations %s" because iterations must be an integer. Using the default "%s" instead'), argv.iterations, Settings.iterations);
                }
            }

            // Interval in-between requests
            if (argv.interval) {
                // Validate that an integer was specified
                if (Number.isInteger(argv.interval)) {
                    Settings.interval = argv.interval;
                    debug('The interval is set to %s ms', Settings.interval);
                    console.log(chalk.blue('The interval between iterations is set to %s'), utils.millisecondsToHms(Settings.interval));
                } else {
                    console.log(chalk.blue('Warning: Ignoring "--interval %s" because interval must be an integer. Using the default "%s" instead'), argv.interval, Settings.interval);
                }
            }

            // Check for list-response-headers argument
            if (argv.listResponseHeaders) {
                Settings.listResponseHeaders = true
            } else {
                Settings.listResponseHeaders = false
            }

            // Use a client specific customised user-agent string
            Settings.options.headers['user-agent'] = this.getUserAgent();
            debug('Using the user-agent: %s', Settings.options.headers['user-agent']);

            return Settings;

        } catch (error) {
            console.error(pe.render(error));
        }
    },
    getDefaults() {
        try {
            let defaultSettings = require('./defaults.json'); // Load the defaults
            return (defaultSettings); // Return the json object
        } catch (error) {
            debug('An error occurred loading the defaults.json file: %O', error);
            // The defaults.json didn't load.  Return a bare and very basic config
            let defaultSettings = {
                method: 'get',
                iterations: 1,
                interval: 5000,
                headersCollection: 'default',
                headersCollections: [
                    {
                        default: [
                            'x-cache',
                            'cache-control',
                            'server',
                            'content-encoding',
                            'vary',
                            '*cache*'
                        ]
                    }
                ],
                ApexDomains: {},
                options : {
                    exportToCSV: true,
                    openAfterExport: false,
                    headers: {
                        'user-agent': 'ccc/{version} {OS}/{OSRelease}',
                        Connection: 'close'
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


            return (defaultSettings);
        }

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
