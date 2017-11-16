function IdentifiedEntryProcessor(value) {
    this.value = value;
}

IdentifiedEntryProcessor.prototype.readData = function (inp) {
    this.value = inp.readUTF();
};

IdentifiedEntryProcessor.prototype.writeData = function(outp) {
    outp.writeUTF(this.value);
};

IdentifiedEntryProcessor.prototype.getFactoryId = function () {
    return 66;
};

IdentifiedEntryProcessor.prototype.getClassId = function() {
    return 1;
};

module.exports = IdentifiedEntryProcessor;
