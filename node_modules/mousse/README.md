# Mousse

A serialization library that serializes graphs of JavaScript objects.

Its main purpose is to provide the features that are missing in JSON and a mechanism to easily extend the serialization format with new types or custom JavaScript objects.

This is the library used by the Montage framework to manage the serialization of objects in its templates.

## What it does that JSON doesn't

 * Named objects
 * References and circular references (no more `TypeError: Converting circular structure to JSON`)
 * Regular Expressions
 * Custom Types
 * Asynchronous revivers

## API Reference

**`Serializer()`**

-   **`serializeObject(object)`**

    Serializes an object into a string.

-   **`serialize(objects)`**

    Serializes objects into a string, each object is passed with a label associated with it. Objects are passed in an object literal `{label1: object1, label2: object2, ..., labelN: objectN}`.

-   **`setSerializationIndentation(indentation)`**

    Set the indentation level of the serialization string (in number of spaces).

**`Deserializer(serializationString)`**

-   _**`constructor`**_

    Creates a deserialization object to deserialize the objects serialized in `serializationString`.

-   **`deserializeObject()`**

    Returns a promise for an object that was serialized with `serializeObject`.

-   **`deserialize(instances)`**

    Returns a promise for the objects that were serialized with `serialize`. This result is an object literal with the deserialized objects and their respective labels: `{label1: object1, label2: object2, ..., labelN: objectN}`.

    The `instances` parameter allows to override the deserialization of specific objects by using the instance passed instead, they are passed in an object literal: `{label1: object1, label2: object2, ..., labelN: objectN}`.

## Serialization of JavaScript objects
### Multiple Objects
```javascript
var Serializer = require("mousse").Serializer;

var object = {
    x: 2,
    y: 4
};

var array = [1, 2, 3];

var serializationString = new Serializer().serialize({foo: object, bar: array});
```

### Single Object

When serializing a single object there's no need to provide a label:

```javascript
var Serializer = require("mousse").Serializer;

var object = {
    x: 2,
    y: 4
};

var serializationString = new Serializer().serializeObject(object);
```

There's also a shorthand function to serialize a single object:

```javascript
var serialize = require("mousse").serialize;

var object = {
    x: 2,
    y: 4
};

var serializationString = serialize(object);
```

## Deserialization of JavaScript objects
### Multiple Objects
```javascript
var Deserializer = require("mousse").Deserializer,
    deserializer = new Deserializer(serializationString);

deserializer.deserialize()
.then(function(objects) {
    // deserialized objects are in objects
});
```

### Single Object
```javascript
var Deserializer = require("mousse").Deserializer,
    deserializer = new Deserializer(serializationString);

deserializer.deserializeObject()
.then(function(object) {
    //
});
```

Again, like for serialization, there's a shorthand function to deserialize a single object:
```javascript
var Deserializer = require("mousse").deserialize;

deserialize(serializationString)
.then(function(object) {
    //
});
```

Consecutive calls to `deserializer.deserialize()` will create a new set of objects from the serialization.

## Serialization Format

The serialization format is inspired by JSON and it may even be considered as an extension. By itself the format is a JSON valid object.

Instead of only serializing a single object, Mousse is able to serialize several independent objects by providing a label for each one. We can look at it as a dictionary.

The base format of the serialization is thus an object with as many entries as labeled objects:
```javascript
{
    "label1": {
        "value": <object1 serialization>
    },

    "label2": {
        "value": <object2 serialization>
    },

    ...,

    "labelN": {
        "value": <objectN serialization>
    }
}
```
The following JavaScript objects are supported:

    * string
    * number
    * boolean
    * null
    * array
    * object literal
    * regular expression
    * references

Native JavaScript objects are stored just like their JSON representation with the exception of regular expressions (which are not supported by JSON).

### String
```javascript
serialize({string: "a string"})

{
    "string": {
        "value": "a string"
    }
}
```
### Number
```javascript
serialize({number: 42})

{
    "number": {
        "value": 42
    }
}
```
### Boolean
```javascript
serialize({bool: true})

{
    "bool": {
        "value": true
    }
}
```
### Null
```javascript
serialize({nil: null})

{
    "nil": {
        "value": null
    }
}
```
### Array
```javascript
serialize({array: [1, 2, 3]})

{
    "array": {
        "value": [1, 2, 3]
    }
}
```
### Object Literal
```javascript
serialize({object: {x: 2, y: 4}})

{
    "object": {
        "value": {
            "x": 2,
            "y": 4
        }
    }
}
```
### Regular Expression
```javascript
serialize({regexp: /regexp/gi})

{
    "regexp": {
        "value": {"/": {
            "source": "regexp",
            "flags": "gi"
        }}
    }
}
```
### References

Since objects have labels it is possible to serialize a reference to an object instead of serializing the entire object again as it happens in JSON:
```javascript
var manager = {
    name: "Foo"
}

var employee = {
    name: "Bar",
    manager: manager
}

serialize({manager: manager, employee: employee})

{
    "manager": {
        "value": {
            "name": "Foo"
        }
    },

    "employee": {
        "value": {
            "name": "Bar",
            "manager": {"@": "manager"}
        }
    }
}
```
References also solves cycles in an object graph:
```javascript
var object = {};
object.self = object;

serialize({object: object});

{
    "object": {
        "value": {
            "self": {"@": "object"}
        }
    }
}
```
When an object is referred more than once it will automatically be assigned a label and only references will be used to refer to it.
```javascript
var array = [1, 2, 3];
var object = {
    foo: array,
    bar: array
}

serialize({object: object});

{
    "object": {
        "value": {
            "foo": {"@": "array"},
            "bar": {"@": "array"}
        }
    },

    "array": {
        "value": [1, 2, 3]
    }
}
```
## Custom Objects

