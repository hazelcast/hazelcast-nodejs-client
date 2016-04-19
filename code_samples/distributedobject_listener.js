var Client = require('../.').Client;
Client.newHazelcastClient().then(function(hazelcastClient) {
    hazelcastClient.addDistributedObjectListener(function(serviceName, name, event) {
        console.log('Distributed object event >>> ' + JSON.stringify({serviceName: serviceName, name: name, event: event}));
    });
    var mapname = 'test' + new Date();
    //this causes a created event
    hazelcastClient.getMap(mapname);
    //this causes no event because map was already created
    hazelcastClient.getMap(mapname);
});
