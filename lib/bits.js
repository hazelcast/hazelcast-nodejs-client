var message  = require('./client_message');

var calculate_size_str = function (val) {
    if(val!==undefined)
    return val.length + message.INT_SIZE_IN_BYTES;
}

module.exports = {
    calculate_size_str: calculate_size_str
};