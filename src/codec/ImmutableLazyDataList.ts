/* tslint:disable:no-bitwise */

import {Data} from '../serialization/Data';
class ImmutableLazyDataList {

    private response: any;
    private toObjectFunction: any;

    constructor(response: any, toObjectFunction: (data: Data) => any ) {
        this.response = response;
        this.toObjectFunction = toObjectFunction;
    }

    public contains(item: any): boolean {
        return this.response.contains(item);
    }

    public size(): number {
        return this.response.length;
    }
    public get(index : number) : any {
        var element = this.response[index];
        return [element.key, element.value];
    }
    public populate() : any {
        //TODO
    }

    public equal() : boolean {
        //TODO
        return false;
    }

}
export = ImmutableLazyDataList;
