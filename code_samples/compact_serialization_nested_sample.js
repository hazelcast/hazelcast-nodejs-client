'use strict';

const {Client} = require('hazelcast-client');

class Address {
    constructor(city, street) {
        this.city = city;
        this.street = street;
    }
}

class Employee {
    constructor(name, age, address) {
        this.name = name;
        this.age = age;
        this.address = address;
    }
}

class AddressSerializer{

    getClass(){
        return Address;
    }

    getTypeName(){
        return 'Address';
    }

    read(reader){
        const city = reader.readString('city');
        const street = reader.readString('street');
        return new Address(city, street);
    }

    write(writer, obj){
        writer.writeString('city', obj.city);
        writer.writeString('street', obj.street);
    }
}

class EmployeeSerializer{

    getClass(){
        return Employee;
    }

    getTypeName(){
        return 'Employee';
    }

    read(reader){
        const name = reader.readString('name');
        const age = reader.readInt32('age');
        const address = reader.readCompact('address');
        return new Employee(name, age, address);

    }

    write(writer, obj) {
        writer.writeString('name', obj.name);
        writer.writeInt32('age', obj.age);
        writer.writeCompact('address', obj.address);
    }
}

(async () => {
    try {
        const client = await Client.newHazelcastClient({
            serialization: {
                compact: {
                    serializers: [new AddressSerializer(), new EmployeeSerializer()]
                }
            }
        });

        const map = await client.getMap('employees');

        await map.put(
            0,
            new Employee(
                'John Doe',
                42,
                new Address(
                    'Cambridge',
                    '3487 Cedar Lane'
                )
            )
        );

        const result = await map.get(0);
        console.log(result);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
