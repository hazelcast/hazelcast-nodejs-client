var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config.ClientConfig;

var UsernamePasswordCredentials = require('./user_pass_cred').UsernamePasswordCredentials;
var UsernamePasswordCredentialsFactory = require('./user_pass_cred_factory').UsernamePasswordCredentialsFactory;

var adminClientConfig = new Config();
var readerClientConfig = new Config();

adminClientConfig.serializationConfig.portableFactories[1] = new UsernamePasswordCredentialsFactory();
readerClientConfig.serializationConfig.portableFactories[1] = new UsernamePasswordCredentialsFactory();

adminClientConfig.customCredentials = new UsernamePasswordCredentials('admin', 'password1', '127.0.0.1');
readerClientConfig.customCredentials = new UsernamePasswordCredentials('reader', 'password2', '127.0.0.1');

Client.newHazelcastClient(adminClientConfig).then(function (adminClient) {
    console.log('Admin client connected');
    var adminMap;
    return adminClient.getMap('importantAdminMap').then(function (map) {
        console.log('Admin can create a map');
        adminMap = map;
        return adminMap.get('someKey');
    }).then(function (value) {
        console.log('Admin can read from map: ' + value);
        return adminMap.put('anotherKey', 'anotherValue'); // Should resolve
    }).then(function () {
        console.log('Admin can put to map');
        return adminMap.get('anotherKey');
    }).then(function (value) {
        console.log('Value for the "anotherKey" is ' + value);
        return adminClient.shutdown();
    });
});

Client.newHazelcastClient(readerClientConfig).then(function (readerClient) {
    console.log('Reader client connected');
    var readerMap;
    return readerClient.getMap('importantReaderMap').then(function (map) {
        console.log('Reader can create a map');
        readerMap = map;
        return readerMap.get('someKey');
    }).then(function (value) {
        console.log('Reader can read from map: ' + value);
        return readerMap.put('anotherKey', 'anotherValue'); // Should reject
    }).catch(function (err) {
        console.log('Reader cannot put to map. Reason: ' + err);
        return readerClient.shutdown();
    });
});
