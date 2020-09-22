const debug = require('debug')('cdn-cache-check-help');
debug('Entry: [%s]', __filename);

module.exports = {
    helpScreen: function (verbose) {
        // Platform independent end-of-line character
        const endOfLine = require('os').EOL;
        // console colours
        const chalk = require('chalk');
        // parse package.json for the version number
        const package = require('./package.json');

        // Display help screen
        console.log(chalk.blue(package.name));
        console.log(chalk.green('Read the docs: ') + package.homepage);
        console.log(chalk.magenta('Support & bugs: ') + package.bugs.url);
        console.log(endOfLine);
        console.log(chalk.grey('DESCRIPTION:'));
        console.log(chalk.italic('   %s'), package.description);
        console.log(endOfLine);
        console.log(chalk.grey('VERSION:'));
        console.log('   ' + package.version);
        console.log(endOfLine);
        console.log(chalk.grey('USAGE:'));
        console.log('   ' + 'node ccc.js [<url> | <filename> [<url> | <filename>] … ] [options]');
        console.log(endOfLine);
        console.log(chalk.grey('OPTIONS:'));
        console.log('   ' + '<url>                         ' + chalk.grey('A URL to query'));
        console.log('   ' + '<filename>                    ' + chalk.grey('Specify a file containing a list of URLs to query'));
        console.log('   ' + '--method <head|get|options>   ' + chalk.grey('Specify the HTTP method.  Default: HEAD'));
        console.log('   ' + '--headers <collection>        ' + chalk.grey('Select which collection of headers to output.'));
        console.log('   ' + '--list-header-collections     ' + chalk.grey('List all Header Collections and the response headers they contain'));
        console.log('   ' + '--list-response-headers       ' + chalk.grey('List all unique response headers. Useful when creating a header collection.'));
        console.log('   ' + '--iterations <integer>        ' + chalk.grey('The number of times to request each URL. Default: 1'));
        console.log('   ' + '--interval <integer>          ' + chalk.grey('The number of milliseconds in-between multiple http requests. Default: 3000'));
        console.log('   ' + '--no-color                    ' + chalk.grey('Switches off colour output'));
        console.log('   ' + '--version                     ' + chalk.grey('Display version number'));
        console.log('   ' + '--help                        ' + chalk.grey('Display this help'));
        console.log(endOfLine);
        console.log(chalk.grey('EXAMPLES:'));
        console.log('   ccc https://example.com');
        console.log('   ccc https://example.com https://www.example.com');
        console.log('   ccc URLs.txt');
        console.log('   ccc https://cdn.example.com/resources/client.js --method get --headers fastly --iterations 5 --interval 10000');
        // Display more information if `verbose` is enabled
        if (verbose) {
            const os = require('os');
            const utils = require('./utils');
            console.log(endOfLine);
            console.log(chalk.grey('SYSTEM:'));
            console.log('   Hostname           ' + chalk.blue(os.hostname()));
            console.log('   Uptime             ' + chalk.blue(utils.secondsToHms(os.uptime())));
            console.log('   Platform           ' + chalk.blue(os.platform()));
            console.log('   O/S                ' + chalk.blue(os.type()));
            console.log('   O/S release        ' + chalk.blue(os.release()));
            console.log('   CPU architecture   ' + chalk.blue(os.arch()));
            console.log('   CPU cores          ' + chalk.blue(os.cpus().length));
            console.log('   CPU model          ' + chalk.blue(os.cpus()[0].model));
            console.log('   Free memory        ' + chalk.blue(utils.formatBytes(os.freemem())));
            console.log('   Total memory       ' + chalk.blue(utils.formatBytes(os.totalmem())));
            console.log('   Home directory     ' + chalk.blue(os.homedir()));
            console.log('   Temp directory     ' + chalk.blue(os.tmpdir()));
            console.log('   Console width      ' + chalk.blue(process.stdout.columns));
            console.log('   Console height     ' + chalk.blue(process.stdout.rows));
            console.log('   Colour support     ' + chalk.blue(utils.getColourLevelDesc()));
        }
    }
};
