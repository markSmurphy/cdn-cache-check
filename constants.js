function init() {
    global.CCC_CDN_DETERMINATION_ENUM_STATUS = {
        'INDETERMINATE': 'Indeterminate',
        'CDN': 'CDN',
        'ERROR': 'Error',
        'AWS': 'AWS',
        'AZURE': 'Azure',
        'OTHER': 'Other Internet Service'
    };

    global.CCC_DNS = {
        'REQUEST_RECORD_TYPE': 'A',
        'DEFAULT_RESOLVER': '8.8.8.8'
    };

    global.CCC_REQUEST = {
        'WARNING_THRESHOLD': 5
    };

    global.CCC_OUTPUT = {
        'REDIRECT_INDICATOR': '\u00AE',
        'PADDING_CHARACTER': '.'
    };
}

module.exports = {init};