const debug = require('debug')('cdn-cache-check-consoleUpdate');
debug('Entry: [%s]', __filename);

// Writes text to the start of the current console row
function writeLn(text = '') {
   try {
      // Convert input to text if required
      if (typeof (text) != 'string') {
         text = text.toString();
      }

      // Move cursor to start of row
      process.stdout.cursorTo(0);
      // Write text with added end-of-line
      process.stdout.write(`${text}\r`);
   } catch (error) {
      debug('An error occurred in write(): %O', error);
   }
}

/* Clears the current console line of text
   -1: to the left from cursor
    0: the entire line.
    1:  to the right from cursor
*/
function clearLn(option = 0) {
   try {
      process.stdout.clearLine(option);
   } catch (error) {
      debug('An error occurred in clearLine(): %O', error);
   }
}

// Moves the cursor position within the current row
function cursorTo(column = 0) {
   try {
      process.stdout.cursorTo(column);
   } catch (error) {
      debug('An error occurred in cursorTo(): %O', error);
   }
}

module.exports = { writeLn, clearLn, cursorTo };