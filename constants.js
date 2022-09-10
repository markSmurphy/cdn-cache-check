function init() {
    global.CCC_SERVICE_DETECTION_LABELS = {
        'CDN': 'CDN',
        'ERROR': 'Error',
        'AWS': 'AWS',
        'AZURE': 'Azure',
        'OTHER': 'Other Internet Service',
        'UNKNOWN': 'Unknown'
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

    global.CCC_SERVICE_DETECTION_DEFAULT_RESPONSE = {
        message: '',
        messages: [],
        reason: [],
        service: '',
        regionId: 0,
        region: null,
        status: '',
        ipAddress: ''
    };

    global.CCC_DEFAULT_USERAGENT = 'ccc/1.0';
}

module.exports = { init };