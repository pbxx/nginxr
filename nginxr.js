const path = require('path')
const cp = require('child_process')
const process = require('process')
const fs = require('fs')
const { KindLogs } = require('kindlogs')
const confMaker = require('./config-maker.js')
const fse = require('fs-extra')


const sleep = milliseconds => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)

var console = new KindLogs('nginxr > main')

var globals = {
    nginxPath: './bin/nginx-1.21.1',
    nginxFile: path.resolve('bin/nginx-1.21.1', 'nginx.exe'),
    nginxVer: '1.21.1',
    tenantCount: 0,
    tenants: [],
    isQuit: false,
    defaultConfig: {
        worker_processes: '1',
        events: {
            worker_connections: '1024'
        },
    },
    defaultHttpDirective: {
        include: 'mime.types',
        default_type: 'application/octet-stream',
        sendfile: 'on',
        keepalive_timeout: '65',
        gzip: 'on',
        
    },
    defaultServerBlock: {
        listen: 80,
        server_name: 'localhost',
        error_page: '500 502 503 504  /50x.html',
    },
    defaultLocationsBlock: [
        {
            path: '/',
            root: 'html',
            index: 'index.html index.htm'
        }, 
        {
            path: '/50x.html',
            root: 'html'
        },
    ],
}

module.exports = {
    Nginxr: class {
        constructor (options) {
            var thisClass = this
            var configRendered = confMaker.makeConfig(mergeDefaultConfig(options))
            //delete(configRendered.)
            var console = new KindLogs('nginxr > makeConfig resolved')
            //console.log(configRendered);
            if (options.appPrefix && typeof(options.appPrefix) == 'string') {
                thisClass.appPrefix = options.appPrefix
            } else {
                thisClass.appPrefix = ''
            }
            

            //const randomColor = Math.floor(Math.random()*16777215).toString(16);
            var newTenantPath = ''
            if (globals.tenantCount > 0) {
                if (thisClass.appPrefix) {
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-${thisClass.appPrefix}-tenant${globals.tenantCount}/`);
                } else {
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-tenant${globals.tenantCount}/`);
                }
                globals.tenantCount++
                
                if (!fs.existsSync(newTenantPath)) {
                    copySync(globals.nginxPath, newTenantPath);
                }
                
            } else {
                if (thisClass.appPrefix) {
                    globals.tenantCount++
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}-${thisClass.appPrefix}/`);
                    if (!fs.existsSync(newTenantPath)) {
                        copySync(globals.nginxPath, newTenantPath);
                    }
                } else {
                    globals.tenantCount++
                    newTenantPath = path.resolve(`bin/nginx-${globals.nginxVer}/`);
                }
            }

            fs.writeFileSync(path.resolve(newTenantPath, 'conf/nginx.conf'), configRendered)
            console.log(newTenantPath)
            this.spawn(newTenantPath)
            
        }
        newConfig(options) {
            var thisClass = this
            var configRendered = confMaker.makeConfig(mergeDefaultConfig(options))
            fs.writeFileSync(path.resolve(this.cwd, 'conf/nginx.conf'), configRendered)
            const stdout = cp.execFileSync('nginx.exe', ['-s', 'reload'], { cwd: this.cwd })
            console.log(stdout.toString());
            sleep(2000)
            //setTimeout(()=> {
                this.restart()
            //}, 1450)
            

        }
        restart() {
            //stop this tenant
            //does not work currently
            
            var cwd = this.cwd
            var console = new KindLogs('nginxr > restart')
            var thisClass = this
            console.log(this.cwd)
            this.quit(true)
            sleep(2000)
            //setTimeout(()=> {
                this.spawn(cwd)
                console.log(`restart complete`)
            //}, 2450)

        }
        quit(splice) {
            //stop this tenant
            var console = new KindLogs('nginxr > quit')
            var thisClass = this
            console.log(this.cwd)
            cp.execFileSync('nginx.exe', ['-s', 'quit'], { cwd: this.cwd, detached: true, })
            if (splice) globals.tenants.splice(thisClass.tenantIndex-1, 1)
            //sleep(2150)
            return true
            
        }
        spawn(newTenantPath, keepOldPid) {
            var thisClass = this
            this.cwd = newTenantPath
            //setTimeout(()=> {
            this.nginx = cp.spawn('nginx.exe', [], {
                cwd: newTenantPath,
                stdio: 'ignore',
                detached: true,
            });

            if (!keepOldPid) {
                this.pid = this.nginx.pid
                fs.writeFileSync(path.resolve(this.cwd, 'logs/nginx.pid'), `${this.pid}`)
            }
            
            this.tenantIndex = globals.tenants.push(this)
            console.log(`Started NGINX master process at pid ${this.pid}.`);
            sleep(450)
            //}, 450)

            
        }
    }
    
}

function mergeDefaultConfig(config) {
    config = {
        ...globals.defaultConfig,
        ...config,
    }
    delete config.appPrefix

    if (config.http && Array.isArray(config.http)) {
        //http directives were passed with config, merge defaults on each
        for (var i = 0; i < config.http.length; i++) {
            config.http[i] = {
                ...globals.defaultHttpDirective,
                ...config.http[i],
            }
            configServers(i)
        }
    } else if (config.http && typeof(config.http) == 'object') {
        //a single http directive was passed by an object, merge defaults on it
        config.http = [{
            ...globals.defaultHttpDirective,
            ...config.http,
        }]
        configServers(0)
        
    } else {
        //no http directive passed, use default everything
        config.http = [globals.defaultHttpDirective]
        config.http[0].servers = [globals.defaultServerBlock]
        config.http[0].servers[0].locations = globals.defaultLocationsBlock

    }
    return config

    function configServers(i) {
        if (config.http[i].servers && Array.isArray(config.http[i].servers)) {
            //a servers array was passed with this http directive, merge defaults on each
            for (var b = 0; b < config.http[i].servers.length; b++) {
                config.http[i].servers[b] = {
                    ...globals.defaultServerBlock,
                    ...config.http[i].servers[b],
                }
                configLocations(i, b)
            }
        } else if (config.http[i].servers && typeof(config.http[i].servers) == 'object') {
            //a server object was passed with this http directive, merge defaults on it
            config.http[i].servers = [{
                ...globals.defaultServerBlock,
                ...config.http[i].servers,
            }]
            configLocations(i, 0)
        } else {
            //no servers array passed, use default servers array on this http directive
            config.http[i].servers = [globals.defaultServerBlock]
            config.http[i].servers[0].locations = globals.defaultLocationsBlock
        }
    }

    function configLocations(i, b) {
        
        if (config.http[i].servers[b].locations && Array.isArray(config.http[i].servers[b].locations)) {
            //locations array was passed, do nothing 
        } else if (config.http[i].servers[b].locations && typeof(config.http[i].servers[b].locations) == 'object') {
            //locations object was passed, make it into an array with only it
            config.http[i].servers[b].locations = [config.http[i].servers[b].locations]
        } else {
            //no locations array passed, use default
            config.http[i].servers[b].locations = globals.defaultLocationsBlock
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
        

        console.log(`Exiting NGINX child process(es)... Timeout 3s...`)
        //for (var tenant of globals.tenants) {
        for (var i = 0; i < globals.tenants.length; i++) {
            try {
                console.log(`quitting tenant ${globals.tenants[i].pid}`)
                globals.tenants[i].quit()
                
            } catch (err) {
                console.log(err)
            }
            
        }
        //sleep(2150)
        if (exitCode == 0) {
            console.log(`Process exit code 0.`)
        } else {
            console.log(`Exit code was non-zero, code ${exitCode}.`)
        }

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

