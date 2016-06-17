var Client = require('../.').Client;

var addPerson = function(list, val){
  return   list.add(val).then(function(){
        console.log('Added value: ' + val);
  });
};

var addPersonTo = function(list, val, index){
    return   list.add(val, index).then(function(previousVal){
        console.log('Added value to the ' + JSON.stringify(index) + 'th index: ' + val);
    });
};

var removePerson = function(list, val){
    return list.remove(val).then(function(){
         console.log('Removed value: ' + val);
    });
};

var removePersonAt = function(list, index){
    return list.removeAt(index).then(function(previousVal){
        console.log('Removed value: ' + previousVal);
    });
};

var shutDownHz = function(client){
      return client.shutdown();
};

Client.newHazelcastClient().then(function(hazelcastClient){
    var list = hazelcastClient.getList('people');
    var john = 'John';
    var jane = 'Jane';
    var thomas = 'Thomas';

    //adds the value to the end of the list
    addPerson(list, john)
        .then(function(){
            //adds the value to the specific index
            return addPersonTo(list, jane, 2);
        })
        .then(function(){
            return addPerson(list, thomas);
        })
        .then(function(){
            //removes the given value in the list
            return removePerson(list, jane);
        })
        .then(function(){
            //removes the value in the list, specified by the index
            return removePersonAt(list, 2);
        })
        .then(function(){
            shutDownHz(hazelcastClient);
        })
});


