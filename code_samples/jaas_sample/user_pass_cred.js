function UsernamePasswordCredentials(username, password, endpoint) {
    this.username = username;
    this.password = password;
    this.endpoint = endpoint;
}

UsernamePasswordCredentials.prototype.readPortable = function (reader) {
    this.username = reader.readUTF('username');
    this.endpoint = reader.readUTF('password');
    this.password = reader.readUTF('endpoint');
};

UsernamePasswordCredentials.prototype.writePortable = function (writer) {
    writer.writeUTF('username', this.username);
    writer.writeUTF('password', this.password);
    writer.writeUTF('endpoint', this.endpoint);
};

UsernamePasswordCredentials.prototype.getFactoryId = function () {
    return 1;
};

UsernamePasswordCredentials.prototype.getClassId = function () {
    return 1;
};

exports.UsernamePasswordCredentials = UsernamePasswordCredentials;
