'use strict';

// Declare global variables
const fs = require('fs');

module.exports = {
    // function to parse URLs from .har
    getURLs(harFile){

        // call readHar() which reads the supplied file path from disk and validates it is a HAR file
        let harData = readHar(harFile);

        if (harData) { // Parse HAR JSON
            let URLs = new Array(0); // Initialise array for list of URLs
            harData.log.entries.forEach(element => { // Loop through each entry in the HAR
                URLs.push(element.request.url); // Add the URL to the list
            });
            return(URLs); // Return the list of URLs
        } else {
            return([]); // readHAR() didn't return a HTTP Archive so return a blank URL list
        }
    }
}

// function to read .har from disk
function readHar(harFile) {
    try {
        // Read raw file
        let rawData = fs.readFileSync(harFile);

        // Parse raw data into JSON
        let harData = JSON.parse(rawData);

        // Check that the JSON has basic HAR property
        if ((Object.prototype.hasOwnProperty.call(harData.log,'version')) && (Object.prototype.hasOwnProperty.call(harData.log,'entries'))) {
            console.log('HAR file is version %s and has %s entries', harData.log.version, harData.log.entries.length);
            return(harData);
        } else {
            console.log('Not a HAR file');
            return(null);
        }
    } catch (error) {
        console.error('readHar() caught an error: %O', error);
        return(null);
    }
}
