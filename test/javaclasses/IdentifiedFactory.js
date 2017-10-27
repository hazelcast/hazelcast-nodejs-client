var IdentifiedEntryProcessor = require('./IdentifiedFactory');
var CustomComparator = require('./CustomComparator');

function IdentifiedFactory() {

}

IdentifiedFactory.prototype.create = function (type) {
    if (type === 1) {
        return new IdentifiedEntryProcessor();
    } else if (type == 2) {
        return new CustomComparator();
    }
};

module.exports = IdentifiedFactory;
