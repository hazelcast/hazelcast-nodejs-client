(function(ns) {
    var Malker = require("./malker").Malker,
        Builder = require("./builder").Builder,
        Labeler = require("./labeler").Labeler,
        Visitor = require("./visitor").Visitor;

    function Serializer() {
        var visitor;

        this._builder = new Builder();
        this._labeler = new Labeler();
        visitor = new Visitor(this._builder, this._labeler);

        this._malker = new Malker(visitor);
    }

    Object.defineProperties(Serializer.prototype, {
        _labeler: {value: null, writable: true},
        _builder: {value: null, writable: true},
        _serializationIndentation: {value: 2, writable: true},
        _malker: {value: null, writable: true},

        setSerializationIndentation: {
            value: function(indentation) {
                this._serializationIndentation = indentation;
            }
        },

        serialize: {
            value: function(objects) {
                var serializationString;

                this._labeler.initWithObjects(objects);

                for (var label in objects) {
                    this._malker.visit(objects[label]);
                }

                serializationString = this._formatSerialization(
                    this._builder.getSerialization(
                        this._serializationIndentation
                    )
                );

                return serializationString;
            }
        },

        serializeObject: {
            value: function(object) {
                return this.serialize({root: object});
            }
        },

        _formatSerializationBindingsRegExp: {
            value: /\{\s*("(?:<->?)")\s*:\s*("[^"]+"\s*(?:,\s*"converter"\s*:\s*\{\s*"@"\s*:\s*"[^"]+"\s*\}\s*|,\s*"deferred"\s*:\s*(true|false)\s*)*)\}/gi
        },
        _formatSerializationBindingsReplacer: {
            value: function(_, g1, g2) {
                return '{' + g1 + ': ' +
                            g2.replace(/\n\s*/g, "").replace(/,\s*/g, ", ") +
                       '}';
            }
        },
        _formatSerializationBindings: {
            value: function(serialization) {
                return serialization.replace(
                    this._formatSerializationBindingsRegExp,
                    this._formatSerializationBindingsReplacer);
            }
        },

        _formatSerializationReferencesRegExp: {
            value: /\{\s*("[#@]")\s*:\s*("[^"]+")\s*\}/gi
        },
        _formatSerializationReferences: {
            value: function(serialization) {
                return serialization.replace(
                    this._formatSerializationReferencesRegExp, "{$1: $2}");
            }
        },

        _formatSerialization: {
            value: function(serialization) {
                return this._formatSerializationBindings(
                        this._formatSerializationReferences(serialization));
            }
        }
    });

    ns.Serializer = Serializer;
    ns.serialize = function(object) {
        return new Serializer().serializeObject(object);
    };
})(exports);
