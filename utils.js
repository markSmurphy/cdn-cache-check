const debug = require('debug')('cdn-cache-check-utils');
debug('Entry: [%s]', __filename);


function formatBytes(bytes, decimals = 2) {
    try {
        if (bytes === 0) {
            return ('0 Bytes');
        } else {
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
    } catch (error) {
        debug('formatBytes() caught an exception: %O', error);
        return(bytes + ' Bytes');
    }
}

function secondsToHms(seconds) {
    if (seconds) {
        try {
            seconds = Number(seconds);

            var h = Math.floor(seconds / 3600);
            var m = Math.floor(seconds % 3600 / 60);
            var s = Math.floor(seconds % 3600 % 60);

            return ('0' + h).slice(-2) + ' hours, ' + ('0' + m).slice(-2) + ' minutes, ' + ('0' + s).slice(-2) + ' seconds';
        } catch (error) {
            debug('secondsToHms() caught an exception: %O', error);
            // an unexpected error occurred; return the original value
            return(seconds + ' seconds');
        }
    } else {
        return('<invalid>');
    }
}

function millisecondsToHms(milliseconds) {
    if (milliseconds) {
        try {
            let seconds = Number(milliseconds/1000);

            let h = Math.floor(seconds / 3600);
            let m = Math.floor(seconds % 3600 / 60);
            let s = Math.floor(seconds % 3600 % 60);

            let returnString = '';

            if (h > 0) {
                returnString = ('0' + h).slice(-2) + ' hours, ';
            }

            if (m > 0) {
                returnString = returnString + ('0' + m).slice(-2) + ' minutes, ';
            }

            if (s > 0) {
                if (s ===1) {
                    returnString = returnString + ('0' + s).slice(-2) + ' second';
                } else {
                    returnString = returnString + ('0' + s).slice(-2) + ' seconds';
                }
            }

            return returnString;
        } catch (error) {
            debug('millisecondsToHms() caught an exception: %O', error);
            // an unexpected error occurred; return the original value
            return(milliseconds + ' milliseconds');
        }
    } else {
        return('<invalid>');
    }
}

function getColourLevelDesc() {
    const colourLevel = ['Colours Disabled', '16 Colours (Basic)', '256 Colours', '16 Million Colours (True Colour)'];

    // Use chalk to detect colour level support
    const chalk = require('chalk');
    var level = chalk.supportsColor.level;

    if (level === null) {
        level = 0;
    }

    return (colourLevel[level]);
}

function getHeadersCollections(settings) {
    debug('getHeadersCollections()');
    try {
        let collections = [];
        for (let i = 0; i < settings.headersCollections.length; i++) {
            collections.push(Object.keys(settings.headersCollections[i]).toString());
        }

        return collections;

    } catch (error) {
        debug('Error caught in getHeadersCollections(): %O', error);
        return [];
    }
}

function IsTLD(testString) {
    debug('IsTLD(%s)', testString);
    try {
        // Load array of valid top-level-domains
        let tlds = require('tlds');

        // Query array for supplied string
        if (tlds.indexOf(testString) > -1) {
            // `testString` exists
            return(true);
        } else {
            // `testString` does not exist
            return(false);
        }
    } catch (error) {
        debug('IsTLD() caught an error: %O', error);
        return(false);
    }
}

function generateUniqueFilename(extension) {
    debug('generateUniqueFilename(%s)', extension);
    const defaultExtension = '.csv';
    var prefix = 'ccc-';
    const os = require('os');
    const path = require('path');

    try {
        const uniqueFilename = require('unique-filename');
        const today = new Date();

        // Check if a file extension was provided
        if (extension) {
            // Prepend a dot '.' if there isn't one
            if ((extension.charAt(0) === '.') === false) {
                extension = '.' + extension
            }
        } else {
            extension  = defaultExtension;
        }

        // Incorporate today's date into the prefix
        prefix = prefix + (today.getFullYear()).toString() + (today.getMonth() + 1).toString() + (today.getDay() + 1).toString();

        // Generate full filename with path
        let filename = uniqueFilename(os.tmpdir(), prefix) + extension;
        debug('Generated the unique filename: %s', filename);
        // return the resulting filename
        return(filename);

    } catch (error) {
        debug('generateUniqueFilename() caught an error: %O', error);
        // We need to return something, so generate a random 8 char string and apply prefix and extension
        let filename = os.tmpdir() + path.sep +  prefix + Math.random().toString().substring(2,10) + defaultExtension;
        return(filename);
    }
}

function getAppPath() {
    let path = require('path');
    let AppPath = path.resolve(__dirname);
    return(AppPath);
}

module.exports = {getAppPath, generateUniqueFilename, IsTLD, getHeadersCollections, getColourLevelDesc, millisecondsToHms, secondsToHms, formatBytes};
