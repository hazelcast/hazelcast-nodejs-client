var winston = require('winston');
var Config = require('../.').Config;
var HazelcastClient = require('../.').Client;

if(process.argv.length != 3){
    console.log('You must give exactly one argument to run this tool!!!');
}else{


    var cfg = new Config.ClientConfig();
    cfg.properties['hazelcast.logging'] = process.argv[2];
    
    switch (cfg.properties['hazelcast.logging']){
       
        case 'winston':
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
            
            
            //winston logging is active in case of winston object given as property
            cfg.properties['hazelcast.logging'] = winstonAdapter;
            break;
            
       
        case 'default':
            cfg.properties['hazelcast.logging'] = 'default';
            break;
       
        case 'empty':
            cfg.properties['hazelcast.logging'] = 'default';
            break;
       
        case 'off':
            cfg.properties['hazelcast.logging'] = 'off';
            console.log('Client starting with off-logger');
            break;
        
        default:
            cfg.properties['hazelcast.logging'] = 'unknown';
            console.log('Options for logging are '+'1-)winston 2-)default 3-)empty, 4-)off');
            break;
    }

    if(cfg.properties['hazelcast.logging'] != 'unknown')   {
        HazelcastClient.newHazelcastClient(cfg).then(function(client){
            client.shutdown(); 
        });
    }
}

