var winston = require('winston');
var Config = require('../.').Config;
var HazelcastClient = require('../.').Client;

if(process.argv.length != 3){
    console.log('Run as node logging.js [logger]');
    console.log('[logger]: winston/default/off');
} else {
    var cfg = new Config.ClientConfig();

    if (process.argv[2] === 'winston') {
        var winstonAdapter = {
            logger: new (winston.Logger)({
                transports: [
                    new (winston.transports.Console)()
                ]
            }),

            levels: [
                'error',
                'warn',
                'info',
                'debug',
                'silly'
            ],

            log: function(level, className, message, furtherInfo) {
                this.logger.log(this.levels[level], className + ' ' + message);
            }
        };
        cfg.properties['hazelcast.logging'] = winstonAdapter;
    } else {
        cfg.properties['hazelcast.logging'] = process.argv[2];

    }
    HazelcastClient.newHazelcastClient(cfg).then(function(client){
        client.shutdown();
    });
}

