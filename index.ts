'use strict';

import {Client, CompactReader, CompactSerializer, CompactWriter} from './lib'
import * as Long from 'long';

class EmployeeDTO {
    age: number;
    id: Long;

    constructor(age: number, id: Long) {
        this.age = age;
        this.id = id;
    }
}

class EmployeeDTOSerializer implements CompactSerializer<EmployeeDTO> {
    hzClass = EmployeeDTO;

    read(reader: CompactReader): EmployeeDTO {
        const age = reader.readInt32('age');
        const id = reader.readInt64('id');

        return new EmployeeDTO(age, id);
    }

    write(writer: CompactWriter, instance: EmployeeDTO): void {
        writer.writeInt32('age', instance.age);
        writer.writeInt64('id', instance.id);
    }

}

async function main() {
    const client = await Client.newHazelcastClient({
        serialization: {
            compactSerializers: [new EmployeeDTOSerializer()]
        }
    });

    const map = await client.getMap('test');
    const record = await map.get(Long.fromNumber(1));
    console.log(record);
    console.log(record.constructor.name);
}

main().catch(console.error);
