var message_type = require('./../client_message_type');
var ClientMessage = require('./../client_message');
var bits = require('./../bits');
REQUEST_TYPE = 0x0002
RESPONSE_TYPE = 107
RETRYABLE = true
var client_message;
var Client_authentication_codec = function () {
};

Client_authentication_codec.prototype.encode_request = function (username, password, uuid, owner_uuid, is_owner_connection, client_type, serialization_version) {
    client_message = ClientMessage.create(payload_size = calculate_size(username, password, uuid, owner_uuid, is_owner_connection, client_type, serialization_version));
    client_message.set_message_type(REQUEST_TYPE)
    //client_message.set_retryable(RETRYABLE);
    client_message.append_str(username);
    client_message.append_str(password);
    client_message.append_bool(uuid === null);
    if (uuid !== null) {
        client_message.append_str(uuid)
    }
    client_message.append_bool(owner_uuid === null);
    if (owner_uuid !== null) {
        client_message.append_str(owner_uuid)
    }
    client_message.append_bool(is_owner_connection);
    client_message.append_str(client_type);
    client_message.append_byte(serialization_version);
    client_message.update_frame_length();
    client_message.set_message_type(REQUEST_TYPE);
    return client_message

};

function calculate_size(username, password, uuid, owner_uuid, is_owner_connection, client_type, serialization_version) {
    var size = 0
    size += bits.calculate_size_str(username);
    size += bits.calculate_size_str(password);
    size += require('./../client_message').BOOLEAN_SIZE_IN_BYTES;
    if (uuid !== null) {
        size += bits.calculate_size_str(uuid);
    }
    size += require('./../client_message').BOOLEAN_SIZE_IN_BYTES;
    if (owner_uuid !== null) {
        size += bits.calculate_size_str(owner_uuid);
    }
    size += require('./../client_message').BOOLEAN_SIZE_IN_BYTES;
    size += bits.calculate_size_str(client_type);
    size += require('./../client_message').BYTE_SIZE_IN_BYTES;
    return size;
};

module.exports = Client_authentication_codec
exports.client_message = this.client_message