/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* tslint:disable:no-bitwise */

import {Data} from '../serialization/Data';

class ImmutableLazyDataList {

    private response: any;
    private toObjectFunction: any;

    constructor(response: any, toObjectFunction: (data: Data) => any) {
        this.response = response;
        this.toObjectFunction = toObjectFunction;
    }

    public contains(item: any): boolean {
        return this.response.contains(item);
    }

    public size(): number {
        return this.response.length;
    }

    public get(index: number): any {
        const element = this.response[index];
        return [element.key, element.value];
    }

    public populate(): any {
        // TODO
    }

    public equal(): boolean {
        // TODO
        return false;
    }

}

export = ImmutableLazyDataList;
