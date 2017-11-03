var fs = require('fs');
var pjson = require('./package.json');
var tsjon = require('./tsconfig.json');

var version = pjson.version;
var libDir = tsjon.compilerOptions.outDir;


var buildInfo = {
    'version': version
};

var infoExport = 'module.exports = ' + JSON.stringify(buildInfo) + ';';


if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir);
}
fs.writeFileSync(libDir + '/BuildInfo.js', infoExport);
