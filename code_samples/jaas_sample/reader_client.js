var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config.ClientConfig;

var UsernamePasswordCredentials = require('./user_pass_cred').UsernamePasswordCredentials;
var UsernamePasswordCredentialsFactory = require('./user_pass_cred_factory').UsernamePasswordCredentialsFactory;

var readerClientConfig = new Config();

readerClientConfig.serializationConfig.portableFactories[1] = new UsernamePasswordCredentialsFactory();
readerClientConfig.customCredentials = new UsernamePasswordCredentials('reader', 'password2', '127.0.0.1');

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
