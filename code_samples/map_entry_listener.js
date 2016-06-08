var Client = require('../.').Client;
var listener = {
    added: function(key, oldVal, newVal) {
        console.log('added key: ' + key + ', old value: ' + oldVal + ', new value: ' + newVal);
    },
    removed: function(key, oldVal, newVal) {
        console.log('removed key: ' + key + ', old value: ' + oldVal + ', new value: ' + newVal);
    }
};

var pushNotification = function(map, key, value)  {
    return map.put(key, value);
};

var removeNotification = function(map, key) {
    return map.remove(key);
};

Client.newHazelcastClient().then(function(client) {
    var map = client.getMap('notifications');
    map.addEntryListener(listener, undefined, true).then(function () {
        return pushNotification(map, 1, 'new-value');
    }).then(function () {
        return removeNotification(map, 1);
    }).then(function () {
        client.shutdown();
    });
});
