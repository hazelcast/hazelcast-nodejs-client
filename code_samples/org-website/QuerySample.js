var Client = require('hazelcast-client').Client;
var Predicates = require('hazelcast-client').Predicates;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    // Get a Distributed Map called "users"
    var users = hz.getMap('users');
    // Add some users to the Distributed Map
    generateUsers(users).then(function () {
        // Create a Predicate
        var criteriaQuery = Predicates.and(
            Predicates.isEqualTo('active', true),
            Predicates.isBetween('age', 18, 21)
        );
        // Get result collections using the the Predicate
        return users.valuesWithPredicate(criteriaQuery);
    }).then(function (values) {
        // Print out the results
        console.log(values);
        hz.shutdown();
    })
});

function generateUsers(users) {
    return users.put('Rod', new User('Rod', 19, true)).then(function () {
        return users.put('Jane', 20, true);
    }).then(function () {
        return users.put('Freddy', 23, true);
    });
}

// You need to write the counterpart for this class on the cluster side.
// The cluster should be able to deserialize User object in order to run
// queries on them.
function User(username, age, active) {
    this.username = username;
    this.age = age;
    this.active = active;
}

User.prototype.readData = function (inp) {
    this.username = inp.readUTF();
    this.age = inp.readInt();
    this.active = inp.readBoolean();
};

User.prototype.writeData = function (outp) {
    outp.writeUTF(this.username);
    outp.writeInt(this.age);
    outp.writeBoolean(this.active);
};

// Factory id of this and its cluster side counterpart should match.
User.prototype.getFactoryId = function () {
    return 1;
};

// Class id of this and its cluster side counterpart should match.
User.prototype.getClassId = function () {
    return 1;
};
