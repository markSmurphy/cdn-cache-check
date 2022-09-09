const debug = require('debug')('cdn-cache-check-service-provider-azure');
debug('Entry: [%s]', __filename);

// Library for working with CIDR notations (Classless Inter-Domain Routing)
const IPCIDR = require('ip-cidr');

// Load the `service.providers/services.json` configuration file
const serviceProviders = require('./services.json');

// Import library for writing to console via StdOut
const consoleUpdate = require('../consoleUpdate');

// Load the Azure IP Addresses/Services data
const services = require(serviceProviders.Azure.dataFile);


function lookupIpAddress(ipAddress, options = { verbose: false }) {
    debug('lookupIpAddress(%s)::entry', ipAddress, options);

    // Initialise response object
    let response = global.CCC_SERVICE_DETERMINATION_DEFAULT_RESPONSE;
    response.ipAddress = ipAddress;
    response.status = global.CCC_SERVICE_DETERMINATION_LABELS.UNKNOWN;

    // Loop through each service
    debug('Checking if the IP address [%s] matches one of %s known Azure services', ipAddress, services.values.length);
    for (let i = 0; i < services.values.length; i++) {
        // Checking against each service
        let currentService = services.values[i].id;
        debug('Checking against %s CIDR blocks for service ID: %s', services.values[i].properties.addressPrefixes.length, currentService);

        consoleUpdate.writeLn(`Scanning Azure Services for ${ipAddress}: ${currentService}`);

        for (let ii = 0; ii < services.values[i].properties.addressPrefixes.length; ii++) {
            // Checking within each CIDR block for the current service
            let cidr = new IPCIDR(services.values[i].properties.addressPrefixes[ii]);

            // Check if the IP address exists within the cidr block
            if (cidr.contains(ipAddress)) {
                response.reason = `${ipAddress} is in the CIDR block ${services.values[i].properties.addressPrefixes[ii]} which is used by Azure service: ${services.values[i].id}`;
                let strMessage = services.values[i].properties.systemService;
                // Check if there's a specific region within the data
                if (services.values[i].properties.regionId > 0) {
                    // Record and append region
                    response.regionId = services.values[i].properties.regionId;
                    response.region = services.values[i].properties.region;
                    strMessage += ` (${services.values[i].properties.region})`;
                }
                response.messages.push(strMessage);
                response.status = global.CCC_SERVICE_DETERMINATION_LABELS.AZURE;

                if (options.verbose === false) { // Check if verbose mode is disabled, because we'll log everything if it's not

                    break; // Break out of 'ii' for-loop (around CIDR blocks) as we've found a match

                }

            }
        }

        if (options.verbose === false) { // Check if verbose mode is disabled, because we'll log everything if it's not
            if (response.regionId > 0) {

                break; // Break out of 'i' for-loop (around Azure Services) as we've found a match with a specific region

            }
        }
    }

    // Clear console progress text
    consoleUpdate.clearLn();

    // Use the last matching service as the default `message`
    response.message = response.messages[response.messages.length - 1];

    // Return the response object
    return (response);
}

module.exports = { lookupIpAddress };