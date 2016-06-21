var expect = require('chai').expect;
var promiseLater = function (time, func) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(func());
            }, time);
        });
};
var expectAlmostEqual = function (actual, expected) {
    if (expected === null) {
        return expect(actual).to.equal(expected);
    }
    var typeExpected = typeof expected;
    if (typeExpected === 'number') {
        return expect(actual).to.be.closeTo(expected, 0.0001);
    }
    if (typeExpected === 'object') {
        return (function() {
            var membersEqual = true;
            for (var i in expected) {
                if (expectAlmostEqual(actual[i], expected[i])) {
                    membersEqual = false;
                    break;
                }
            }
            return membersEqual;
        })();
    }
    return expect(actual).to.equal(expected);
};
exports.promiseLater = promiseLater;
exports.expectAlmostEqual = expectAlmostEqual;
