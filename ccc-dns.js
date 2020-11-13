const debug = require('debug')('cdn-cache-check-dns');
debug('Entry: [%s]', __filename);

// Global Constants
const CCC_DNS_REQUEST_RECORD_TYPE = 'A';
const CCC_CDN_DETERMINATION_STATUS = {
    INDETERMINATE: 'Indeterminate',
    CDN: 'CDN',
    ERROR: 'Error',
    OTHER: 'Other Internet Service'
};

// Initialise wildcard string parser
const matcher = require('multimatch');

// Initialise Domain validation object
const isValidDomain = require('is-valid-domain');

// Import DNS library
const dns = require('native-dns-multisocket');

// Console Colours
const chalk = require('chalk');

module.exports = {
    getUniqueDomains(urls) {
        try {
            // Using a Set() as it can only contain unique values
            let uniqueDomains = new Set();

            // Initialise the JSON return object
            let returnObject = {};

            var maxLength = 0;

            // loop through array, extracting hostname from each URL
            for (let i = 0; i < urls.length; i++) {
                // Load the URL into a parsed object
                let currentUrl = new URL(urls[i]);
                // Extract the hostname from the URL
                let hostname =currentUrl.hostname;
                // Add the hostname to the Set
                uniqueDomains.add(hostname);
                // Record the length of the hostname if it's the largest yet
                maxLength = (hostname.length > maxLength) ? hostname.length : maxLength;
            }

            returnObject.domains = Array.from(uniqueDomains);
            returnObject.maxLength = maxLength;
            returnObject.count = uniqueDomains.size;
            return(returnObject);

        } catch (error) {
            debug('Exception caught in getUniqueDomains(): %O', error);
            return(null);
        }
    },
    parseAnswer(answer, options) {
        debug('parseAnswer(answer, options) called with answer: %O ---> options: %O', answer, options);

        // Validate the answer object has something to parse
        if (Array.isArray(answer) && answer.length === 0) {
            debug('parseAnswer() answer[] is an empty array. Nothing to parse; returning "no_address"');
            // No IP addresses, `answer` is an empty array
            return('no_address');
        } else {
            // Initialise the response
            var response = '';
            switch (options.operation) {
                case 'getRecursion': // Get full recursive hostnames
                    // Initialise the array we're going to return
                    response = [];
                    // Get the whole nested recursion
                    for (let i = 0; i < answer.length; i++){

                        if(Object.prototype.hasOwnProperty.call(answer[i], 'data')){ // Check if the answer element has a "data" property (which a CNAME record will have)
                            response.push(answer[i].data); // Extract CNAME record data

                        } else if (Object.prototype.hasOwnProperty.call(answer[i], 'address')) { // Check if the answer element has an "address" property (which an A record will have)
                            response.push(answer[i].address); // Extract A record data
                        } else {
                            debug('Warning: There is an unhandled element [%s] in answer array: %O', i, answer[i]);
                        }
                    }
                    break;
                case 'getTTL':
                    // Get the record's time-to-live value
                    response = answer[0].ttl;
                    debug('TTL: %s', answer[0].ttl);
                    break;

                default: // Extract the IP address by default
                for (let i = 0; i < answer.length; i++) { // Iterate through recursive answer
                    if (Object.prototype.hasOwnProperty.call(answer[i], 'address')) {
                        response = answer[i].address;
                    }
                }
            }

            return(response);
        }
    },
    determineCDN(hostname, apexDomains, callback) {
        debug('determineCDN(%s)', hostname);

        // Set default response
        let cdnResponse = {
            message: 'Indeterminate',
            hostname: hostname,
            reason: 'Not enough information to make a determination',
            service: 'Unknown',
            status: CCC_CDN_DETERMINATION_STATUS.INDETERMINATE
        };

        if (isValidDomain(hostname, {subdomain: true, wildcard: false})) { // Validate that the hostname conforms to DNS specifications

            let question = dns.Question({
                name: hostname,
                type: CCC_DNS_REQUEST_RECORD_TYPE,
            });

            let req = dns.Request({
                question: question,
                server: {address: '8.8.8.8', port: 53, type: 'udp'},
                timeout: 2500
            });

            req.on('timeout', () => { // DNS timeout
                debug('DNS timeout occurred resolving [%s]', hostname);
                cdnResponse.message = 'DNS Timeout';
                cdnResponse.reason = 'DNS Timeout';
                cdnResponse.error = 'Timeout after %d milliseconds', req.timeout;
                cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.ERROR;
                callback(cdnResponse);
            });

            req.on('message', (error, answer) => { // DNS message received
                if (error) { // DNS returned an error
                    debug(chalk.grey('Received DNS error for %s: %O'), hostname, error);
                    cdnResponse.message = 'DNS Error';
                    cdnResponse.reason = 'DNS Error';
                    cdnResponse.error = error;
                    cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.ERROR;
                } else {
                    debug('Received DNS answer lookup for [%s]: %O', hostname, answer);

                    // Expand the answer into an array of all nested addresses in the full recursion
                    cdnResponse.dnsAnswer = module.exports.parseAnswer(answer.answer, {operation: 'getRecursion'});

                    // Iterate through each nested address in the DNS answer to check if matches a known CDN
                    for (var i = 0; i < cdnResponse.dnsAnswer.length; i++) {
                        for (let cdn in apexDomains) {
                            debug('Evaluating %s against %s [%s]', cdnResponse.dnsAnswer[i], apexDomains[cdn], cdn);
                            let matchingDomains = matcher(cdnResponse.dnsAnswer[i], apexDomains[cdn].domains);
                            debug('matchingDomains: %O', matchingDomains);
                            if (matchingDomains.length > 0) {
                                // We've found a match.  Record the details; we don't need to loop through the rest of the DNS response
                                debug('Setting return value to [' + cdn + '] for [' + hostname +']');
                                if (apexDomains[cdn].service.toUpperCase() === 'CDN') {
                                    cdnResponse.message = apexDomains[cdn].title;
                                    debug('FOUND CDN: %s [%s]', cdnResponse.message, cdnResponse.dnsAnswer[i]);
                                    cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.CDN;
                                } else {
                                    cdnResponse.message = apexDomains[cdn].title;
                                    debug('FOUND RECOGNISED SERVICE: %s [%s]', cdnResponse.message, cdnResponse.dnsAnswer[i]);
                                    cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.OTHER;
                                }

                                cdnResponse.matchingDomains = matchingDomains[0];
                                cdnResponse.service = apexDomains[cdn].service.toUpperCase();
                            }
                        }
                    }
                    callback(cdnResponse);
                }
            });

            req.send();

        } else { // hostname didn't pass the validate-domain check
            cdnResponse.message = 'Invalid DNS domain';
            cdnResponse.reason = 'The hostname "%s" doesn\'t conform to DNS specifications', hostname;
            cdnResponse.service = 'None';
            cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.ERROR;
        }
    }
}