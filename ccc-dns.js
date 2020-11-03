const debug = require('debug')('cdn-cache-check-dns');
debug('Entry: [%s]', __filename);

// Parameter Constants
const CCC_DNS_REQUEST_RECORD_TYPE = 'ANY';

// Initialise wildcard string parser
const matcher = require('multimatch');

// Initialise Domain validation object
const isValidDomain = require('is-valid-domain');

// DNS resolver
const dnsSync = require('dns-sync');

// Console Colours
const chalk = require('chalk');

module.exports = {
    getUniqueDomains(urls) {
        try {
            // A set can only contain unique values
            let uniqueDomains = new Set();
            // loop through array, extracting hostname from each URL
            for (let i = 0; i < urls.length; i++) {
                let currentUrl = new URL(urls[i]);
                uniqueDomains.add(currentUrl.hostname);
            }

            return(uniqueDomains);

        } catch (error) {
            debug('Exception caught in getUniqueDomains(): %O', error);
            return(null);
        }
    },
    determineCDN(hostname, apexDomains, callback) {
        debug('determineCDN(%s)', hostname);
        // Set default response
        let returnValue = {
            'message': chalk.grey('Indeterminate'),
            'hostname': hostname
        };

        try {
            // Validate that the hostname conforms to a valid DNS domain
            if (isValidDomain(hostname, {subdomain: true, wildcard: false})) {
                // Lookup hostname
                let dnsResponse = dnsSync.resolve(hostname, CCC_DNS_REQUEST_RECORD_TYPE);
                debug('DNS lookup response for %s is: %O', hostname, dnsResponse);
                // Evaluate response
                if (Array.isArray(dnsResponse) === true) { // We're expecting an Array response
                    debug('isArray() check evaluated to %O with %s elements', Array.isArray(dnsResponse), dnsResponse.length);
                    for (let i = 0; i < dnsResponse.length; i++) { // Iterate through array
                        debug('Evaluating element %d: %O', i, dnsResponse[i]);
                        if (Object.prototype.hasOwnProperty.call(dnsResponse[i], 'type')) { // Check the element has a 'type' property
                            let recordType = (dnsResponse[i].type.toUpperCase());

                            switch(recordType) {

                                case 'CNAME':
                                    debug('The DNS record is a CNAME. Checking if it resolves to a known CDN ...');
                                    var cnameResolution = dnsResponse[i].value;
                                    // Check if the cname resolved to a FQDN that matches a known CDN's apex domain
                                    for (let cdn in apexDomains) {
                                        debug('evaluating %s against %s [%s]', cnameResolution, apexDomains[cdn], cdn);
                                        let matchingDomains = matcher(cnameResolution, apexDomains[cdn].domains);
                                        debug('matchingDomains: %O', matchingDomains);
                                        if (matchingDomains.length > 0) {
                                            debug('Setting return value to [' + cdn + '] for [' + hostname +']');
                                            if (apexDomains[cdn].service.toUpperCase() === 'CDN') {
                                                returnValue.message = chalk.greenBright(apexDomains[cdn].title);
                                            } else {
                                                returnValue.message = chalk.yellowBright(apexDomains[cdn].title);
                                            }

                                            returnValue.matchingDomains = matchingDomains[0];
                                            returnValue.service = apexDomains[cdn].service.toUpperCase();

                                            // We don't need ot loop through the rest of the DNS response
                                            i = dnsResponse.length; // Trigger the end of For loop condition
                                        }
                                    }
                                    break;

                                case 'A':
                                    debug('The DNS record is an A record. It\'s probably not a CDN, unless it\'s actually an ALIAS record over a CDN; but there\'s no way to know for sure ...');
                                    debug('Check if hostname matches a known service');
                                    for (let cdn in apexDomains) {
                                        debug('evaluating %s against %s [%s]', hostname, apexDomains[cdn], cdn);
                                        let matchingDomains = matcher(hostname, apexDomains[cdn].domains);
                                        debug('matchingDomains: %O', matchingDomains);
                                        if (matchingDomains.length > 0) {
                                            debug('Setting return value to [' + cdn + '] for [' + hostname +']');
                                            returnValue.message = chalk.yellowBright(apexDomains[cdn].title);
                                            returnValue.matchingDomains = matchingDomains[0];
                                            returnValue.service = apexDomains[cdn].service.toUpperCase();

                                            // We don't need ot loop through the rest of the DNS response
                                            i = dnsResponse.length; // Trigger the end of For loop condition
                                        }
                                    }
                                    break;

                                default:
                                    // Definitely not a CDN
                                    debug('The DNS record is neither a CNAME nor an A record. Setting return value to "not served via a CDN"');
                                    returnValue.message = chalk.red('Not served via a CDN');
                            }

                        } else { // No 'type' property in dns Response element
                            debug('The dnsResponse object did have a property "type": %O', dnsResponse[i]);
                        }
                    }

                } else { // DNS response wasn't the expected Array
                    debug('dnsSync.resolve() did not return an array. Instead we got: %O', dnsResponse);
                    returnValue.message = chalk.redBright('DNS Error');
                }

            } else { // hostname didn't pass the validate-domain check
                returnValue.message = chalk.redBright('Invalid DNS domain');
            }

        } catch (error) {
            debug('Exception caught in determineCDN(): %O', error);

        } finally {
            debug('Returning: %O', returnValue);
            callback(returnValue);
        }
    }
}