var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config.ClientConfig;

var UsernamePasswordCredentials = require('./user_pass_cred').UsernamePasswordCredentials;
var UsernamePasswordCredentialsFactory = require('./user_pass_cred_factory').UsernamePasswordCredentialsFactory;

var adminClientConfig = new Config();

adminClientConfig.serializationConfig.portableFactories[1] = new UsernamePasswordCredentialsFactory();
adminClientConfig.customCredentials = new UsernamePasswordCredentials('admin', 'password1', '127.0.0.1');

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
