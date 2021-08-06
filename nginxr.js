const path = require('path');
const { execFile } = require('child_process');
const process = require('process');
const { KindLogs } = require('kindlogs');
const confMaker = require('./config-maker.js');

var nginxFile = path.resolve('bin/nginx-1.21.1', 'nginx.exe')
var nginxPath = path.resolve('bin/nginx-1.21.1')


var console = new KindLogs('nginxr > main')

var globals = {

}


module.exports = {
    Nginxr: class {
        constructor (options) {
            let thisClass = this
            const child = execFile(nginxFile, [], {
                cwd: nginxPath
            }, (error, stdout, stderr) => {
                var console = new KindLogs('nginxr > execFile callback')
                if (error) {
                    throw error;
                }
                
                console.log(stdout);
            });

            thisClass.pid = child.pid

            var configRendered = confMaker.makeConfig(options)
            var console = new KindLogs('nginxr > makeConfig resolved')
            console.log(configRendered);
            console.log(`Started NGINX master process at pid ${thisClass.pid}.`);
            
            
        }
        updateConfig() {

        }
        restart() {

        }
    }
    
}


function exitHandler(options, exitCode) {
    var console = new KindLogs('nginxr > exitHandler')
    
    if (options.cleanup) {
        if (exitCode == 0) {
            console.log(`Process exit code 0.`)
        } else {
            console.log(`Exit code was non-zero, code ${exitCode}.`)
        }
    } else if (options.exit) {
        
        console.log(`Exiting NGINX child process(es)... Timeout 3s...`)
        execFile(nginxFile, ['-s', 'quit'], {
            cwd: nginxPath
        }, (error, stdout, stderr) => {
            if (error) {
                throw error
            }

            process.exit()

        })

        //set emergency timeout, for if a user calls for an exit and it doesnt happen...    
        setTimeout(() => {
            if (exitCode == 0) {
                console.log(`Process exit code 0.`)
            } else {
                console.log(`Exit code was non-zero, code ${exitCode}.`)
            }
            process.exit()
        }, 3000)
    }
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