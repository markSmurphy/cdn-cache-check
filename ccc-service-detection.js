const debug = require('debug')('cdn-cache-check-service-detection');
debug('Entry: [%s]', __filename);

// Import service provider modules
const dns = require('./ccc-dns');
//const AwsScan = require('./service.providers/aws');
//const AzureScan = require('./service.providers/azure');

// Function to attempt to identify the services behind an array of FQDNs
function serviceDetection(uniqueDomains, settings) {
   debug('serviceDetection() Entry');
   return new Promise(function (resolve, reject) {

      // Ensure the uniqueDomains set has a populated domains[] array
      if ((Array.isArray(uniqueDomains.domains) && uniqueDomains.domains.length)) {
         debug(`Service Detection running across ${uniqueDomains.length} domain(s)`);

         // Initialise the response object
         let serviceDetectionResponse = global.CCC_SERVICE_DETECTION_DEFAULT_RESPONSE;

         // Iterate through each domain
         uniqueDomains.domains.forEach((domain) => {
            debug(`Service Detection is processing [${domain}]`);

            // Invoke DNS Inspection on current domain
            dns.inspectDNS(domain, settings).then((response) => {
               //console.log('Response from inspectDNS(): %O', response); **Need to parse this object for domain level service detection
            }
            );
         });

         // Resolve the Promise and return the response
         resolve(serviceDetectionResponse);

      } else {
         reject(new Error('serviceDetection() :: domains[] array either does not exist, is not an array, or is empty.'));
      }
   });
}

module.exports = { serviceDetection };