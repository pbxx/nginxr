const {Nginxr} = require('./nginxr.js')
const { KindLogs } = require('kindlogs');

var console = new KindLogs('nginxr test > main')

/*
include       mime.types;
default_type  application/octet-stream;
sendfile        on;
keepalive_timeout  65;
gzip  on;
*/
try {
    var nginx = new Nginxr({
        'worker_processes': '1',
        'events': {
            'worker_connections': '1024'
        },
        'http': [{
            options : {
                'include': 'mime.types',
                'default_type': 'application/octet-stream',
                'sendfile': 'on',
                'keepalive_timeout': '65',
                'gzip': 'on',
            },
            servers: [{
                options: {
                    listen: 80,
                    server_name: 'localhost',
                    error_page: '500 502 503 504  /50x.html'
                },
                locations: [{
                    path: '/',
                    options: {
                        root: 'html',
                        index: 'index.html index.htm'
                    }
                }, 
                {
                    path: '/50x.html',
                    options: {
                        root: 'html'
                    }
                }]
            }]
            

        }],
    })
} catch (err) {
    console.log(err)
}