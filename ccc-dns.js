const debug = require('debug')('cdn-cache-check-dns');
debug('Entry: [%s]', __filename);

// Global Constants
const constants = require('./constants.json');

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

const serviceDetectionAzure = require('./service.providers/azure');

module.exports = {
    getDNSResolver() {
        debug('getDNSResolver()::entry');
        try {
            // Check if the static variable is already defined
            if (typeof(this.getDNSResolver.primaryDNSResolver) === 'undefined') {
                // Import dns module
                let dns = require('dns');

                // Get array of local machine's DNS resolvers
                let resolvers = dns.getServers();
                debug('Obtained resolvers list: %O', resolvers );

                // Pick the first one
                this.getDNSResolver.primaryDNSResolver = resolvers[0];
            }

            debug('Returning resolver: %s', this.getDNSResolver.primaryDNSResolver);
            // Return resolver IP Address
            return(this.getDNSResolver.primaryDNSResolver);
        } catch (error) {
            // An error occurred getting the locally configured resolver, so return default
            debug('getDNSResolvers caught an error: %O', error);
            debug('Returning default resolver: %s', constants.CCC_DNS.DEFAULT_RESOLVER);
            return(constants.CCC_DNS.DEFAULT_RESOLVER);
        }
    },
    getUniqueDomains(urls) {
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
                let hostname =currentUrl.hostname;
                // Add the hostname to the Set
                uniqueDomains.add(hostname);
                // Record the length of the hostname if it's the largest yet
                domainNameLength = (hostname.length > domainNameLength) ? hostname.length : domainNameLength;
            }

            returnObject.domains = Array.from(uniqueDomains);
            returnObject.domainNameLength = domainNameLength;
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
            message: [],
            hostname: hostname,
            reason: '',
            service: 'Unknown',
            status: constants.CCC_CDN_DETERMINATION_STATUS.INDETERMINATE,
            ipAddress: null
        };

        if (isValidDomain(hostname, {subdomain: true, wildcard: false})) { // Validate that the hostname conforms to DNS specifications

            let question = dns.Question({
                name: hostname,
                type: constants.CCC_DNS_REQUEST_RECORD_TYPE,
            });

            let req = dns.Request({
                question: question,
                server: {address: module.exports.getDNSResolver(), port: 53, type: 'udp'},
                timeout: 5000
            });

            req.on('timeout', () => { // DNS timeout
                debug('DNS timeout occurred resolving [%s]', hostname);
                cdnResponse.message.push('DNS Timeout');
                cdnResponse.reason = 'DNS Timeout';
                cdnResponse.error = `Timeout after ${req.timeout} milliseconds`;
                cdnResponse.status = constants.CCC_CDN_DETERMINATION_STATUS.ERROR;
                callback(cdnResponse);
            });

            req.on('message', (error, answer) => { // DNS message received
                if (error) { // DNS returned an error
                    debug('Received DNS error for %s: %O', hostname, error);
                    cdnResponse.message.push('DNS Error');
                    cdnResponse.reason = 'DNS Error';
                    cdnResponse.error = error;
                    cdnResponse.status = constants.CCC_CDN_DETERMINATION_STATUS.ERROR;
                } else {
                    debug('Received DNS answer lookup for [%s]: %O', hostname, answer);

                    // Expand the answer into an array of all nested addresses in the full recursion
                    cdnResponse.dnsAnswer = module.exports.parseAnswer(answer.answer, {operation: 'getRecursion'});

                    // Iterate through each nested address in the DNS answer to check if matches a known CDN
                    for (let i = 0; i < cdnResponse.dnsAnswer.length; i++) {
                        for (let cdn in apexDomains) {
                            debug('Evaluating [%s] against [%s]: %O', cdnResponse.dnsAnswer[i], cdn, apexDomains[cdn].domains);
                            let matchingDomains = matcher(cdnResponse.dnsAnswer[i], apexDomains[cdn].domains);
                            if (matchingDomains.length > 0) {
                                // We've found a match.  Record the details
                                debug('%s is served by %s due to nested domain %s', hostname, apexDomains[cdn].title, matchingDomains[0]);

                                cdnResponse.reason = `${hostname} resolves to ${matchingDomains[0]} which matches a ${cdn} domain pattern`;
                                cdnResponse.matchingDomains = matchingDomains[0];
                                cdnResponse.service = apexDomains[cdn].service.toUpperCase();
                                cdnResponse.message.push(apexDomains[cdn].title);
                                cdnResponse.status = constants.CCC_CDN_DETERMINATION_STATUS.CDN;
                                if (apexDomains[cdn].service.toUpperCase() !== 'CDN') {
                                    cdnResponse.status = constants.CCC_CDN_DETERMINATION_STATUS.OTHER;
                                }
                            }
                        }
                    }

                    // Check if the DNS chain inspection didn't identify it as a CDN
                    if (cdnResponse.status != constants.CCC_CDN_DETERMINATION_STATUS.CDN) {
                        // DNS didn't yield a conclusive answer. Check the IP Address against each of the service providers' list
                        debug('%s\'s DNS recursion didn\'t match a known provider\'s domain (cdnResponse.status: %s)', hostname, cdnResponse.status);
                        // Get the IP address from the DNS answer first
                        debug('Extracting the IP address from the DNS answer');
                        cdnResponse.ipAddress = module.exports.parseAnswer(answer.answer, {});

                        let azureResponse = serviceDetectionAzure.lookupIpAddress(cdnResponse.ipAddress);
                        console.log('AZURE SERVICE DETECTION: %O', azureResponse);

                        // ***** Service Providers' Detection *****
                        // Check the IP Address against the AWS service list
                        let awsServicesFile = __dirname + pathSeparator + 'service.providers/aws/ip-ranges.json';
                        let rawData = fs.readFileSync(awsServicesFile); // Read the AWS services file
                        let awsServices = JSON.parse(rawData); // Parse it into a JSON object
                        let awsServicesMessage = []; // Temporarily store the message because the AWS JSON might contain two matching CIDR blocks, so we can't just concatenate

                        // Loop through each service
                        debug('Checking if the IP address [%s] matches a known AWS service', cdnResponse.ipAddress);
                        for (let i = 0; i < awsServices.prefixes.length; i++) {
                            // Create a cidr object based on current service's IP prefix range
                            const cidr = new IPCIDR(awsServices.prefixes[i].ip_prefix);

                            // Check if the IP address exists within the cidr block
                            if (cidr.contains(cdnResponse.ipAddress)) {
                                debug('%s is in the CIDR block %s, which is AWS service %s', cdnResponse.ipAddress, awsServices.prefixes[i].ip_prefix, awsServices.prefixes[i].service);
                                awsServicesMessage.push(awsServices.prefixes[i].service);
                                cdnResponse.status = constants.CCC_CDN_DETERMINATION_STATUS.AWS;
                                cdnResponse.reason = `${cdnResponse.ipAddress} is in the CIDR block ${awsServices.prefixes[i].ip_prefix} which is used by AWS ${awsServices.prefixes[i].service}`;

                                if (String.prototype.toUpperCase.call(awsServicesMessage[awsServicesMessage.length - 1]) === 'CLOUDFRONT') { // Check if the service is CloudFront
                                    cdnResponse.service = 'CDN';
                                    cdnResponse.status = constants.CCC_CDN_DETERMINATION_STATUS.CDN;
                                }
                            }
                        }

                        if (awsServicesMessage.length > 0) {
                            // Save the generated message into the response object
                            cdnResponse.message.push('[' + awsServicesMessage.join(' -> ') + ']');
                        }

                    }

                    debug('determineCDN(%s) returning: %O', hostname, cdnResponse);

                    // Check if the message array is blank, and add the default message if it is
                    if (cdnResponse.message.length === 0) {
                        // We didn't identify the service behind the domain name or IP address
                        cdnResponse.message = ['Unknown'];
                    }
                    callback(cdnResponse);
                }
            });

            req.send();

        } else { // hostname didn't pass the validate-domain check
            cdnResponse.message = 'Invalid DNS domain';
            cdnResponse.reason = `The hostname "${hostname}" doesn't conform to DNS specifications`;
            cdnResponse.service = 'None';
            cdnResponse.status = constants.CCC_CDN_DETERMINATION_STATUS.ERROR;
            // TO DO *** test if this is actually passed back in the callback if this condition is met
        }
    }
};