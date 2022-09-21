const debug = require('debug')('cdn-cache-check-lib');
debug('Entry: [%s]', __filename);

// Initialise console colours
const chalk = require('chalk');


// Function of notifies the user of how requests, across how many domains, are going to be make
function displayRequestSummary(urlCount, domainCount) {
	let notification = chalk.cyan(`Checking ${urlCount} URLs`);

	if (domainCount > 1) {
		notification += chalk.cyan(` across ${domainCount} domains`);
	}

	console.log(notification);
}

module.exports = { displayRequestSummary };
