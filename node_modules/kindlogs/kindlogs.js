var chalk = require('chalk')

var globalDefaults = {
    loggers: {
        log: {
            color: "#52c0f7",
            text: "info: ",
            use: "log",
            format: {
                startChar: "[ ",
                endChar: " ]",
                lineNumSeparator: " @",
                lineNumDelim: ":",
                extraLine: false,
                callerLine: true,
                callerCol: true,
                fname: 'KindLogger'
            },
        },
        warn: {
            color: "#f7c052",
            text: "warn: ",
            use: "log",
            format: {
                startChar: "[ ",
                endChar: " ]",
                lineNumSeparator: " @",
                lineNumDelim: ":",
                extraLine: false,
                callerLine: true,
                callerCol: true,
                fname: 'KindLogger'
            },
        },
        err: {
            color: "#eb3474",
            text: "error: ",
            use: "error",
            format: {
                startChar: "[ ",
                endChar: " ]",
                lineNumSeparator: " @",
                lineNumDelim: ":",
                extraLine: false,
                callerLine: true,
                callerCol: true,
                fname: 'KindLogger'
            },
        },
    },
    themes: {
        default: {
            startChar: "[ ",
            endChar: " ]",
            lineNumSeparator: " @",
            lineNumDelim: ":",
            extraLine: false,
            callerLine: true,
            callerCol: true
        },
        curly: {
            startChar: "~[ ",
            endChar: " ]~",
            lineNumSeparator: " @",
            lineNumDelim: ":",
            extraLine: false,
            callerLine: true,
            callerCol: true
        },
        minimal: {
            startChar: "",
            endChar: "",
            lineNumSeparator: " @",
            lineNumDelim: ":",
            extraLine: false,
            callerLine: true,
            callerCol: true
        },
    }
}

