const debug = require('debug')('cdn-cache-check-lib');
debug('Entry: [%s]', __filename);

// Initialise console colours
const chalk = require('chalk');

/**
 * Custom error class for CCC errors with type information
 */
class CccError extends Error {
	constructor(message, type, details = null) {
		super(message);
		this.name = 'CccError';
		this.type = type;
		this.details = details;
		this.timestamp = new Date().toISOString();

		// Maintains proper stack trace for where error was thrown (V8 only)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, CccError);
		}
	}

	toJSON() {
		return {
			name: this.name,
			type: this.type,
			message: this.message,
			details: this.details,
			timestamp: this.timestamp,
			stack: this.stack
		};
	}
}

/**
 * Error types for categorizing errors
 */
const CccErrorTypes = {
	VALIDATION: 'VALIDATION',
	HTTP: 'HTTP',
	DNS: 'DNS',
	FILE_IO: 'FILE_IO',
	CONFIGURATION: 'CONFIGURATION',
	NETWORK: 'NETWORK',
	PARSING: 'PARSING',
	UNKNOWN: 'UNKNOWN'
};


// Function that notifies the user of how requests, across how many domains, are going to be made
function displayRequestSummary(urlCount, domainCount) {
	let notification = chalk.cyan(`Checking ${urlCount} URLs`);

	if (domainCount > 1) {
		notification += chalk.cyan(` across ${domainCount} domains`);
	}

	console.log(notification);
}

/**
 * Sanitize and validate a URL to ensure it only uses HTTP/HTTPS protocols
 * @param {string} url - The URL to sanitize
 * @returns {string} The sanitized URL
 * @throws {Error} If the URL uses an invalid protocol
 */
function sanitizeUrl(url) {
	try {
		const parsed = new URL(url);

		// Only allow http/https protocols
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			throw new CccError(
				`Invalid protocol "${parsed.protocol}". Only HTTP and HTTPS URLs are allowed`,
				CccErrorTypes.VALIDATION,
				{ url, protocol: parsed.protocol }
			);
		}

		return url;
	} catch (error) {
		if (error instanceof CccError) {
			throw error;
		}
		throw new CccError(
			`Invalid URL: ${error.message}`,
			CccErrorTypes.VALIDATION,
			{ url, originalError: error.message }
		);
	}
}

module.exports = { displayRequestSummary, sanitizeUrl, CccError, CccErrorTypes };