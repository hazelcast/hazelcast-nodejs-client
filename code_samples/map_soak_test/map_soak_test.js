var Hazelcast = require('../../.');
var Config = Hazelcast.Config;
var Client = Hazelcast.Client;
var Address = Hazelcast.Address;
var Predicates = Hazelcast.Predicates;
var IdentifiedEntryProcessor = require('../../test/javaclasses/IdentifiedEntryProcessor');
var IdentifiedFactory = require('../../test/javaclasses/IdentifiedFactory');

process.on('SIGINT', function( ){
    stopTest = true;
    nz++;
    if (nz == 2) {
        process.exit(1);
    }
});

/**
 * Test variables
 */

var MAX_ALLOWED_ACTIVE_REQUESTS = 32;
var MAX_ALLOWED_CONSECUTIVE_REQUESTS = MAX_ALLOWED_ACTIVE_REQUESTS;
var stopTest = false;
var runningOperations = 0;
var startTime;
var endTime;
var client;
var nz = 0;

/**
 * Helper functions
 */

function fancyDuration(millisec) {
    var times = Math.floor(millisec / 1000);

    var secs = Math.floor(times % 60);
    var minutes = Math.floor((times % 3600) / 60);
    var hours = Math.floor(times / 3600);

    return hours + ':' + minutes + ':' +secs;
}

function testCompleted() {
    endTime = new Date();
    client.shutdown();
    var elapsedMilliseconds = endTime.getTime() - startTime.getTime();

    console.log('Test completed at ' + endTime + '.\n' +
        'Elapsed time(s): ' + fancyDuration(elapsedMilliseconds));
}

function completeIfNoActiveCallbacks() {
    if (stopTest && runningOperations === 0) {
        testCompleted();
    }
}

function handleError(err) {
    console.log(err);
    process.exit(1);
}

function completeOperation() {
    runningOperations--;
    completeIfNoActiveCallbacks();
}

function randomString() {
    return Math.random().toString(36).substring(2, 15);
}

function randomInt(upto) {
    return Math.floor(Math.random() * upto);
}

/**
 * Entry listener
 */

function nop() {

}

var listener = {
    added: function(key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    updated: function(key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    removed: function(key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    evicted: function(key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    clearedAll: function(key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    evictedAll: function(key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
};

/**
 * Test
 */

var cfg = new Config.ClientConfig();
for (var i = 2; i < process.argv.length; i++) {
    var sp = process.argv[i].split(':');
    cfg.networkConfig.addresses[0] = new Address(sp[0], Number.parseInt(sp[1]));
}
cfg.serializationConfig.dataSerializableFactories[66] = new IdentifiedFactory();

var map;
Client.newHazelcastClient(cfg).then(function (c) {
    client = c;
    map = client.getMap('default');
    return map.addEntryListener(listener);
}).then(function () {
    startTime = new Date();
    console.log('Test started at ' + startTime);
    (function innerOperation() {
        if (stopTest) {
            completeIfNoActiveCallbacks();
            return;
        }
        if ( runningOperations > MAX_ALLOWED_ACTIVE_REQUESTS) {
            setTimeout(innerOperation, 1);
        } else {
            if ( runningOperations >= MAX_ALLOWED_CONSECUTIVE_REQUESTS) {
                setTimeout(innerOperation, 1);
            } else {
                process.nextTick(innerOperation);
            }
            var key = randomString();
            var operation = randomInt(100);

            runningOperations++;
            var pr;
            if (operation < 30) {
                pr = map.get(key).then(completeOperation);
            } else if (operation < 60) {
                pr = map.put(key, randomString()).then(completeOperation);
            } else if (operation < 80) {
                pr = map.values(Predicates.isBetween('this', 0, 10)).then(completeOperation);
            } else {
                pr = map.executeOnKey(key, new IdentifiedEntryProcessor(key)).then(completeOperation);
            }
            pr.catch(handleError);
        }
    })();
});
