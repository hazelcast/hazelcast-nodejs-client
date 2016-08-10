import {Data} from './Data';
export function deserializeEntryList<K, V>(toObject: Function, entrySet: [Data, Data][]): [K, V][] {
    var deserializedSet: [K, V][] = [];
    entrySet.forEach(function(entry) {
        deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
    });
    return deserializedSet;
}


export function serializeList(toData: Function, input: Array<any>): Array<Data> {
    return input.map((each) => {
        return toData(each);
    });
}
