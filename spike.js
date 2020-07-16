
const urls = ['https://assets.fuseuniversal.com/assets/ckeditor/config.js',
    'https://assets.fuseuniversal.com/assets/ckeditor/contents.css',
    'https://assets.fuseuniversal.com/assets/ckeditor/lang/en-gb.js',
    'https://assets.fuseuniversal.com/assets/ckeditor/plugins/siupload/plugin.js',
    'https://assets.fuseuniversal.com/assets/ckeditor/plugins/upload/plugin.js',
    'https://assets.fuseuniversal.com/assets/ckeditor/skins/moono/editor.css',
    'https://assets.fuseuniversal.com/assets/ckeditor/skins/moono/icons.png',
    'https://assets.fuseuniversal.com/assets/ckeditor/styles.js'
];
var responses = [];
var Completed_requests = 0;

// Native
const http = require('https');
for (let i in urls) {
    http.get(urls[i], (res) => {
        responses.push(res.headers);

        Completed_requests++;
        if (Completed_requests === urls.length) {
            // All download done, process responses array
            console.log(responses);
        }
    });
}


// Needle with callbacks
var needle = require('needle');

for (let i in urls) {
    needle.head(urls[i], function(error, response) {
        responses.push(response.headers);

        Completed_requests++;
        if (Completed_requests == urls.length) {
            // All download done, process responses array
            console.log(responses);
        }
    });
}


// Needle with Promise
/* needle.get('http://www.google.com', function(error, response) {
  if (!error && response.statusCode == 200)
    console.log(response.body);
}); */