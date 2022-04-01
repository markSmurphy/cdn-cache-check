const debug = require('debug')('cdn-cache-check-service-provider-aws');
debug('Entry: [%s]', __filename);

// Library for working with CIDR
const IPCIDR = require('ip-cidr');

// Load the root service.providers configuration file
const serviceProviders = require('./services.json');

// Load the AWS IP Address and services data
const services = require(serviceProviders.AWS.dataFile);

module.exports = {
    lookupIpAddress(ipAddress, options = {verbose: false}) {
        debug('lookupIpAddress(%s)::entry', ipAddress, options);

        // Initialise response object
        let response = global.CCC_SERVICE_DETERMINATION_DEFAULT_RESPONSE;
        response.ipAddress = ipAddress;
        response.status = global.CCC_SERVICE_DETERMINATION_LABELS.INDETERMINATE;

        // Loop through each service
        debug('Checking if the IP address [%s] matches one of %s known Azure services', ipAddress, services.values.length);
        for (let i = 0; i < services.values.length; i++) {
            // Checking against each service
            debug('Checking against %s CIDR blocks for service ID: %s',services.values[i].properties.addressPrefixes.length, services.values[i].id);
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

        // Concatenate messages into one response string
        response.message = response.messages.join(' || ');

        return(response);
    }
};

function previousAWS(){
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
            cdnResponse.status = global.CCC_SERVICE_DETERMINATION_LABELS.AWS;
            cdnResponse.reason = `${cdnResponse.ipAddress} is in the CIDR block ${awsServices.prefixes[i].ip_prefix} which is used by AWS ${awsServices.prefixes[i].service}`;

            if (String.prototype.toUpperCase.call(awsServicesMessage[awsServicesMessage.length - 1]) === 'CLOUDFRONT') { // Check if the service is CloudFront
                cdnResponse.service = 'CDN';
                cdnResponse.status = global.CCC_SERVICE_DETERMINATION_LABELS.CDN;
            }
        }
    }

    if (awsServicesMessage.length > 0) {
        // Save the generated message into the response object
        cdnResponse.message.push('[' + awsServicesMessage.join(' -> ') + ']');
    }
}