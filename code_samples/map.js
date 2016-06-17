var Client = require('../.').Client;
var insertPerson = function (map, key, val, ttl) {
    return map.put(key, val, ttl).then(function(previousVal) {
        console.log('Put key: ' + JSON.stringify(key) + ', value: ' + JSON.stringify(val) + ',  previous value: ' + JSON.stringify(previousVal));
    });
};

var removePerson = function (map, key) {
    return map.remove(key).then(function() {
        console.log('Removed ' + JSON.stringify(key));
    });
};

var getPerson = function (map, key) {
    return map.get(key).then(function(val) {
        console.log('Person with id ' + JSON.stringify(key) + ': ' + JSON.stringify(val));
    });
};

var shutdownHz = function(client) {
    return client.shutdown();
};

Client.newHazelcastClient().then(function (hazelcastClient) {
    var map = hazelcastClient.getMap('people');
    var john = {firstname: 'John', lastname: 'Doe'};
    var jane = {firstname: 'Jane', lastname: 'Doe'};
    //insert
    insertPerson(map, 1, john)
        .then(function () {
            //get
            return getPerson(map, 1);
        })
        .then(function () {
            //remove
            return removePerson(map, 1);
        })
        .then(function () {
            //insert with ttl
            return insertPerson(map, 2, jane, 1000);
        })
        .then(function() {
            return getPerson(map, 2);
        })
        .then(function() {
            //Jane should be erased after 1000 milliseconds
            setTimeout(function() {
                getPerson(map, 2).then(function() {
                    shutdownHz(hazelcastClient);
                });
            }, 1000)
        });
});
