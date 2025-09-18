var Promise = require("q");

(function(ns) {
    function Context(serialization, reviver, objects) {
        this._reviver = reviver;
        this._serialization = serialization;
        this._objects = Object.create(null);

        if (objects) {
            this._userObjects = Object.create(null);

            for (var label in objects) {
                this._userObjects[label] = objects[label];
            }
        }
    }

    Object.defineProperties(Context.prototype, {
        _objects: {value: null, writable: true},
        _userObjects: {value: null, writable: true},
        _serialization: {value: null, writable: true},
        _reviver: {value: null, writable: true},

        setObjectLabel: {
            value: function(object, label) {
                this._objects[label] = object;
            }
        },

        getObject: {
            value: function(label) {
                var serialization = this._serialization,
                    reviver = this._reviver,
                    objects = this._objects,
                    object;

                if (label in objects) {
                    return objects[label];
                } else if (label in serialization) {
                    object = reviver.reviveRootObject(serialization[label], this, label);
                    // If no object has been set by the reviver we safe its
                    // return, it could be a value or a promise, we need to
                    // make sure the object won't be revived twice.
                    if (!(label in objects)) {
                        objects[label] = object;
                    }

                    return object;
                } else {
                    return Promise.reject(
                        new Error("Object with label '" + label + "' was not found.")
                    );
                }
            }
        },

        getObjects: {
            value: function() {
                var self = this,
                    reviver = this._reviver,
                    serialization = this._serialization,
                    promises = [],
                    result;

                for (var label in serialization) {
                    result = this.getObject(label);

                    if (Promise.isPromise(result)) {
                        promises.push(result);
                    }
                }

                if (promises.length === 0) {
                    return Promise.resolve(this._invokeDidReviveObjects());
                } else {
                    return Promise.all(promises).then(function() {
                        return self._invokeDidReviveObjects();
                    });
                }
            }
        },

        hasUserObject: {
            value: function(label) {
                var userObjects = this._userObjects;

                if (userObjects) {
                    return label in userObjects;
                } else {
                    return false;
                }
            }
        },

        getUserObject: {
            value: function(label) {
                var userObjects = this._userObjects;

                if (userObjects) {
                    return userObjects[label];
                }
            }
        },

        _invokeDidReviveObjects: {
            value: function() {
                var self = this,
                    reviver = this._reviver,
                    result;

                if (typeof reviver.didReviveObjects === "function") {
                    result = reviver.didReviveObjects(this._objects, this);
                    if (Promise.isPromise(result)) {
                        return result.then(function() {
                            return self._objects;
                        });
                    }
                }

                return this._objects;
            }
        }
    });

    ns.Context = Context;
})(exports);