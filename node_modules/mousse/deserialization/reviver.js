(function(ns) {
    var global = (function() { return this; })(),
        Promise = require("q");

    function Reviver() {

    }

    Object.defineProperties(Reviver.prototype, {
        _createAssignValueFunction: {
            value: function(object, propertyName) {
                return function(value) {
                    object[propertyName] = value;
                }
            }
        },

        getTypeOf: {
            value: function(value) {
                var typeOf = typeof value;

                if (value === null) {
                    return "null";
                } else if (Array.isArray(value)) {
                    return "array";
                } else if (typeOf === "object" && Object.keys(value).length === 1) {
                    if ("@" in value) {
                        return "reference";
                    } else if ("/" in value) {
                        return "regexp";
                    } else {
                        return "object";
                    }
                } else {
                    return typeOf;
                }
            }
        },

        getCustomObjectTypeOf: {
            writable: true,
            value: function() {}
        },

        reviveRootObject: {
            value: function(value, context, label) {
                var object;

                // Check if the optional "debugger" unit is set for this object
                // and stop the execution. This is intended to provide a certain
                // level of debugging in the serialization.
                if (value.debugger) {
                    debugger;
                }

                if ("value" in value) {

                    // it's overriden by a user object
                    if (context.hasUserObject(label)) {
                        object = context.getUserObject(label);
                        context.setObjectLabel(object, label);
                        return object;
                    } else {
                        return this.reviveValue(value.value, context, label);
                    }

                } else if (Object.keys(value).length === 0) {

                    // it's an external object
                    if (context.hasUserObject(label)) {
                        object = context.getUserObject(label);
                        context.setObjectLabel(object, label);
                        return object;
                    } else {
                        return this.reviveExternalObject(value, context, label);
                    }

                } else {

                    return this.reviveCustomObject(value, context, label);

                }
            }
        },

        reviveValue: {
            value: function(value, context, label) {
                var type = this.getTypeOf(value);

                if (type === "string" || type === "number" || type === "boolean" || type === "null" || type === "undefined") {
                    return this.reviveNativeValue(value, context, label);
                } else if (type === "regexp") {
                    return this.reviveRegExp(value, context, label);
                } else if (type === "reference") {
                    return this.reviveObjectReference(value, context, label);
                } else if (type === "array") {
                    return this.reviveArray(value, context, label);
                } else if (type === "object") {
                    return this.reviveObjectLiteral(value, context, label);
                } else {
                    return this._callReviveMethod("revive" + type, value, context, label);
                }
            }
        },

        reviveNativeValue: {
            value: function(value, context, label) {
                if (label) {
                    context.setObjectLabel(value, label);
                }

                return value;
            }
        },

        reviveObjectLiteral: {
            value: function(value, context, label) {
                var item,
                    promises = [];

                if (label) {
                    context.setObjectLabel(value, label);
                }

                for (var propertyName in value) {
                    item = this.reviveValue(value[propertyName], context);

                    if (Promise.isPromise(item)) {
                        promises.push(
                            item.then(this._createAssignValueFunction(
                                value, propertyName)
                            )
                        );
                    } else {
                        value[propertyName] = item;
                    }
                }

                if (promises.length === 0) {
                    return value;
                } else {
                    return Promise.all(promises).then(function() {
                        return value;
                    });
                }
            }
        },

        reviveRegExp: {
            value: function(value, context, label) {
                var value = value["/"],
                    regexp = new RegExp(value.source, value.flags);

                if (label) {
                    context.setObjectLabel(regexp, label);
                }

                return regexp;
            }
        },

        reviveObjectReference: {
            value: function(value, context, label) {
                var value = value["@"],
                    object = context.getObject(value);

                return object;
            }
        },

        reviveArray: {
            value: function(value, context, label) {
                var item,
                    promises = [];

                if (label) {
                    context.setObjectLabel(value, label);
                }

                for (var i = 0, ii = value.length; i < ii; i++) {
                    item = this.reviveValue(value[i], context);

                    if (Promise.isPromise(item)) {
                        promises.push(
                            item.then(this._createAssignValueFunction(value, i))
                        );
                    } else {
                        value[i] = item;
                    }
                }

                if (promises.length === 0) {
                    return value;
                } else {
                    return Promise.all(promises).then(function() {
                        return value;
                    });
                }
            }
        },

        reviveCustomObject: {
            value: function(value, context, label) {
                var type = this.getCustomObjectTypeOf(value),
                    method = customObjectRevivers["revive" + type];

                if (type) {
                    return method.call(global, value, context, label);
                } else {
                    return Promise.reject(
                        new Error("Object's type is unknown: " + JSON.stringify(value))
                    );
                }
            }
        },

        reviveExternalObject: {
            value: function(value, context, label) {
                return Promise.reject(
                    new Error("External object '" + label + "' not found in user objects.")
                );
            }
        },

        _callReviveMethod: {
            value: function(methodName, value, context, label) {
                return this[methodName](value, context, label);
            }
        }
    });


    /**
     * Custom Object Revivers
     */
    var customObjectRevivers = Object.create(null);

    function makeGetCustomObjectTypeOf(getCustomObjectTypeOf) {
        var previousGetCustomObjectTypeOf = Reviver.prototype.getCustomObjectTypeOf;

        return function(value) {
            return getCustomObjectTypeOf(value) || previousGetCustomObjectTypeOf(value);
        }
    }

    // reviver needs to be of type:
    // {
    //     getTypeOf: function(value) -> "<Type>",
    //     revive<Type>: function(value, context, label) -> object | Promise
    // }
    Reviver.addCustomObjectReviver = function(reviver) {
        for (var methodName in reviver) {
            if (methodName === "getTypeOf") {
                continue;
            }

            if (typeof reviver[methodName] === "function"
                && /^revive/.test(methodName)) {
                if (typeof customObjectRevivers[methodName] === "undefined") {
                    customObjectRevivers[methodName] = reviver[methodName].bind(reviver);
                } else {
                    return new Error("Reviver '" + methodName + "' is already registered.");
                }
            }
        }

        this.prototype.getCustomObjectTypeOf = makeGetCustomObjectTypeOf(reviver.getTypeOf);
    };

    Reviver.resetCustomObjectRevivers = function() {
        customObjectRevivers = Object.create(null);
        this.prototype.getCustomObjectTypeOf = function() {};
    };

    ns.Reviver = Reviver;
})(exports);

if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }
}
