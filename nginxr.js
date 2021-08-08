const path = require('path');
const { execFile, execFileSync } = require('child_process');
const process = require('process');
const fs = require('fs');
const { KindLogs } = require('kindlogs');
const execa = require('execa');
const confMaker = require('./config-maker.js');
const fse = require('fs-extra');
const { resolve } = require('path');

var console = new KindLogs('nginxr > main')

var globals = {
    nginxPath: './bin/nginx-1.21.1',
    nginxFile: path.resolve('bin/nginx-1.21.1', 'nginx.exe'),
    nginxVer: '1.21.1',
    tenantCount: 0,
    appPrefix: '',
    tenants: [],
}

module.exports = {
    Nginxr: class {
        constructor (options) {
            var thisClass = this
            var configRendered = confMaker.makeConfig(options)
            var console = new KindLogs('nginxr > makeConfig resolved')
            console.log(configRendered);

            fs.writeFileSync(globals.nginxPath + '/conf/nginx.conf', configRendered)

            //const randomColor = Math.floor(Math.random()*16777215).toString(16);
            var newTenantPath = ''
            if (globals.tenantCount > 0) {
                if (globals.appPrefix) {
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-${globals.appPrefix}-tenant${globals.tenantCount}`);
                } else {
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-tenant${globals.tenantCount}`);
                }
                globals.tenantCount++
                
                copySync(globals.nginxPath, newTenantPath);
            } else {
                if (globals.appPrefix) {
                    globals.tenantCount++
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-${globals.appPrefix}`);
                    copySync(globals.nginxPath, newTenantPath);
                } else {
                    globals.tenantCount++
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}`);
                }
            }

            const child = execFile('nginx.exe', [], {
                cwd: path.resolve(newTenantPath)
            }, (out, err, err2) => {
                var console = new KindLogs('nginxr > execFile done')
                if (error) {
                    throw error;
                }
                
                console.log(stdout);
            });

            thisClass.masterPid = child.pid
            thisClass.cwd = path.resolve(newTenantPath)
            globals.tenants.push(thisClass)
            console.log(`Started NGINX master process at pid ${thisClass.masterPid}.`);
            
        }
        updateConfig() {

        }
        restart() {

        }
        quit() {
            //stop this tenant
            var console = new KindLogs('nginxr > quit')
            console.log(this.cwd)
            const stdout = execFileSync('nginx.exe', ['-s', 'quit'], { cwd: this.cwd })
            console.log(stdout.toString());
        }
    }
    
}

function copySync(srcDir, destDir) {
    fse.copySync(srcDir, destDir, { overwrite: true },  function (err) {
        if (err) { 
            console.error(err)
        } else {
            console.log("success!");
        }
    });
}

function exitHandler(options, exitCode) {
    var console = new KindLogs('nginxr > exitHandler')
    
    if (options.cleanup) {
        

        if (exitCode == 0) {
            console.log(`Process exit code 0.`)
        } else {
            console.log(`Exit code was non-zero, code ${exitCode}.`)
        }
        /**/
        console.log(`Exiting NGINX child process(es)... Timeout 3s...`)
        
        return closeInstances()
        

    } else if (options.exit) {
        //exit the process
        process.exit()
    }
}

try {
    //do something when app is closing
    process.on('exit', exitHandler.bind(null,{cleanup:true}));

    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
    process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
} catch (err) {
    console.log(err)
    process.exit()
    
}

function closeInstances() {
    for (var tenant of globals.tenants) {
        tenant.quit()
    }
}

function closeInstancesOld() {
    var exitApps = []
    if (process.platform == 'win32') {
        //kill all processes this library has spawned
        
        if (globals.tenantCount > 1) {
            //multiple processes to close
            console.log(`multiple tenants`)
            
            for (var i = 0; i < globals.tenantCount; i++) {
                
                var newTenantPath = '';

                if (i == 0) {
                    //this is first process
                    if (globals.appPrefix) {
                        newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-${globals.appPrefix}`);
                    } else {
                        newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}`);
                    }
                } else {
                    //this is not the first process
                    if (globals.appPrefix) {
                        newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-${globals.appPrefix}-tenant${i}`);
                    } else {
                        newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-tenant${i}`);
                    }
                }
                
                console.log(`loop running ${path.resolve(newTenantPath, 'nginx.exe')}`)
                const stdout = execFileSync('nginx.exe', ['-s', 'quit'], { cwd: path.resolve(newTenantPath) });
                console.log(stdout.toString());
            }
            
        } else {
            //only one master tenant
            console.log(`single tenant`)
            var newTenantPath = '';

            if (globals.appPrefix) {
                newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-${globals.appPrefix}`);
            } else {
                newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}`);
            }
            
            const stdout = execFileSync('nginx.exe', ['-s', 'quit'], { cwd: path.resolve(newTenantPath) })
            console.log(stdout.toString());
        }
    }
}