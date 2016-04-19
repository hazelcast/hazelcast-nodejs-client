var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
var cfg = new Config.ClientConfig();
cfg.listeners.addLifecycleListener(function(state) {
    console.log('Lifecycle Event >>> ' + state);
});
HazelcastClient.newHazelcastClient(cfg).then(function(hazelcastClient) {
    hazelcastClient.shutdown();
});