module.exports = {
	KindLogs: class {
		constructor(fname) {
            this.loggers = {}

            this.add = (name, lObj) => {
                if (typeof(name) == "string") {
                    if (typeof(lObj) == "object" && !Array.isArray(lObj)) {
                        if (lObj.text) {
                            if (!lObj.use) {
                                lObj["use"] = "log"
                            }
                            if (!lObj.color) {
                                lObj["use"] = "log"
                            }
                            this.loggers[name] = lObj

                            this.loggers[name].format = globalDefaults.themes.default

                            if (lObj.format) {
                                this.loggers[name].format = {
                                    ...this.loggers[name].format,
                                    ...lObj.format
                                }
                            }

                            this.loggers[name].format.fname = fname

                            //make logger function
                            this[name] = (...args) => {
                                //console.log(this.loggers[name])
                                var logOpts = this.loggers[name]

                                if (this.loggers[name].format.callerLine) {
                                    var caller_line = (new Error).stack.split("\n")[2].split(":")
        
                                    if (this.loggers[name].format.callerCol) {
                                        var cleanCaller = caller_line[caller_line.length-2] + this.loggers[name].format.lineNumDelim + caller_line[caller_line.length-1].split(")")[0]
                                    } else {
                                        var cleanCaller = caller_line[caller_line.length-2]
                                    }
        
        
                                    var logArgs = [
                                        chalk.hex(logOpts.color).bold(this.loggers[name].format.startChar + this.loggers[name].text + this.loggers[name].format.fname + this.loggers[name].format.lineNumSeparator + cleanCaller + this.loggers[name].format.endChar),
                                        ...args,
                                    ]
                                } else {
                                    var logArgs = [
                                        chalk.hex(this.loggers[name].color).bold(this.loggers[name].startChar + this.loggers[name].text + this.loggers[name].fname + this.loggers[name].endChar),
                                        ...args,
                                    ]
                                }

                                console[logOpts.use](...logArgs)
                            }

                        } else {
                            throw(`KindLogger.add requires second argument object to contain 'color' and 'text' properties...`)
                        }
                    } else {
                        throw(`KindLogger.add requires second argument to be non-array 'object', got '${typeof(name)}' - array: '${Array.isArray(lObj)}'...`)
                    }
                } else {
                    throw(`KindLogger.add requires first argument to be 'string', got '${typeof(name)}'...`)
                }
            }

            for (var key of Object.keys(globalDefaults.loggers)) {
                //console.log(key)
                this.add(key, globalDefaults.loggers[key])
                
            }

            /*this.set = (logger, setting, value) => {
                if (typeof(logger) == "string" && typeof(setting) == "string" && typeof(value) == "string") {
                    if (loggerExists(logger, Object.keys(this))) {
                        //logger exists, merge settings object
                        this.loggers[logger][setting] = value

                    } else {
                        throw(`KindLogger.set: logger '${logger}' does not exist in this KindLogger...`)
                    }
                } else {
                    throw(`KindLogger.set requires first, second, and third argument to be 'string', got '${typeof(logger)}' and '${typeof(setting)}'...`)
                }
            }*/

            this.set = (logger, setting, value) => {
                //console.log(logger, setting, value)
                if (typeof(logger) == "string") {
                    if (loggerExists(logger, Object.keys(this))) {
                        if (typeof(setting) == "string") {
                            if (typeof(value) == "string") {
                                //logger exists, set the setting
                                this.loggers[logger][setting] = value
                            } else {
                                throw(`KindLogger.setFormat requires third argument to be 'string' if changing individual setting, got '${typeof(value)}'...`)
                            }
                        } else if (typeof(setting) == "object" && !Array.isArray(setting)) {
                            //logger exists, and settings is an object, merge the settings object
                            this.loggers[logger] = {
                                ...this.loggers[logger],
                                ...setting,
                            }
                        } else {
                            throw(`KindLogger.setFormat requires second argument to be 'string' or 'object (non-array)', got '${typeof(setting)}'...`)
                        }
                    } else {
                        throw(`KindLogger.setFormat: logger '${logger}' does not exist in this KindLogger...`)
                    }
                } else {
                    throw(`KindLogger.setFormat requires first argument to be 'string', got '${typeof(logger)}'...`)
                }
            }

            this.setFormat = (logger, setting, value) => {
                //console.log(logger, setting, value)
                if (typeof(logger) == "string") {
                    if (loggerExists(logger, Object.keys(this.loggers))) {
                        if (typeof(setting) == "string") {
                            if (typeof(value) == "string") {
                                //logger exists, set the format setting
                                this.loggers[logger].format[setting] = value
                            } else {
                                throw(`KindLogger.setFormat requires third argument to be 'string' if changing individual setting, got '${typeof(value)}'...`)
                            }
                        } else if (typeof(setting) == "object" && !Array.isArray(setting)) {
                            //logger exists, and settings is an object, merge the format settings object
                            this.loggers[logger].format = {
                                ...this.loggers[logger].format,
                                ...setting,
                            }
                        } else {
                            throw(`KindLogger.setFormat requires second argument to be 'string' or 'object (non-array)', got '${typeof(setting)}'...`)
                        }
                    } else {
                        throw(`KindLogger.setFormat: logger '${logger}' does not exist in this KindLogger...`)
                    }
                } else {
                    throw(`KindLogger.setFormat requires first argument to be 'string', got '${typeof(logger)}'...`)
                }
            }

            this.setTheme = (logger, theme) => {
                //console.log(logger, setting, value)
                if (typeof(logger) == "string" && typeof(theme) == "string") {
                    if (loggerExists(logger, Object.keys(this.loggers))) {
                        if (themeExists(theme, Object.keys(globalDefaults.themes))) {
                            this.loggers[logger].format = {
                                ...this.loggers[logger].format,
                                ...globalDefaults.themes[theme]
                            }
                        } else {
                            throw(`KindLogger.setTheme: logger '${logger}' does not exist in this KindLogger...`)
                        }
                    } else {
                        throw(`KindLogger.setTheme: logger '${logger}' does not exist in this KindLogger...`)
                    }
                } else {
                    throw(`KindLogger.setTheme requires first, second, and third argument to be 'string', got '${typeof(logger)}' and '${typeof(setting)}'...`)
                }
            }

            return this
		}
	}
}

var loggerExists = (logger, selfkeys) => {
    for (let realLogger of selfkeys) {
        if (logger == realLogger) {
            return true
        }
    }
    return false
}

var themeExists = (theme, selfkeys) => {
    for (let realTheme of selfkeys) {
        if (theme == realTheme) {
            return true
        }
    }
    return false
}