var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;

var nearCachedMapName = 'nearCachedMap';
var regularMapName = 'reqularMap';
var client;

var cfg = new Config.ClientConfig();
var nearCacheConfig = new Config.NearCacheConfig();
nearCacheConfig.name = nearCachedMapName;
nearCacheConfig.invalidateOnChange = true;
cfg.nearCacheConfigs[nearCachedMapName] = nearCacheConfig;

function do50000Gets(client, mapName) {
    var timerStart;
    var timerEnd;

    return client.getMap(mapName).put('item', 'anItem').then(function () {
        //warm up the cache
        return client.getMap(mapName).get('item')
    }).then(function () {
        timerStart = Date.now();
        var requests = [];
        for (var i = 0; i < 50000; i++) {
            requests.push(client.getMap(mapName).get('item'));
        }
        return Promise.all(requests);
    }).then(function () {
        timerEnd = Date.now();
        console.log('Took ' + (timerEnd - timerStart) + ' ms to do 50000 gets on ' + mapName + '.');
    });
}

Client.newHazelcastClient(cfg).then(function (cl) {
    client = cl;
    return do50000Gets(client, nearCachedMapName);
}).then(function () {
    return do50000Gets(client, regularMapName);
}).then(function () {
    client.shutdown();
});
