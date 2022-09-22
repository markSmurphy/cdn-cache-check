const debug = require('debug')('cdn-cache-check-configuration');
debug('Entry: [%s]', __filename);

// The name of the configuration file
const configFile = 'configuration.json'

// Command line options parser
var argv = require('yargs').help(false).argv;

// Initialise console colours
const chalk = require('chalk');

// Initialise default settings
var defaultSettings = {};

try {
	defaultSettings = require('./configuration.json'); // Load the defaults
} catch (error) {
	debug('An error occurred loading the %s file: %O', configFile, error);
	// The configuration file didn't load.  Return a bare and very basic config
	defaultSettings = {
		method: 'get',
		headersCollection: 'default',
		serviceDetection: true,
		IPScan: true,
		headersCollections: [
			{
				default: [
					'x-cache',
					'cache-control',
					'server',
					'content-encoding',
					'vary',
					'age',
				],
			},
		],
		ApexDomains: {},
		options: {
			exportToCSV: true,
			openAfterExport: false,
			headers: {
				'user-agent': 'ccc/{version} {OS}/{OSRelease}',
				Connection: 'close',
			},
			httpOptions: {
				timeout: 6000,
				response_timeout: 6000,
				read_timeout: 6000,
				follow: 5,
				compressed: true,
			},
			verbose: false,
		},
	};
}

function getSettings() {
	debug('Entry::getSettings()');

	// Load the defaults
	let settings = defaultSettings;
	debug('Loaded default settings: %O', settings);

	try {
		// Check command line parameters for overrides...
		debug('Looking for overrides to default settings');

		// Header Collection
		if (argv.headers) {
			// ** We should validate the specified collection actually exists **
			settings.headersCollection = argv.headers;
			debug(
				'Using the specified Headers Collection: %s',
				settings.headersCollection,
			);
		} else {
			debug(
				'Using the default Headers Collection: %s',
				settings.headersCollection,
			);
		}

		// Load the headers collections
		let headerCollection = this.getHeaderCollection(
			settings.headersCollection,
			settings,
		);
		// Add it into the Settings object
		settings.headerCollection = headerCollection;
		debug(
			'Will collect response header matching any of: %O',
			settings.headerCollection,
		);

		// HTTP Method
		if (argv.method) {
			const HTTPMethods = [
				'get',
				'head',
				'options',
				'put',
				'patch',
				'delete',
				'trace',
				'connect',
			];
			if (HTTPMethods.includes(argv.method.toLowerCase())) {
				settings.method = argv.method.toLowerCase();
				debug('Setting HTTP method to: %s', settings.method);
			} else {
				console.log(
					chalk.blue(
						'Warning: %s is not a supported HTTP method. Using %s instead.',
						argv.method.toUpperCase(),
						settings.method.toUpperCase(),
					),
				);
			}
		}

		// Number of HTTP redirects to follow
		if (argv.follow !== undefined) {
			// Validate that an integer was specified
			if (Number.isInteger(argv.follow)) {
				settings.options.httpOptions.follow = argv.follow;
				debug(
					'The number of HTTP redirects to follow is set to %s',
					settings.options.httpOptions.follow,
				);

				if (settings.options.httpOptions.follow === 0) {
					console.log(chalk.blue('HTTP redirects will not be followed'));
				}
			} else {
				console.log(
					chalk.yellow(
						'Warning: Ignoring "--follow %s" because "follow" must be an integer specifying the number of chained HTTP redirects to follow. Using the default %s instead',
					),
					argv.follow,
					settings.options.httpOptions.follow,
				);
			}
		}

		// Check for list-response-headers argument
		if (argv.listResponseHeaders) {
			settings.listResponseHeaders = true;
			// We can switch off the CDN detection output because we're just listing response headers
			settings.serviceDetection = false;
		} else {
			settings.listResponseHeaders = false;
		}

		// Check for '--open' argument
		if (argv.open) {
			settings.options.openAfterExport = true;
		}

		// Check for '--verbose' argument
		if (argv.verbose) {
			settings.options.verbose = true;
		}

		// Check for '--export false' argument
		if (argv.export) {
			if (typeof argv.export === 'string') {
				if (argv.export.toLowerCase() === 'false') {
					settings.options.exportToCSV = false;
					// Switch off openAfterExport because we're not exporting anything
					settings.options.openAfterExport = true;
				}
			}
		}

		// Check for '--ipscan false' argument
		if (argv.ipscan) {
			if (typeof argv.ipscan === 'string') {
				if (argv.ipscan.toLowerCase() === 'false') {
					settings.IPScan = false;
				}
			}
		}

		// Use a client specific customised user-agent string
		// settings.options.headers['user-agent'] = this.getUserAgent();
		settings.options.httpOptions.user_agent = this.getUserAgent();
		debug('Using the user-agent: %s', settings.options.httpOptions.user_agent);

		return settings;
	} catch (error) {
		console.error(`An error occurred in getSettings() - ${error.message}`);
		debug(error);
		return settings;
	}
}

