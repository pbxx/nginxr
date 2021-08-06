var ejs = require('ejs')
module.exports = {
    makeConfig: (config) => {
        var confTemplateFile = './templates/nginx.conf.ejs'
        var configRendered = '';
        ejs.renderFile(confTemplateFile, {config}, {}, function(err, str){
            // str => Rendered string
            if (err) {
                throw err
            } 
            configRendered = str
        });

        return configRendered
    }
}