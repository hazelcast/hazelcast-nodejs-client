(function(ns) {
    function Labeler() {
        this._labels = Object.create(null);
        this._objectsLabels = Object.create(null);
        this._objects = Object.create(null);
        this._baseNamesIndex = Object.create(null);
        this._userDefinedLabels = Object.create(null);
    }

    Object.defineProperties(Labeler.prototype, {
        _labels: {value: null, writable: true},
        // hash(object) -> label
        _objectsLabels: {value: null, writable: true},
        _objects: {value: null, writable: true},
        // Labels generation sequence is "label", "label2", "label3", ..., hence
        // starting at 2.
        _INITIAL_LABEL_NUMBER: {value: 2},
        _baseNamesIndex: {value: null, writable: true},
        _userDefinedLabels: {value: null, writable: true},

        /**
         * When the labeler is initialized with objects these objects are
         * considered user defined objects.
         */
        initWithObjects: {
            value: function(labels) {
                for (var label in labels) {
                    this.setObjectLabel(labels[label], label);
                    this._userDefinedLabels[label] = true;
                }
            }
        },

        cleanup: {
            value: function() {
                this._labels = null;
                this._objectsLabels = null;
                this._objects = null;
                this._baseNamesIndex = null;
                this._userDefinedLabels = null;
            }
        },

        generateLabel: {
            value: function(baseName) {
                var index = this._baseNamesIndex[baseName],
                    label;

                do {
                    if (index) {
                        label = baseName + index;
                        this._baseNamesIndex[baseName] = index = index + 1;
                    } else {
                        label = baseName;
                        this._baseNamesIndex[baseName] = index = this._INITIAL_LABEL_NUMBER;
                    }
                } while (label in this._labels);

                return label;
            }
        },

        getLabelBaseName: {
            value: function(label) {
                return label.replace(/\d*$/, "");
            }
        },

        addLabel: {
            value: function(label) {
                this._labels[label] = true;
            }
        },

        addLabels: {
            value: function(labels) {
                for (var i = 0, ii = labels.length; i < ii; i++) {
                    this.addLabel(labels[i]);
                }
            }
        },

        isLabelDefined: {
            value: function(label) {
                return label in this._labels;
            }
        },

        isUserDefinedLabel: {
            value: function(label) {
                return label in this._userDefinedLabels;
            }
        },

        /// OBJECTS LABEL MANAGEMENT

        getObjectName: {
            value: function(object) {
                if (Array.isArray(object)) {
                    return "array";
                } else if (RegExp.isRegExp(object)) {
                    return "regexp";
                } else {
                    return typeof object;
                }
            }
        },

        generateObjectLabel: {
            value: function(object) {
                var objectName = this.getObjectName(object);

                return this.generateLabel(objectName);
            }
        },

        getObjectLabel: {
            value: function(object) {
                var hash = Object.hash(object),
                    label;

                if (hash in this._objectsLabels) {
                    label = this._objectsLabels[hash];
                } else {
                    label = this.generateObjectLabel(object);
                    this.setObjectLabel(object, label);
                }

                return label;
            }
        },

        setObjectLabel: {
            value: function(object, label) {
                if (typeof object !== "undefined") {
                    var hash = Object.hash(object);

                    this.addLabel(label);
                    this._objectsLabels[hash] = label;
                    this._objects[label] = object;
                }
            }
        },

        getObjectByLabel: {
            value: function(label) {
                return this._objects[label];
            }
        }
    });

    ns.Labeler = Labeler;
})(exports);