Root objects with the `value` property represent JavaScript objects. It is possible to define other types of objects by adding the necessary logic to recognize them and create them.

### Serialization

The logic to serialize a custom object is handled by the Visitor object. This is the object that visits the graph of objects traversed during serialization and knows what data to store for each type.
The interface expects a `getTypeOf` function that returns the type of the object and a `visit<Type>` function that knows what data to store from the object. Multiple `visit<Type>` can be defined as long as `getTypeOf` returns different types.

```javascript
Visitor.addCustomObjectVisitor({
    getTypeOf: function(value) {
        if (value instanceof Map) {
            return "Map";
        }
    },

    visitMap: function(malker, visitor, object, name) {
        var map = visitor.builder.createCustomObject();
            mapData = object.toObject();

        malker.visit("map", "type");
        malker.visit(mapData, "object");

        visitor.storeValue(map, object, name);
    }
});
```
The result of the serialization is:
```javascript
{
    "root": {
        "type": "map",
        "object": {/* map data */}
    }
}
```

### Deserialization

The logic to deserialize a custom object is handled by the `Reviver` object. This is the object that knows how to revive objects. The interface expects a `getTypeOf` function that returns the type of the object and a `revive<Type>` function that knows how to revive the object. Multiple `revive<Type>` can be defined as long as `getTypeOf` returns different types.

Example to deserialize:
```javascript
{
    "root": {
        "type": "map",
        "object": {/* map data */}
    }
}
```
```javascript
Reviver.addCustomObjectReviver({
    getTypeOf: function(value) {
        if (value.type === "map") {
            return "Map";
        }
    },

    reviveMap: function(value, context, label) {
        var map = new Map(value.object);

        if (label) {
            context.setObjectLabel(map, label);
        }

        return map;
    }
});
```
The result of the deserialization is:
```javascript
{
    root: <Map Object>
}
```

Reviver functions can be asynchronous by returning a promise to the revived value.

### Context

The `context` object is given as the second parameter to all `revive*` functions and it is used to set labels on deserialized objects, so they can be accessed after the deserialization, and to get objects that were serialized under a specific label.

 * `setObjectLabel(object, label)` - Defines the label of `object`.
 * `getObject(label)` - Returns the object with label `label`.

## Extending the Serialization Format

The Mousse serialization format can be extended by extending the Builder and Visitor objects.

### Serialization

During serialization an AST-like object is created that holds all the data needed to be serialized. It is the role of the `Visitor` to create this AST.

When the AST is finished it is the role of the `Builder` to generate an output format by reading the AST. The `Builder` presented in Mousse generates JSON but it should be possible to create a Builder that generates another format, for instance XML.

The `Builder` provides the necessary methods to create the AST Nodes:

 * `createObjectLiteral()`
 * `createArray()`
 * `createObjectReference()`
 * `createRegExp(regexp)`
 * `createString(string)`
 * `createNumber(number)`
 * `createBoolean(value)`
 * `createNull()`
 * `createCustomObject()`

These are the JavaScript objects that Mousse supports. In order to create new ones it is necessary to extend the `Builder` and the `Visitor`.

To extend the serialization format to know about DOM elements and to serialize them into `{"#" "<element id>"}` we need to:

#### Create the AST node
```javascript
function ElementReference(root, id) {
    Value.call(this, root, id);
}

ElementReference.prototype = Object.create(Value.prototype, {
    constructor: {value: ElementReference},

    _getSerializationValue: {
        value: function() {
            return {"#": this.value};
        }
    }
});
```
#### Extend the Builder object
```javascript
function ExtendedBuilder() {
    Builder.call(this);
}

ExtendedBuilder.prototype = Object.create(Builder.prototype, {
    constructor: {value: ExtendedBuilder},

    createElementReference: {
        value: function(id) {
            return new ElementReference(this._root, id);
        }
    }
});
```
#### Extend the Visitor object
```javascript
function ExtendedVisitor(builder, labeler) {
    Visitor.call(this, builder, labeler);
}

ExtendedVisitor.prototype = Object.create(Visitor.prototype, {
    constructor: {value: ExtendedVisitor},

    getTypeOf: {
        value: function(object) {
            if (!!(object && 1 === object.nodeType)) {
                return "ElementReference";
            }
        }
    },

    visitElementReference: {
        value: function(malker, object, name) {
            var elementReference,
                id = object.id;

            elementReference = this.builder.createElementReference(id);
            this.storeValue(elementReference, object, name);
        }
    }
});
```
### Deserialization

Deserialization is handled by the `Reviver` and as such this object needs to be extended to understand the new syntax added to the serialization (`{"#": "<element id>"}`).
```javascript
ExtendedReviver.prototype = Object.create(Reviver.prototype, {
    constructor: {value: ExtendedReviver},

    getTypeOf: {
        value: function(value) {
            if (value !== null && typeof value === "object"
                && Object.keys(value).length === 1 && "#" in value) {
                return "ElementReference";
            } else {
                return Reviver.prototype.getTypeOf.call(this, value);
            }
        }
    },

    reviveElementReference: {
        value: function(value, context, label) {
            var elementId = value["#"],
                element = document.getElementById(elementId);

            if (label) {
                context.setObjectLabel(element, label);
            }

            return element;
        }
    }
});
```

## Known Issues

Not possible to serialize literal objects that can be mistaken as a reference or a regexp - `{"@": "label"}` and `{"/": {"source": "regexp"}}`).

