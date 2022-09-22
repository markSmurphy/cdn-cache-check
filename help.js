const debug = require('debug')('cdn-cache-check-help');
debug('Entry: [%s]', __filename);

module.exports = {
    helpScreen: function (verbose) {
        // Platform independent end-of-line character
        const endOfLine = require('os').EOL;
        // console colours
        const chalk = require('chalk');
        // parse package.json for the version number
        const packageJSON = require('./package.json');

        // Display help screen
        console.log(chalk.blueBright(packageJSON?.name));
        console.log(chalk.green('Read the docs: %s'), packageJSON?.homepage || '*not configured*');
        console.log(chalk.magenta('Support & bugs: %s'), packageJSON?.bugs?.url || '*not configured*');
        console.log(endOfLine);
        console.log(chalk.grey('DESCRIPTION:'));
        console.log(chalk.italic('   %s'), packageJSON?.description || '*not configured*');
        console.log(endOfLine);
        console.log(chalk.grey('VERSION:'));
        console.log(`   ${packageJSON?.version}` || '*not configured*');
        console.log(endOfLine);
        console.log(chalk.grey('USAGE:'));
        console.log('   ' + 'node ccc.js [<url> | <filename> [<url> | <filename>] […] ] [options]');
        console.log(endOfLine);
        console.log(chalk.grey('OPTIONS:'));
        console.log(`   <url>                         ${chalk.grey('A URL to query')}`);
        console.log(`   <filename>                    ${chalk.grey('Specify a file containing a list of URLs to query')}`);
        console.log(`   --method <head|get|options>   ${chalk.grey('Specify the HTTP method.  Default: GET')}`);
        console.log(`   --headers <collection>        ${chalk.grey('Select which collection of headers to output.')}`);
        console.log(`   --list-header-collections     ${chalk.grey('List all Header Collections and the response headers they contain')}`);
        console.log(`   --list-response-headers       ${chalk.grey('List all unique response headers. Useful when creating a new header collection.')}`);
        console.log(`   --export <true|false>         ${chalk.grey('Exports output to a .csv file.  Default: true')}`);
        console.log(`   --open                        ${chalk.grey('Opens the exported .csv file automatically.')}`);
        console.log(`   --follow <integer>            ${chalk.grey('The number of HTTP redirects to follow. Default: 5')}`);
        console.log(`   --scanip <true|false>         ${chalk.grey('Scan cloud providers\' CIDR blocks for IP address to identify service. Default: true')}`);
        //console.log('   ' + '--iterations <integer>        ' + chalk.grey('The number of times to request each URL. Default: 1'));
        //console.log('   ' + '--interval <integer>          ' + chalk.grey('The number of milliseconds in-between multiple http requests. Default: 3000'));
        console.log(`   --verbose                     ${chalk.grey('Enables verbose output')}`);
        console.log(`   --debug                       ${chalk.grey('Enables debugging output')}`);
        console.log(`   --no-color                    ${chalk.grey('Switches off colour output')}`);
        console.log(`   --version                     ${chalk.grey('Display version number')}`);
        console.log(`   --help                        ${chalk.grey('Display this help')}`);
        console.log(endOfLine);
        console.log(chalk.grey('EXAMPLES:'));
        console.log(chalk.grey('   Check a single URL'));
        console.log('   ccc https://www.rolex.com/');
        console.log(chalk.grey('   Check two URLs'));
        console.log('   ccc https://www.rolls-royce.com/ https://www.rolls-roycemotorcars.com/');
        console.log(chalk.grey('   Check all URLs listed in `URLS.txt`'));
        console.log('   ccc URLs.txt');
        console.log(chalk.grey('   Check one URL with a HEAD request & output all `security` headers'));
        console.log('   ccc https://www.mozilla.org/ --headers security --method head');
        console.log(chalk.grey('   List all configured header collections and the headers they\'ll each output'));
        console.log('   ccc --list-header-collections');
        console.log(chalk.grey('   Check all URLs in `login.urls.txt` without following redirects and output all headers'));
        console.log('   ccc login.urls.txt --headers all --follow 0');
        // Display more information if `verbose` is enabled
        if (verbose) {
            const os = require('os');
            const utils = require('./utils');
            console.log(endOfLine);
            console.log(chalk.grey('SYSTEM:'));
            console.log(`   App Path           ${chalk.blueBright(utils.getAppPath())}`);
            console.log(`   Hostname           ${chalk.blueBright(os.hostname())}`);
            console.log(`   Uptime             ${chalk.blueBright(utils.secondsToHms(os.uptime()))}`);
            console.log(`   Platform           ${chalk.blueBright(os.platform())}`);
            console.log(`   O/S                ${chalk.blueBright(os.type())}`);
            console.log(`   O/S release        ${chalk.blueBright(os.release())}`);
            console.log(`   CPU architecture   ${chalk.blueBright(os.arch())}`);
            console.log(`   CPU cores          ${chalk.blueBright(os.cpus().length)}`);
            console.log(`   CPU model          ${chalk.blueBright(os.cpus()[0].model)}`);
            console.log(`   Free memory        ${chalk.blueBright(utils.formatBytes(os.freemem()))}`);
            console.log(`   Total memory       ${chalk.blueBright(utils.formatBytes(os.totalmem()))}`);
            console.log(`   Home directory     ${chalk.blueBright(os.homedir())}`);
            console.log(`   Temp directory     ${chalk.blueBright(os.tmpdir())}`);
            console.log(`   Console width      ${chalk.blueBright(process.stdout.columns)}`);
            console.log(`   Console height     ${chalk.blueBright(process.stdout.rows)}`);
            console.log(`   Colour support     ${chalk.blueBright(utils.getColourLevelDesc())}`);
        }
    }
};
