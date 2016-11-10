import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from '../../serialization/Serializable';
import {DataInput, DataOutput, Data} from '../../serialization/Data';
import Address = require('../../Address');
import * as Long from 'long';

export const RELIABLE_TOPIC_MESSAGE_FACTORY_ID = -18;
export const RELIABLE_TOPIC_CLASS_ID = 2;

export class RawTopicMessage implements IdentifiedDataSerializable {


    publishTime: Long;
    publisherAddress: Address;
    payload: Data;

    readData(input: DataInput): any {
        this.publishTime = input.readLong();
        this.publisherAddress = input.readObject();
        this.payload = input.readData();
    }

    writeData(output: DataOutput): void {
        output.writeLong(this.publishTime);
        output.writeObject(this.publisherAddress);
        output.writeData(this.payload);
    }

    getFactoryId(): number {
        return RELIABLE_TOPIC_MESSAGE_FACTORY_ID;
    }

    getClassId(): number {
        return RELIABLE_TOPIC_CLASS_ID;
    }
}

export class ReliableTopicMessageFactory implements IdentifiedDataSerializableFactory {
    create(type: number): IdentifiedDataSerializable {

        if (type === RELIABLE_TOPIC_CLASS_ID) {
            return new RawTopicMessage();
        }

        return null;
    }
}