function getHeaderCollection(collectionName, settings) {
	debug('getHeaderCollection(%s)', collectionName);
	// Iterate through each header collection definition
	for (let i = 0; i < settings.headersCollections.length; i++) {
		let currentCollection = Object.keys(settings.headersCollections[i])[0];
		debug(
			'comparing %s with %s',
			collectionName.toLowerCase(),
			currentCollection.toLowerCase(),
		);
		// Check if its name matches the supplied one
		if (collectionName.toLowerCase() === currentCollection.toLowerCase()) {
			// Return the array of headers
			debug(
				'getHeaderCollection() returning: %O',
				settings.headersCollections[i][currentCollection],
			);
			return settings.headersCollections[i][currentCollection];
		}
	}

	// If we get here then no matches were found.
	// Perhaps return something that will collect all headers - return (['*']);
	console.log(
		chalk.blue('WARNING: The requested header collection ') +
		collectionName +
		chalk.blue(' does not exist'),
	);
	return [];
}

function getHeaderCollections() {
	debug('getHeaderCollections():: Entry');
	// Extract the headersCollections array
	let headersCollections = defaultSettings.headersCollections;

	debug('Returning: %O', headersCollections);

	return headersCollections;
}

function displayHeaderCollections(headerCollections) {
	debug('displayHeaderCollections():: Entry');

	// Initialise prettyJson object, to format output
	let prettyJson = require('prettyjson');

	// Output the formatted json contained within each array element
	headerCollections.forEach((element) => console.log(prettyJson.render(element)));
}

function getUserAgent() {
	try {
		// Load package.json for the version number etc
		const npmPackage = require('./package.json');
		// Load O/S module to get client specifics
		const os = require('os');

		// Extract default user-agent string from default config
		let userAgent = defaultSettings.options.headers['user-agent'];

		// Replace embedded variables with platform specifics
		userAgent = userAgent.replace('{version}', npmPackage.version);

		userAgent = userAgent.replace('{OS}', os.type());

		userAgent = userAgent.replace('{OSRelease}', os.release());

		return userAgent;
	} catch (error) {
		debug('getUserAgent() caught an error: %O', error);
		return global.CCC_DEFAULT_USERAGENT;
	}
}

function displayConfigFileLocation() { // Display config file location
	// Platform independent new line character and path separator
	const EOL = require('os').EOL;
	const pathSeparator = require('path').sep;

	// Configuration file exists in the same directory as the main application __dirname
	let configFilePath = `${__dirname}${pathSeparator}${configFile}`;
	console.log(EOL + chalk.grey('Config file:') + chalk.yellowBright(configFilePath));
}

function initResponseObject() {
	let defaultResponseObject = {
		error: false,
		statusCode: 0,
		request: {},
		response: {},
		redirectCount: 0,
		ipAddress: null,
		ipFamily: null
	};

	return (defaultResponseObject);
}

module.exports = {
	displayConfigFileLocation,
	displayHeaderCollections,
	getHeaderCollection,
	getSettings,
	getUserAgent,
	getHeaderCollections,
	initResponseObject
};
