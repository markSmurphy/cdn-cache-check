const debug = require('debug')('cdn-cache-check-dns');
debug('Entry: [%s]', __filename);

// Initialise wildcard string parser
const matcher = require('multimatch');

// Initialise Domain validation object
const isValidDomain = require('is-valid-domain');

// Import DNS library
const dns = require('native-dns-multisocket');

// Load error handling
const { CccError, CccErrorTypes } = require('./ccc-lib');

function getDNSResolver() {
    debug('getDNSResolver()::entry');
    try {
        // Check if the static variable is already defined
        if (typeof (this.getDNSResolver.primaryDNSResolver) === 'undefined') {
            // Import dns module
            let dns = require('dns');

            // Get array of local machine's DNS resolvers
            let resolvers = dns.getServers();
            debug('Obtained resolvers list: %O', resolvers);

            // Pick the first one
            this.getDNSResolver.primaryDNSResolver = resolvers[0];
        }

        debug('Returning resolver: %s', this.getDNSResolver.primaryDNSResolver);
        // Return resolver IP Address
        return (this.getDNSResolver.primaryDNSResolver);

    } catch (error) {
        // An error occurred getting the locally configured resolver, so return default
        debug('getDNSResolvers caught an error: %O', error);
        debug('Returning default resolver: %s', global.CCC_DNS.DEFAULT_RESOLVER);
        return (global.CCC_DNS.DEFAULT_RESOLVER);
    }
}

function getUniqueDomains(urls) {
    try {
        // Using a Set() as it can only contain unique values
        let uniqueDomains = new Set();

        // Initialise the JSON return object
        let returnObject = {};

        // Initialise length of the longest FQDN in the list
        let domainNameLength = 0;

        // loop through array, extracting hostname from each URL
        for (let i = 0; i < urls.length; i++) {
            // Load the URL into a parsed object
            let currentUrl = new URL(urls[i]);
            // Extract the hostname from the URL
            let hostname = currentUrl.hostname;
            // Add the hostname to the Set
            uniqueDomains.add(hostname);
            // Record the length of the hostname if it's the largest yet
            domainNameLength = (hostname.length > domainNameLength) ? hostname.length : domainNameLength;
        }

        returnObject.domains = Array.from(uniqueDomains);
        returnObject.domainNameLength = domainNameLength;
        returnObject.count = uniqueDomains.size;
        return (returnObject);

    } catch (error) {
        debug('Exception caught in getUniqueDomains(): %O', error);
        throw new CccError(
            'Failed to extract unique domains from URLs',
            CccErrorTypes.PARSING,
            { urls, originalError: error.message }
        );
    }
}

function parseAnswer(answer, options) {
    debug('parseAnswer(answer, options) called with answer: %O ---> options: %O', answer, options);

    // Validate the answer object has something to parse
    if (Array.isArray(answer) && answer.length === 0) {
        debug('parseAnswer() answer[] is an empty array. Nothing to parse; returning "no_address"');
        // No IP addresses, `answer` is an empty array
        return ('no_address');
    } else {
        // Initialise the array we're going to return
        let response = [];

        // Add the hostname that was resolved to the response[] array (so we have a complete end-to-end chain in the recursive response)
        if (Object.prototype.hasOwnProperty.call(answer[0], 'name')) {
            response.push(answer[0].name);
        }

        switch (options.operation) {
            case 'getRecursion': { // Get full recursive hostnames

                // Get the whole nested recursion
                for (let i = 0; i < answer.length; i++) {

                    if (Object.prototype.hasOwnProperty.call(answer[i], 'data')) { // Check if the answer element has a "data" property (which a CNAME record will have)
                        response.push(answer[i].data); // Extract CNAME record data

                    } else if ((options.includeIpAddresses) && (Object.prototype.hasOwnProperty.call(answer[i], 'address'))) { // Check if the answer element has an "address" property (which an A record will have)
                        response.push(answer[i].address); // Extract A record data
                    }
                }
                break;
            }
            case 'getTTL': {
                // Get the record's time-to-live value
                response = answer[0].ttl;
                debug('TTL: %s', answer[0].ttl);
                break;
            }

            default: // Extract the IP address by default
                for (let i = 0; i < answer.length; i++) { // Iterate through recursive answer
                    if (Object.prototype.hasOwnProperty.call(answer[i], 'address')) {
                        response = answer[i].address;
                    }
                }
        }

        return (response);
    }
}

