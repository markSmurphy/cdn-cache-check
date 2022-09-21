const debug = require('debug')('cdn-cache-check-dns');
debug('Entry: [%s]', __filename);

// Initialise wildcard string parser
const matcher = require('multimatch');

// Initialise Domain validation object
const isValidDomain = require('is-valid-domain');

// Import DNS library
const dns = require('native-dns-multisocket');

// Initialise Service Provider Detection Libraries
const serviceDetectionAzure = require('./service.providers/azure');
//const serviceDetectionAWS = require('./service.providers/aws');


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
        return (null);
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
        var response = [];

        // Add the hostname that was resolved to the response array (so we have a complete end-to-end chain in the recursive response)
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

function determineCDN(hostname, settings, callback) {
    debug('determineCDN(%s)', hostname);

    // Set default response
    let discoveryResponse = {
        message: [],
        hostname: hostname,
        reason: '',
        service: global.CCC_SERVICE_DETECTION_STATUS_LABEL.UNKNOWN,
        status: global.CCC_SERVICE_DETECTION_STATUS_LABEL.UNKNOWN,
        ipAddress: null
    };

    if (isValidDomain(hostname, { subdomain: true, wildcard: false })) { // Validate that the hostname conforms to DNS specifications

        let question = dns.Question({
            name: hostname,
            type: global.CCC_DNS_REQUEST_RECORD_TYPE,
        });

        let req = dns.Request({
            question: question,
            server: { address: module.exports.getDNSResolver(), port: 53, type: 'udp' },
            timeout: 5000
        });

        req.on('timeout', () => { // DNS timeout
            debug('DNS timeout occurred resolving [%s]', hostname);
            discoveryResponse.message.push('DNS Timeout');
            discoveryResponse.reason = 'DNS Timeout';
            discoveryResponse.error = `Timeout after ${req.timeout} milliseconds`;
            discoveryResponse.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.ERROR;
            callback(discoveryResponse);
        });

        req.on('message', (error, answer) => { // DNS message received
            if (error) { // DNS returned an error
                debug('Received DNS error for %s: %O', hostname, error);
                discoveryResponse.message.push('DNS Error');
                discoveryResponse.reason = 'DNS Error';
                discoveryResponse.error = error;
                discoveryResponse.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.ERROR;
            } else {
                debug('Received DNS answer lookup for [%s]: %O', hostname, answer);

                // Expand the answer into an array of all nested addresses in the full recursion
                discoveryResponse.dnsAnswer = parseAnswer(answer.answer, { operation: 'getRecursion' });

                // Iterate through each nested address in the DNS answer to check if matches a known CDN
                for (let i = 0; i < discoveryResponse.dnsAnswer.length; i++) {
                    for (let cdn in settings.apexDomains) {
                        debug('Evaluating [%s] against [%s]: %O', discoveryResponse.dnsAnswer[i], cdn, settings.apexDomains[cdn].domains);
                        let matchingDomains = matcher(discoveryResponse.dnsAnswer[i], settings.apexDomains[cdn].domains);
                        if (matchingDomains.length > 0) {
                            // We've found a match.  Record the details
                            debug('%s is served by %s due to nested domain %s', hostname, settings.apexDomains[cdn].title, matchingDomains[0]);

                            discoveryResponse.reason = `${hostname} resolves to ${matchingDomains[0]} which matches a ${cdn} domain pattern`;
                            discoveryResponse.matchingDomains = matchingDomains[0];
                            discoveryResponse.service = settings.apexDomains[cdn].service.toUpperCase();
                            discoveryResponse.message.push(settings.apexDomains[cdn].title);
                            discoveryResponse.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.CDN;
                            if (settings.apexDomains[cdn].service.toUpperCase() !== 'CDN') {
                                discoveryResponse.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.OTHER;
                            }
                        }
                    }
                }

                // Check if the DNS chain inspection didn't identify the service provider
                if (discoveryResponse.status === global.CCC_SERVICE_DETECTION_STATUS_LABEL.UNKNOWN) {
                    // DNS didn't yield a conclusive answer. Check the IP Address against each of the service providers' list
                    debug('%s\'s DNS recursion didn\'t match a known provider\'s domain (discoveryResponse.status: %s)', hostname, discoveryResponse.status);

                    // We might want to have a switch to disable the IP address scan
                    //if (settings.IPScan === true)

                    // Get the IP address from the DNS answer first
                    debug('Extracting the IP address from the DNS answer');
                    discoveryResponse.ipAddress = module.exports.parseAnswer(answer.answer, {});

                    // Azure Service Detection
                    let azureResponse = serviceDetectionAzure.lookupIpAddress(discoveryResponse.ipAddress);
                    debug('AZURE SERVICE DETECTION for %s: %O', discoveryResponse.ipAddress, azureResponse);

                    // Populate `discoveryResponse` object properties
                    discoveryResponse.message = azureResponse.message;
                    discoveryResponse.reason = azureResponse.reason;
                    discoveryResponse.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.AZURE;

                    // AWS Service Detection
                    //let awsResponse = serviceDetectionAWS.lookupIpAddress(discoveryResponse.ipAddress);
                    /* console.log('AWS SERVICE DETECTION for %s: %O', discoveryResponse.ipAddress, awsResponse);
                    console.log('AWS SERVICE DETECTION: %s', awsResponse.reason); */
                }

                debug('determineCDN(%s) returning: %O', hostname, discoveryResponse);

                if (!discoveryResponse?.message?.length) { // Check if the message array is blank
                    // We didn't identify the service behind the domain name or IP address
                    discoveryResponse.message = [global.CCC_SERVICE_DETECTION_STATUS_LABEL.UNKNOWN]; // add the default message
                }
                callback(discoveryResponse);
            }
        });

        debug('Sending DNS Request: %O', req);

        req.send();

    } else { // hostname didn't pass the validate-domain check
        discoveryResponse.message = 'Invalid DNS domain';
        discoveryResponse.reason = `The hostname "${hostname}" doesn't conform to DNS specifications`;
        discoveryResponse.service = 'None';
        discoveryResponse.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.ERROR;
    }
}

