const debug = require('debug')('cdn-cache-check-service-detection');
debug('Entry: [%s]', __filename);

// Import service provider modules
const dnsInspection = require('./service.providers/dns-inspection');
//const AwsScan = require('./service.providers/aws');
//const AzureScan = require('./service.providers/azure');


let serviceDetection = (domains) => {                       // Function to attempt to identify the services behind an array of FQDNs

   return new Promise(function (resolve, reject) {

      if ((Array.isArray(domains) && domains.length)) {     // The `domains` array is populated
         domains.forEach((domain) => {                      // Iterate through each domain
            dnsInspection.inspectDNS(domain);               // Invoke DNS Inspection on current domain
         });

         resolve(true);                                     // Return response

      } else {
         reject(new Error('serviceDetection() :: domains[] array either does not exist, is not an array, or is empty.'));
      }
   });
};

module.exports = { serviceDetection };