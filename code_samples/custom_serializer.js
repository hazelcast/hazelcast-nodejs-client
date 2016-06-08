var Client = require('../.').Client;
var Config = require('../.').Config;
var cfg = new Config.ClientConfig();

function TimeOfDay(hour, minute, second) {
    this.hour = hour;
    this.minute = minute;
    this.second = second;
}

TimeOfDay.prototype.hzGetCustomId = function() {
    return 42;
};

var CustomSerializer = {
    getId: function() {
        return 42;
    },
    write: function(out, timeofday) {
        var secondPoint = (timeofday.hour * 60 + timeofday.minute) * 60 + timeofday.second;
        out.writeInt(secondPoint);
    },
    read: function(inp) {
        var obj = new TimeOfDay();
        var unit = inp.readInt();
        obj.second = unit % 60;
        unit = (unit - obj.second) / 60;
        obj.minute = unit % 60;
        unit = (unit - obj.minute) / 60;
        obj.hour = unit;
        obj.customDeserialized = true;
        return obj;
    }
};

var giveInformation = function(timeofday) {
    console.log('-------------------');
    console.log('Custom deserialized: ' + !!(timeofday.customDeserialized) );
    console.log('Hour: ' + timeofday.hour);
    console.log('Minute: ' + timeofday.minute);
    console.log('Second: ' + timeofday.second);
    console.log('-------------------');
};

cfg.serializationConfig.customSerializers.push(CustomSerializer);
Client.newHazelcastClient(cfg).then(function (client) {
    var map = client.getMap('time');
    var t = new TimeOfDay(5, 32, 59);
    giveInformation(t);
    map.put(1, t).then(function() {
        return map.get(1);
    }).then(function(deserialized) {
        giveInformation(deserialized);
        client.shutdown();
    });
});
