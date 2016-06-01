var expect = require('chai').expect;
var promiseLater = function (time, func) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(func());
            }, time);
        });
};
var expectAlmostEqual = function (actual, expected) {
    for (var prop in expected) {
        if ( typeof expected[prop] === 'number' && !Number.isInteger(expected[prop])) {
            expect(actual[prop]).to.be.closeTo(expected[prop], 0.0001);
        } else if(typeof expected[prop] === 'object') {
            expectAlmostEqual(actual[prop], expected[prop]);
        } else {
            expect(actual[prop], prop).to.deep.equal(expected[prop]);
        }
    }
};
exports.promiseLater = promiseLater;
exports.expectAlmostEqual = expectAlmostEqual;
