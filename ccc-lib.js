const debug = require('debug')('cdn-cache-check-lib');
debug('Entry: [%s]', __filename);

// Initialise console colours
const chalk = require('chalk');

function displayRequestSummary(
	urlCount,
	domainCount,
	requestCount,
	iterations,
) {
	let notification = chalk.cyan(`Checking ${urlCount} URLs`);

	if (domainCount > 1) {
		notification += chalk.cyan(` across ${domainCount} domains`);
	}

	if (iterations > 1) {
		notification += chalk.cyan(
			` * ${iterations} times (totaling ${requestCount} requests)`,
		);
	}

	console.log(notification);
}

module.exports = { displayRequestSummary };