let inspectDNS = (fqdn, settings) => {
    debug('inspectDNS(%s)', fqdn);

    return new Promise(function (resolve, reject) {

        let response = global.CCC_SERVICE_DETECTION_DEFAULT_RESPONSE;           // Initialise response object
        response.fqdn = fqdn;                                                   // Set the Fully Qualified Domain Name

        if (typeof (fqdn) === 'string' && fqdn.trim().length > 0) {             // Check if the fqdn is a non-empty string

            if (isValidDomain(fqdn, { subdomain: true, wildcard: false })) {    // Verify that the fqdn conforms to DNS specifications

                let question = dns.Question({                                   // Create DNS Question object
                    name: fqdn,
                    type: global.CCC_DNS_REQUEST_RECORD_TYPE,
                });

                let req = dns.Request({                                         // Create DNS Request object
                    question: question,
                    server: { address: getDNSResolver(), port: 53, type: 'udp' },
                    timeout: 5000
                });

                // DNS 'timeout' event
                req.on('timeout', () => {                                       // Handle DNS timeout event
                    debug('DNS timeout occurred resolving [%s]', fqdn);
                    response.message = 'DNS Timeout';                           // Record Timeout message
                    response.messages.push(response.message);                   // Add message to the messages array
                    response.reason = `DNS timeout after ${req.timeout} ms`;
                    response.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.ERROR;

                    reject(response);                                           // reject the promise
                });

                // DNS 'message' event
                req.on('message', (error, answer) => {                          // handle DNS message event
                    if (error) {                                                // DNS returned an error
                        debug('Received DNS error for %s: %O', fqdn, error);
                        response.message = `DNS Error flagged in message event: ${error}`;
                        response.messages.push(response.message);               // Add message to the messages array
                        response.reason = 'DNS Error';
                        response.status = global.CCC_SERVICE_DETECTION_STATUS_LABEL.ERROR;
                        debug('inspectDNS() rejecting Promise with response: %O', response);
                        reject(response);                                       // reject the promise

                    } else {                                                    // Process DNS Answer
                        debug('Received DNS answer to the lookup for [%s]: %O', fqdn, answer);

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

                                if (matchingDomains.length > 0) {               // We've found a match.  Record the details
                                    debug('%s is served by %s due to nested domain %s', fqdn, settings.apexDomains[service].title, matchingDomains[0]);

                                    // Populate response object properties
                                    response.reason = `${fqdn} resolves to ${matchingDomains[0]} which matches a ${service} domain pattern`;
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
                            console.log('Just checking if it is worth setting response.status to UNKNOWN here as it is currently: %s'. response.status);
                            response.message = [global.CCC_SERVICE_DETECTION_STATUS_LABEL.UNKNOWN]; // add the "Unknown" message
                            debug('%s\'s DNS recursion didn\'t match a known provider\'s domain (response.status: %s)', fqdn, response.status);
                        }

                        debug('inspectDNS(%s) returning: %O', fqdn, response);

                        resolve(response);                          // Return response object as we found a known service behind the fqdn
                    }
                });

                debug('Sending DNS Request: %O', req);
                req.send();                                         // Issue the DNS lookup request

            } else {
                response.message = `DNS Inspection failed. The "fqdn" [${fqdn}] did not pass DNS name validation.`
                response.messages.push(response.message);                       // Add message to the messages array
                debug('inspectDNS() rejecting Promise with response: %O', response);
                reject(response);                                               // reject the promise
            }


        } else {
            response.message = `DNS Inspection failed. The "fqdn" parameter [${fqdn}] is either empty or not a string.`
            response.messages.push(response.message);                           // Add message to the messages array
            debug('inspectDNS() rejecting Promise with response: %O', response);
            reject(response);                                                   // reject the promise
        }
    });
 };

module.exports = { getDNSResolver, getUniqueDomains, determineCDN, inspectDNS };