function OuterPortable(innerPortable) {
    this.innerPortable = innerPortable;
}

OuterPortable.prototype.getFactoryId = function () {
    return 10;
};

OuterPortable.prototype.getClassId = function () {
    return 555;
};

OuterPortable.prototype.readPortable = function (reader) {
    this.innerPortable = reader.readPortable('inner_portable');
};

OuterPortable.prototype.writePortable = function (writer) {
    writer.writePortable('inner_portable', this.innerPortable);
};

OuterPortable.prototype.getVersion = function () {
    return 3;
};

function InnerPortable(metadata, reference) {
    this.m = metadata;
    this.r = reference;
}

InnerPortable.prototype.getVersion = function () {
    return 3;
};

InnerPortable.prototype.getClassId = function() {
    return 999;
};

InnerPortable.prototype.getFactoryId = function () {
    return 10;
};

InnerPortable.prototype.writePortable = function (writer) {
    writer.writeUTF('m', this.m);
    writer.writeUTF('r', this.r);
};

InnerPortable.prototype.readPortable = function (reader) {
    this.m = reader.readUTF('m');
    this.r = reader.readUTF('r');
};

var factory = {
    create: function(classId) {
        if (classId === 555) {
            return new OuterPortable();
        } else if (classId === 999) {
            return new InnerPortable();
        } else {
            return null;
        }
    }
};

exports.OuterPortable = OuterPortable;
exports.InnerPortable = InnerPortable;
exports.PortableFactory = factory;
