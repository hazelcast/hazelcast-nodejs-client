'use strict';

class EmployeeDTO {
    constructor(age, id) {
        this.age = age; // int32
        this.id = id; // int64
    }
}

class EmployeeDTOSerializer {
    constructor() {
        this.hzClassName = 'EmployeeDTO'; // used to match a js object to serialize with this serializer
        this.hzTypeName = 'example.serialization.EmployeeDTO'; // used to match schema's typeName with serializer
    }

    read(reader) {
        const age = reader.readInt32('age');
        const id = reader.readInt64('id');
        return new EmployeeDTO(age, id);
    }

    write(writer, instance) {
        writer.writeInt32('age', instance.age);
        writer.writeInt64('id', instance.id);
    }
}

module.exports.EmployeeDTO = EmployeeDTO;
module.exports.EmployeeDTOSerializer = EmployeeDTOSerializer;
