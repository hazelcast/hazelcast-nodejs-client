import {IdentifiedDataSerializableFactory, IdentifiedDataSerializable} from './serialization/Serializable';
import Address = require('./Address');

export const ADDRESS_CLASS_ID = 1;
export const CLUSTER_DATA_FACTORY_ID = 0;

export class ClusterDataFactory implements IdentifiedDataSerializableFactory {

    create(type: number): IdentifiedDataSerializable {

        if (type === ADDRESS_CLASS_ID) {
            return new Address();
        }

        return null;
    }
}
