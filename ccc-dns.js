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

// File System library
const fs = require('fs');

// Platform independent path separator
const pathSeparator = require('path').sep;

// Library for working with CIDR
const IPCIDR = require('ip-cidr');

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
            // Initialise the array we're going to return
            var response = [];

            // Add the hostname that was resolved to the response array (so we have a complete end-to-end chain in the recursive response)
            if (Object.prototype.hasOwnProperty.call(answer[0], 'name')){
                response.push(answer[0].name);
            }

            switch (options.operation) {
                case 'getRecursion': // Get full recursive hostnames

                    // Get the whole nested recursion
                    for (let i = 0; i < answer.length; i++){

                        if (Object.prototype.hasOwnProperty.call(answer[i], 'data')){ // Check if the answer element has a "data" property (which a CNAME record will have)
                            response.push(answer[i].data); // Extract CNAME record data

                        } else if ((options.includeIpAddresses) && (Object.prototype.hasOwnProperty.call(answer[i], 'address'))) { // Check if the answer element has an "address" property (which an A record will have)
                            response.push(answer[i].address); // Extract A record data
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
            message: 'Unknown',
            hostname: hostname,
            reason: '',
            service: 'Unknown',
            status: CCC_CDN_DETERMINATION_STATUS.INDETERMINATE,
            ipAddress: null
        };

        if (isValidDomain(hostname, {subdomain: true, wildcard: false})) { // Validate that the hostname conforms to DNS specifications

            let question = dns.Question({
                name: hostname,
                type: CCC_DNS_REQUEST_RECORD_TYPE,
            });

            let req = dns.Request({
                question: question,
                server: {address: '8.8.8.8', port: 53, type: 'udp'},
                timeout: 5000
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
                    debug('Received DNS error for %s: %O', hostname, error);
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
                            debug('Evaluating [%s] against [%s]: %O', cdnResponse.dnsAnswer[i], cdn, apexDomains[cdn].domains);
                            let matchingDomains = matcher(cdnResponse.dnsAnswer[i], apexDomains[cdn].domains);
                            if (matchingDomains.length > 0) {
                                // We've found a match.  Record the details
                                debug('%s is served by %s due to nested domain %s', hostname, apexDomains[cdn].title, matchingDomains[0]);

                                cdnResponse.reason = `${hostname} resolves to ${matchingDomains[0]} which matches a ${cdn} domain pattern`;
                                cdnResponse.matchingDomains = matchingDomains[0];
                                cdnResponse.service = apexDomains[cdn].service.toUpperCase();
                                cdnResponse.message = apexDomains[cdn].title;
                                cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.CDN;
                                if (apexDomains[cdn].service.toUpperCase() !== 'CDN') {
                                    cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.OTHER;
                                }
                            }
                        }
                    }

                    // Check if the DNS chain successfully identified the CDN service
                    if (cdnResponse.status === CCC_CDN_DETERMINATION_STATUS.INDETERMINATE) {
                        // Get the IP address from the DNS answer
                        cdnResponse.ipAddress = module.exports.parseAnswer(answer.answer, {});
                        // DNS didn't yield a conclusive answer. Check the IP Address against the AWS service list
                        let awsServicesFile = __dirname + pathSeparator + 'service.providers/aws/ip-ranges.json';
                        let rawData = fs.readFileSync(awsServicesFile);  // Read the AWS services file
                        let awsServices = JSON.parse(rawData); // Parse it into a JSON object

                        // Loop through each service
                        for (let i = 0; i < awsServices.prefixes.length; i++) {
                            // Create a cidr object based on current service's IP prefix range
                            const cidr = new IPCIDR(awsServices.prefixes[i].ip_prefix);

                            // Check if the IP address exists within the cidr block
                            if (cidr.contains(cdnResponse.ipAddress)) {
                                cdnResponse.message = awsServices.prefixes[i].service; // Put the service name into the return object's message
                                cdnResponse.reason = `${cdnResponse.ipAddress} is in the CIDR block ${awsServices.prefixes[i].ip_prefix} which is used by AWS ${awsServices.prefixes[i].service}`;

                                if (String.prototype.toUpperCase.call(cdnResponse.message) === 'CLOUDFRONT') { // Check if the service is CloudFront
                                    cdnResponse.message = 'CloudFront'; // Let's keep the case consistent
                                    cdnResponse.service = 'CDN';
                                    cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.CDN;
                                } else {
                                    cdnResponse.status = CCC_CDN_DETERMINATION_STATUS.OTHER;
                                    cdnResponse.service = awsServices.prefixes[i].service;
                                    if (String.prototype.toUpperCase.call(awsServices.prefixes[i].region) != 'GLOBAL') { // Append the region if it's not ambiguous
                                        cdnResponse.message+=' (' + awsServices.prefixes[i].region + ')';
                                    }
                                }
                            }
                        }
                    }

                    debug('determineCDN(%s) returning: %O', hostname, cdnResponse);
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