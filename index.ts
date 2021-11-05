'use strict';

import {Client, CompactReader, CompactSerializer, CompactWriter} from './lib'
import * as Long from 'long';

class EmployeeDTO {
    age: number;
    id: number;
    isFired: boolean;
    isHired: boolean;
    rank: number;

    constructor(age: number, id: number) {
        this.age = age;
        this.id = id;
        this.isFired = false;
        this.isHired = true;
        this.rank = age;
    }
}

class EmployeeDTOSerializer implements CompactSerializer<EmployeeDTO> {
    hzClassName = 'EmployeeDTO';

    read(reader: CompactReader): EmployeeDTO {
        const age = reader.readInt('age');
        const id = reader.readInt('id');

        return new EmployeeDTO(age, id);
    }

    write(writer: CompactWriter, instance: EmployeeDTO): void {
        writer.writeInt('age', instance.age);
        writer.writeInt('id', instance.id);
    }

}

async function main() {
    const client = await Client.newHazelcastClient({
        serialization: {
            compactSerializers: [new EmployeeDTOSerializer()]
        }
    });

    const map = await client.getMap('test');
    await map.delete(Long.fromNumber(1));
    await map.put(Long.fromNumber(1), new EmployeeDTO(1, 2));
}

main().catch(console.error);
