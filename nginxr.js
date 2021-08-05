const path = require('path');
const { execFile } = require('child_process');
const process = require('process');
const { KindLogs } = require('kindlogs');

var nginxFile = path.resolve('bin/nginx-1.21.1', 'nginx.exe')
var nginxPath = path.resolve('bin/nginx-1.21.1')


var console = new KindLogs('nginxr > main')

const child = execFile(nginxFile, [], {
    cwd: nginxPath
}, (error, stdout, stderr) => {
    var console = new KindLogs('nginxr > execFile callback')
    if (error) {
        throw error;
    }
    console.log(stdout);
});

console.log(`Started NGINX master process at pid ${child.pid}.`);

function exitHandler(options, exitCode) {
    var console = new KindLogs('nginxr > exitHandler')
    if (exitCode == 0) {
        console.log(`Process exit code 0.`)
    } else {
        console.log(`Exit code was non-zero, code ${exitCode}.`)
    }

    execFile(nginxFile, ['-s', 'quit'], {
        cwd: nginxPath
    }, (error, stdout, stderr) => {
        if (error) {
            throw error
        }
        console.log(`Exiting NGINX child process(es)...`)
        if (options.exit) process.exit()
    })
    
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));