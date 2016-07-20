var Client = require('../.').Client;
var Config = require('../.').Config;
var Predicates = require('../.').Predicates;
var cfg = new Config.ClientConfig();

//This comparator is both a comparator and an IdentifiedDataSerializable.
//Note that a comparator should be a serializable object( IdentifiedDataSerializable or Portable)
//because Hazelcast server should be able to deserialize the comparator in order to sort entries.
//So the same class should be registered to Hazelcast server instance.
var comparator = {
    getFactoryId: function() {
        return 1;
    },

    getClassId: function() {
        return 10;
    },

    //This comparator sorts entries according to their keys in reverse alphabetical order.
    sort: function(a, b) {
        if (a[0] > b[0]) return -1;
        if (a[0] < b[0]) return 1;
        return 0;
    },

    readData: function() {

    },

    writeData: function() {

    }
};

//We register our comparator object as IdentifiedDataSerializable.
cfg.serializationConfig.dataSerializableFactories[1] = {
    create: function() {
        return comparator;
    }
};

var predicate = Predicates.paging(Predicates.truePredicate(), 2, comparator);
Client.newHazelcastClient(cfg).then(function (client) {
    var map = client.getMap('test');
    map.putAll([['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5], ['f', 6], ['g', 7]]).then(function () {
        return map.size();
    }).then(function(mapSize) {
        console.log('Added ' + mapSize + ' elements.');

        predicate.setPage(0);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 0);
        console.log(values);
        predicate.setPage(1);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 1);
        console.log(values);
        predicate.setPage(2);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 2);
        console.log(values);
        predicate.setPage(3);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 3);
        console.log(values);
        return client.shutdown();
    });
});
