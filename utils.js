const debug = require('debug')('codename-generator');
debug('Entry: [%s]', __filename);

module.exports = {
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        try {
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        } catch (error) {
            debug('formatBytes() caught an exception: %O', error);
            return('%d Bytes', bytes);
        }

    },

    secondsToHms(seconds) {
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
                return('%d seconds', seconds);
            }
        } else {
            return('<invalid>');
        }
    },

    getColourLevelDesc() {
        const colourLevel = ['Colours Disabled', '16 Colours (Basic)', '256 Colours', '16 Million Colours (True Colour)'];

        // Use chalk to detect colour level support
        const chalk = require('chalk');
        var level = chalk.supportsColor.level;

        if (level === null) {
            level = 0;
        }

        return (colourLevel[level]);
    }
};
