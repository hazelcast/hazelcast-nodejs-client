(function(ns) {
    // Provides Object.hash
    require("collections/shim-object");

    function Visitor(builder, labeler) {
        this.builder = builder;
        this.labeler = labeler;
        this._objectsSerialization = Object.create(null);
    }

    Object.defineProperties(Visitor.prototype, {
        builder: {value: null, writable: true},
        labeler: {value: null, writable: true},

        getTypeOf: {
            value: function(object) {
                if (this.isCustomObject(object)) {
                    return "CustomObject";
                }
            }
        },

        getCustomObjectTypeOf: {
            value: function() {},
            writable: true
        },

        isCustomObject: {
            value: function(object) {
                var type = this.getCustomObjectTypeOf(object);

                return typeof type === "string";
            }
        },

        _objectsSerialization: {value: null, writable: true},
        setObjectSerialization: {
            value: function(object, serialization) {
                this._objectsSerialization[Object.hash(object)] = serialization;
            }
        },

        getObjectSerialization: {
            value: function(object) {
                return this._objectsSerialization[Object.hash(object)];
            }
        },

        isObjectSerialized: {
            value: function(object) {
                return Object.hash(object) in this._objectsSerialization;
            }
        },

        enterObject: {
            value: function(malker, object, name) {
                var builderObject = this.builder.createObjectLiteral();

                this.setObjectSerialization(object, builderObject);
                this.builder.push(builderObject);
            }
        },

        exitObject: {
            value: function(malker, object, name) {
                this.storeValue(this.builder.pop(), object, name);
            }
        },

        visitObject: {
            value: function(malker, object, name) {
                var label = this.labeler.getObjectLabel(object),
                    reference = this.builder.createObjectReference(label);

                // visitObject is only called after the object has been entered
                // and serialized, if we're visiting it then label the serialization
                // because we need to create a reference to it now.
                this.getObjectSerialization(object).setLabel(label);
                this.builder.top.setProperty(name, reference);
            }
        },

        enterArray: {
            value: function(malker, array, name) {
                var builderObject = this.builder.createArray();

                this.setObjectSerialization(array, builderObject);
                this.builder.push(builderObject);
            }
        },

        exitArray: {
            value: function(malker, array, name) {
                this.storeValue(this.builder.pop(), array, name);
            }
        },

        visitArray: {
            value: function(malker, array, name) {
                var label = this.labeler.getObjectLabel(array),
                    reference = this.builder.createObjectReference(label);

                // visitArray is only called after the array has been entered
                // and serialized, if we're visiting it then label the serialization
                // because we need to create a reference to it now.
                this.getObjectSerialization(array).setLabel(label);
                this.builder.top.setProperty(name, reference);
            }
        },

        visitRegExp: {
            value: function(malker, regexp, name) {
                this.storeValue(this.builder.createRegExp(regexp), regexp, name);
            }
        },

        visitString: {
            value: function(malker, string, name) {
                this.storeValue(this.builder.createString(string), string, name);
            }
        },

        visitNumber: {
            value: function(malker, number, name) {
                this.storeValue(this.builder.createNumber(number), number, name);
            }
        },

        visitBoolean: {
            value: function(malker, boolean, name) {
                this.storeValue(this.builder.createBoolean(boolean), boolean, name);
            }
        },

        visitNull: {
            value: function(malker, name) {
                this.storeValue(this.builder.createNull(), null, name);
            }
        },

        visitCustomObject: {
            value: function(malker, object, name) {
                var type = this.getCustomObjectTypeOf(object),
                    method = customObjectVisitors["visit" + type];

                if (type) {
                    return method.call(global, malker, this, object, name);
                } else {
                    throw new Error("Object's type is unknown: " + object);
                }
            }
        },

        storeValue: {
            value: function(value, object, name) {
                // if the object has no name then give it a label otherwise it
                // won't be part of the serialization
                if (typeof name === "undefined") {
                    value.setLabel(this.labeler.getObjectLabel(object));
                } else {
                    this.builder.top.setProperty(name, value);
                }
            }
        }
    });

    /*
     * Custom Object Visitors
     */
    var customObjectVisitors = Object.create(null);

    function makeGetCustomObjectTypeOf(getCustomObjectTypeOf) {
        var previousGetCustomObjectTypeOf = Visitor.prototype.getCustomObjectTypeOf;

        return function(value) {
            return getCustomObjectTypeOf(value) ||
                   previousGetCustomObjectTypeOf(value);
        }
    }

    // visitor needs to be of type:
    // {
    //     getTypeOf: function(value) -> "<Type>",
    //     visit<Type>: function(malker, visitor, object, name)
    // }
    Visitor.addCustomObjectVisitor = function(visitor) {
        for (var methodName in visitor) {
            if (methodName === "getTypeOf") {
                continue;
            }

            if (typeof visitor[methodName] === "function"
                && /^visit/.test(methodName)) {
                if (typeof customObjectVisitors[methodName] === "undefined") {
                    customObjectVisitors[methodName] = visitor[methodName].bind(visitor);
                } else {
                    return new Error("Visitor '" + methodName + "' is already registered.");
                }
            }
        }

        this.prototype.getCustomObjectTypeOf = makeGetCustomObjectTypeOf(visitor.getTypeOf);
    };

    Visitor.resetCustomObjectVisitors = function() {
        customObjectVisitors = Object.create(null);
        this.prototype.getCustomObjectTypeOf = function() {};
    };

    ns.Visitor = Visitor;
})(exports);