var IdentifiedEntryProcessor = require('./IdentifiedFactory');
var DistortInvalidationMetadataEntryProcessor = require('./DistortInvalidationMetadataEntryProcessor');
var CustomComparator = require('./CustomComparator');

function IdentifiedFactory() {
}

IdentifiedFactory.prototype.create = function (type) {
    if (type === 1) {
        return new IdentifiedEntryProcessor();
    } else if (type === 2) {
        return new CustomComparator();
    } else if (type === 3) {
        return new DistortInvalidationMetadataEntryProcessor();
    }
};

module.exports = IdentifiedFactory;
