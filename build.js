const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');
const {KindLogs} = require('kindlogs');
const mv = require('mv');


var options = {
    windowsDL: "http://nginx.org/download/nginx-1.21.1.zip",
    linuxDL: "http://nginx.org/download/nginx-1.21.1.tar.gz",
    binDir: "bin",
    nginxDir: "bin/nginx",
}

var platform = process.platform

var log = new KindLogs('nginxr build > main')

try {
    if (process.platform = "win32") {
        // do windows 
        const unzipper = require('unzipper');
        var binDir = "bin"
        var nginxDir = binDir + "/nginx"

        if (!fs.existsSync(options.binDir)){
            fs.mkdirSync(options.binDir);
        }

        //directory should exist, download file
        var file = fs.createWriteStream(options.binDir + "/nginx.zip");
        const request = http.get(options.windowsDL, function(response) {
            response.pipe(file);
            
        })

        request.on('close', function () {
            //file done, unzip it
            var unzip = fs.createReadStream(options.binDir + '/nginx.zip')
            .pipe(unzipper.Extract({ path: options.binDir }))

            //fs.unlinkSync(path)
            unzip.on('finish', () => {
                //done unzipping, delete zip and rename nginx folder
                fs.unlinkSync(options.binDir + '/nginx.zip')

            });
        });
    } else if (process.platform = "linux") {
        // do linux 

    }
} catch (err) {
    log.log(err)
}