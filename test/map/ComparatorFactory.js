function noop() {
    //NO-OP
}

function ReverseValueComparator() {
    //Empty
}

ReverseValueComparator.prototype.readData = noop;

ReverseValueComparator.prototype.writeData = noop;

ReverseValueComparator.prototype.getFactoryId = function() {
    return 1;
};

ReverseValueComparator.prototype.getClassId = function() {
    return 1;
};

ReverseValueComparator.prototype.sort = function(o1, o2) {
    return o2[1] - o1[1];
};

exports.ComparatorFactory = {
    create: function(type) {
        if (type === 1) {
            return new ReverseValueComparator();
        } else {
            return null;
        }
    }
};

exports.ReverseValueComparator = ReverseValueComparator;
