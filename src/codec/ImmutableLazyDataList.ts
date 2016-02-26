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
        return this.response.size();
    }
    public getItem(index : number) : any {
        var element = this.response.getItem(index);
        var result : any = {};
        result.key = this.toObjectFunction(element.key);
        result.value = this.toObjectFunction(element.value);
        return result;
    }
    public populate() : any {
        //TODO
    }

    public equal() : boolean {
        //TODO
        return false;
    }

}
export = ImmutableLazyDataList
