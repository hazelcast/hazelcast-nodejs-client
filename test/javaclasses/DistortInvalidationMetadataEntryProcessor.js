function DistortInvalidationMetadataEntryProcessor(mapName, mapSize, duration) {
    this.mapSize = mapSize;
    this.mapName = mapName;
    this.duration = duration;
}

DistortInvalidationMetadataEntryProcessor.prototype.readData = function (inp) {
    this.mapName = inp.readUTF();
    this.mapSize = inp.readInt();
    this.duration = inp.readInt();
};

DistortInvalidationMetadataEntryProcessor.prototype.writeData = function (outp) {
    outp.writeUTF(this.mapName);
    outp.writeInt(this.mapSize);
    outp.writeInt(this.duration);
};

DistortInvalidationMetadataEntryProcessor.prototype.getFactoryId = function () {
    return 66;
};

DistortInvalidationMetadataEntryProcessor.prototype.getClassId = function() {
    return 3;
};

module.exports = DistortInvalidationMetadataEntryProcessor;
