const debug = require('debug')('cdn-cache-check-service-detection');
debug('Entry: [%s]', __filename);

// Import service provider modules
const dns = require('./ccc-dns');
//const AwsScan = require('./service.providers/aws');
//const AzureScan = require('./service.providers/azure');

let serviceDetection = (domains, settings) => {  // Function to attempt to identify the services behind an array of FQDNs

   return new Promise(function (resolve, reject) {

      // Initialise the response object
      let serviceDetectionResponse = global.CCC_SERVICE_DETECTION_DEFAULT_RESPONSE;    // Initialise response object

      if ((Array.isArray(domains) && domains.length)) {                                // Ensure the domains[] array is populated
         domains.forEach((domain) => {                                                 // Iterate through each domain
         dns.inspectDNS(domain, settings).then( (response) => {                        // Invoke DNS Inspection on current domain
               console.log('Response from inspectDNS(): %O', response);
            }
            );
         });

         resolve(serviceDetectionResponse);                                          // Resolve the Promise and return the response

      } else {
         reject(new Error('serviceDetection() :: domains[] array either does not exist, is not an array, or is empty.'));
      }
   });
};

module.exports = { serviceDetection };