let inspectDNS = (domain, settings) => {
    debug('inspectDNS(%s)', domain);

    return new Promise(function (resolve, reject) {

        let response = global.CCC_SERVICE_DETECTION_DEFAULT_RESPONSE;               // Initialise response object
        response.fqdn = domain;                                                     // Set the Fully Qualified Domain Name

        if (typeof (domain) === 'string' && domain.trim().length > 0) {             // Check if the fqdn is a non-empty string

            if (isValidDomain(domain, { subdomain: true, wildcard: false })) {      // Verify that the fqdn conforms to DNS specifications

                let question = dns.Question({                                       // Create DNS Question object
                    name: domain,
                    type: global.CCC_DNS_REQUEST_RECORD_TYPE,
                });

                let req = dns.Request({                                             // Create DNS Request object
                    question: question,
                    server: { address: getDNSResolver(), port: 53, type: 'udp' },
                    timeout: 5000
                });

                // DNS 'timeout' event
                req.on('timeout', () => {                                           // Handle DNS timeout event
                    debug('DNS timeout occurred resolving [%s]', domain);
                    response.message = 'DNS Timeout';                               // Record Timeout message
                    response.messages.push(response.message);                       // Add message to the messages[] array
                    response.reason = `DNS timeout after ${req.timeout} ms`;
                    response.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.ERROR;

                    reject(response);                                               // reject the promise
                });

                // DNS 'message' event
                req.on('message', (error, answer) => {                              // handle DNS message event
                    if (error) {                                                    // DNS returned an error
                        debug('Received DNS error for %s: %O', domain, error);
                        response.message = `DNS Error flagged in message event: ${error}`;
                        response.messages.push(response.message);                   // Add message to the messages[] array
                        response.reason = 'DNS Error';
                        response.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.ERROR;
                        debug('inspectDNS() rejecting Promise with response: %O', response);
                        reject(response);                                           // reject the promise

                    } else {                                                        // Process DNS Answer
                        debug('Received DNS answer to the lookup for [%s]: %O', domain, answer);

                        // Expand the answer into an array of all nested addresses in the full DNS recursion
                        response.dnsAnswer = parseAnswer(answer.answer, { operation: 'getRecursion' });

                        // Get the IP address from the DNS answer
                        debug('Extracting the IP address from the DNS answer');
                        response.ipAddress = parseAnswer(answer.answer, {});

                        // Iterate through each nested address in the DNS answer to check if matches a known service's domain
                        for (let i = 0; i < response.dnsAnswer.length; i++) {
                            for (let service in settings.apexDomains) {
                                debug('Evaluating FQDN [%s] against the service [%s] which uses the domains: %O', response.dnsAnswer[i], service, settings.apexDomains[service].domains);

                                // Generate an array of service apex domains which match the FQDN's CNAME chain entries
                                let matchingDomains = matcher(response.dnsAnswer[i], settings.apexDomains[service].domains);

                                if (matchingDomains.length > 0) {               // We've found 6y7/a match.  Record the details
                                    debug('%s is served by %s due to nested domain %s', domain, settings.apexDomains[service].title, matchingDomains[0]);

                                    // Populate response object properties
                                    response.reason = `${domain} resolves to ${matchingDomains[0]} which matches a ${service} domain pattern`;
                                    response.matchingDomains = matchingDomains[0];
                                    response.service = settings.apexDomains[service].service;
                                    response.message = settings.apexDomains[service].title;
                                    response.messages.push(response.message);

                                    if (settings.apexDomains[service].service.toUpperCase() === 'CDN') {
                                        response.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.CDN;

                                    } else {
                                        response.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.OTHER;
                                    }
                                }
                            }
                        }

                        // Check if the DNS inspection didn't identify the service provider
                        if (response.status === global.CCC_SERVICE_DETECTION_STATUS_LABEL.UNKNOWN) {
                            // We didn't identify the service behind the domain name
                            response.message = [global.CCC_SERVICE_DETECTION_STATUS_LABEL.UNKNOWN]; // add the "Unknown" message
                            debug('%s\'s DNS recursion didn\'t match a known provider\'s domain (response.status: %s)', domain, response.status);
                        }

                        debug('inspectDNS(%s) returning: %O', domain, response);

                        // Return response object as we found a known service behind the fqdn
                        resolve(response);
                    }
                });

                debug('Sending DNS Request: %O', req);
                req.send();                                                     // Issue the DNS lookup request

            } else {
                response.message = `DNS Inspection failed. The "fqdn" [${domain}] did not pass DNS name validation.`
                response.messages.push(response.message);                       // Add message to the messages[] array
                debug('inspectDNS() rejecting Promise with response: %O', response);
                reject(response);                                               // reject the promise
            }


        } else {
            response.message = `DNS Inspection failed. The "fqdn" parameter [${domain}] is either empty or not a string.`
            response.messages.push(response.message);                           // Add message to the messages[] array
            debug('inspectDNS() rejecting Promise with response: %O', response);
            reject(response);                                                   // reject the promise
        }
    });
};

module.exports = { getDNSResolver, getUniqueDomains, inspectDNS };