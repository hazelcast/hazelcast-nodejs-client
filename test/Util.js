var promiseLater = function (time, func) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(func());
            }, time);
        });
};
exports.promiseLater = promiseLater;
