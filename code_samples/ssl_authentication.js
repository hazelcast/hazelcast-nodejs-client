var Config = require('../.').Config;
var HazelcastClient = require('../.').Client;

if (process.argv.length < 5 ) {
    console.log('Usage: \n' +
        'node ssl_authentication.js [servername] [certificate-file] [trusted-ca]');
    return
}

var cfg = new Config.ClientConfig();
cfg.networkConfig.sslOptions = {
    servername: process.argv[2],
    cert: process.argv[3],
    ca: process.argv[4],
};

HazelcastClient.newHazelcastClient(cfg).then(function (client) {
    console.log('This client is authenticated using ssl.');
    client.shutdown();
});
