/**
 * Node Hierarchy:
 *
 * +-Root
 * +-Value
 *   +-ReferenceableValue
 *     +-ObjectLiteral
 *     +-RegExpObject
 *   +-CustomObject
 *   +-ObjectReference
 */

(function(ns) {
    /**
     * Root
     */
    function Root() {
        this.object = Object.create(null);
    }

    Object.defineProperties(Root.prototype, {
        object: {value: null, writable: true},

        setProperty: {
            value: function(name, value) {
                if (name != null) {
                    this.object[name] = value;
                }
            }
        },

        getProperty: {
            value: function(name) {
                return this.object[name];
            }
        },

        clearProperty: {
            value: function(name) {
                delete this.object[name];
            }
        },

        hasProperty: {
            value: function(name) {
                return name in this.object;
            }
        },

        serialize: {
            value: function(indent) {
                return JSON.stringify(this, null, indent);
            }
        },

        toJSON: {
            value: function() {
                var result = Object.create(null),
                    object;

                for (var label in this.object) {
                    object = this.object[label];

                    if (object.toJSON) {
                        result[label] = object.toJSON(label, 1);
                    } else {
                        result[label] = object;
                    }
                }

                return result;
            }
        }
    });

    /**
     * Value
     */
    function Value(root, value) {
        this.root = root;
        this.value = value;
    }

    Object.defineProperties(Value.prototype, {
        root: {value: null, writable: true},
        label: {value: null, writable: true},
        value: {value: null, writable: true},

        setLabel: {
            value: function(label) {
                if (this.label) {
                    this.root.clearProperty(this.label);
                }

                this.label = label;
                this.root.setProperty(label, this);
            }
        },

        getLabel: {
            value: function() {
                return this.label;
            }
        },

        clearLabel: {
            value: function() {
                this.root.clearProperty(this.label);
                this.label = null;
            }
        },

        _getSerializationValue: {
            value: function() {
                return this.value;
            }
        },

        toJSON: {
            value: function(index, level) {
                var value = this._getSerializationValue();

                if (level === 1) {
                    return {value: value};
                } else {
                    return value;
                }
            }
        }
    });

    /**
     * ReferenceableValue
     *
     * @extends Value
     */
    function ReferenceableValue(root, value) {
        Value.call(this, root, value);
    }

    ReferenceableValue.prototype = Object.create(Value.prototype, {
        constructor: {value: ReferenceableValue},

        toJSON: {
            value: function(index, level) {
                var reference,
                    value = this._getSerializationValue();

                if (level === 1) {
                    return {value: value};
                } else if (this.label) {
                    reference = new ObjectReference(this.root, this.label);
                    return reference.toJSON();
                } else {
                    return value;
                }
            }
        }
    });

    /**
     * ObjectLiteral
     *
     * @extends ReferenceableValue
     */
    function ObjectLiteral(root, object) {
        Value.call(this, root, object);
    }

    ObjectLiteral.prototype = Object.create(ReferenceableValue.prototype, {
        constructor: {value: ObjectLiteral},

        setProperty: {
            value: function(name, value) {
                if (name != null) {
                    this.value[name] = value;
                }
            }
        },

        getProperty: {
            value: function(name) {
                return this.value[name];
            }
        },

        clearProperty: {
            value: function(name) {
                delete this.value[name];
            }
        },

        getPropertyNames: {
            value: function() {
                return Object.keys(this.value);
            }
        }
    });

    /**
     * RegExpObject
     *
     * @extends ReferenceableValue
     */
    function RegExpObject(root, regexp) {
        Value.call(this, root, regexp);
    }
    RegExpObject.prototype = Object.create(ReferenceableValue.prototype, {
        constructor: {value: RegExpObject},

        _getSerializationValue: {
            value: function() {
                var regexp = this.value;

                return {"/": {
                    source: regexp.source,
                    flags: (regexp.global ? "g" : "") + (regexp.ignoreCase ? "i" : "") + (regexp.multiline ? "m" : "")
                }};
            }
        }
    });

    /**
     * ObjectLiteral
     *
     * @extends Value
     */
    function CustomObject(root) {
        Value.call(this, root, Object.create(null));
    }

    CustomObject.prototype = Object.create(Value.prototype, {
        constructor: {value: CustomObject},

        setProperty: {
            value: function(name, value) {
                if (name != null) {
                    this.value[name] = value;
                }
            }
        },

        getProperty: {
            value: function(name) {
                return this.value[name];
            }
        },

        clearProperty: {
            value: function(name) {
                delete this.value[name];
            }
        },

        toJSON: {
            value: function(index, level) {
                var reference,
                    value = this._getSerializationValue();

                if (level === 1) {
                    return value;
                } else {
                    reference = new ObjectReference(this.root, this.label);

                    return reference.toJSON();
                }
            }
        }
    });

    /**
     * ObjectReference
     *
     * @extends Value
     */
    function ObjectReference(root, referenceLabel) {
        Value.call(this, root, referenceLabel);
    }

    ObjectReference.prototype = Object.create(Value.prototype, {
        constructor: {value: ObjectReference},

        _getSerializationValue: {
            value: function() {
                return {"@": this.value};
            }
        }
    });

    ns.Root = Root;
    ns.Value = Value;
    ns.ReferenceableValue = ReferenceableValue;
    ns.ObjectLiteral = ObjectLiteral;
    ns.RegExpObject = RegExpObject;
    ns.CustomObject = CustomObject;
    ns.ObjectReference = ObjectReference;
})(exports);