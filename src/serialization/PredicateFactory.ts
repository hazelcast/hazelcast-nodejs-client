import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from './Serializable';
import {DataInput, DataOutput} from './Data';
import {Predicate} from '../core/Predicate';
export const PREDICATE_FACTORY_ID = -32;
export abstract class AbstractPredicate implements Predicate {

    abstract readData(input: DataInput): any;

    abstract writeData(output: DataOutput): void;

    getFactoryId(): number {
        return PREDICATE_FACTORY_ID;
    }

    abstract getClassId(): number;
}

export class PredicateFactory implements IdentifiedDataSerializableFactory {

    private idToConstructorMap: {[id: number]: FunctionConstructor } = {};

    constructor(allPredicates: any) {
        for (var pred in allPredicates) {
            //TODO accessing getClassId from prototype of uninitialized member function is not elegant.
            this.idToConstructorMap[(<any>allPredicates[pred].prototype).getClassId()] = allPredicates[pred];
        }
    }

    create(type: number): IdentifiedDataSerializable {
        if (this.idToConstructorMap[type]) {
            return <any>(new this.idToConstructorMap[type]());
        } else {
            throw new RangeError(`There is no default predicate with id ${type}.`);
        }
    }
}
