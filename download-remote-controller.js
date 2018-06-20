var child_process = require('child_process');
var path = require('path');

var scriptName = path.join('scripts', 'download-rc');
var options = {
    stdio: [0, 1, 2]
};

if (process.platform === 'win32') {
    scriptName = scriptName + '.bat';
} else if (process.platform === 'linux' || process.platform === 'darwin') {
    scriptName = scriptName + '.sh'
}
child_process.execFileSync(scriptName, options);
