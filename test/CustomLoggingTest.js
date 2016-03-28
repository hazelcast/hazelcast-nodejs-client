var winston = require('winston');
var Config = require('../lib/Config');
var HazelcastClient = require('../lib/HazelcastClient');
describe('Custom logging test', function() {
    var client;

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
            this.logger.log(this.levels[level], className + ' ' + message + ' ' + furtherInfo);
        }
    };

    it('winston should emit logging event', function(done) {
        winstonAdapter.logger.on('logging', function(transport, level, msg, meta) {
            done();
        });
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging.module'] = winstonAdapter;
        return HazelcastClient.newHazelcastClient(cfg).then(function(hz) {
            client = hz;
        });
    })
});
