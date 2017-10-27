/**
 *
 * @param type
 *          0 -> lexicographical order
 *          1 -> reverse lexicographical
 *          2 -> length increasing order
 * @constructor
 */
function CustomComparator(type, iterationType) {
    this.type = type;
    this.iterationType = iterationType;
}

CustomComparator.prototype.getFactoryId = function () {
    return 66;
};

CustomComparator.prototype.getClassId = function () {
    return 2;
};

CustomComparator.prototype.writeData = function (outp) {
    outp.writeInt(this.type);
    outp.writeInt(this.iterationType);
};

CustomComparator.prototype.readData = function (inp) {
    this.type = inp.readInt();
    this.iterationType = inp.readInt();
};

CustomComparator.prototype.sort = function (o1, o2) {
    if (this.type === 0) {
        return o1[1] - o2[1];
    } else {
        return o2[1] - o1[1];
    }
};

module.exports = CustomComparator;
