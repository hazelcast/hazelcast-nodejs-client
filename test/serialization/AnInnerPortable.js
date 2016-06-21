function AnInnerPortable(anInt, aFloat) {
    this.anInt = anInt;
    this.aFloat = aFloat;
}

AnInnerPortable.prototype.getFactoryId = function() {
    return 1;
};

AnInnerPortable.prototype.getClassId = function() {
    return 2;
};
AnInnerPortable.prototype.writePortable = function(writer) {
    writer.writeInt('i', this.anInt);
    writer.writeFloat('f', this.aFloat);
};
AnInnerPortable.prototype.readPortable = function(reader) {
    this.anInt = reader.readInt('i');
    this.aFloat = reader.readFloat('f');
};
AnInnerPortable.prototype.equals = function(other) {
    if (other === this)
        return true;
    if (this.anInt !== other.anInt)
        return false;
    if (this.aFloat > other.aFloat + Number.EPSILON || this.aFloat < other.aFloat - Number.EPSILON)
        return false;
    return true;
}
module.exports = AnInnerPortable;
