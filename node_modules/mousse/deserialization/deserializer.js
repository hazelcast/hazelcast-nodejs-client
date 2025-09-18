(function(ns) {
    var Promise = require("q"),
        Interpreter = require("./interpreter").Interpreter;

    function Deserializer(serializationString) {
        this._serializationString = serializationString;
    }

    Object.defineProperties(Deserializer.prototype, {
        _interpreter: {value: new Interpreter()},
        _serializationString: {value: null, writable: true},

        deserialize: {
            value: function(objects) {
                var serialization;

                try {
                    serialization = JSON.parse(this._serializationString);
                } catch (error) {
                    return Promise.reject(error);
                }

                return this._interpreter.instantiate(serialization, objects);
            }
        },

        deserializeObject: {
            value: function(objects) {
                return this.deserialize(objects).then(function(objects) {
                    return objects.root;
                });
            }
        }
    });

    function deserialize(serializationString) {
        return new Deserializer(serializationString).deserializeObject();
    };

    ns.Deserializer = Deserializer;
    ns.deserialize = deserialize;
})(exports);
