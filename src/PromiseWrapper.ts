/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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
import * as Bluebird from 'bluebird';

class PromiseWrapper<R> extends Bluebird<R> {
    //all bluebird methods
}

module PromiseWrapper {
    export function defer<T>(): Bluebird.Resolver<T> {
        let resolve, reject;
        let promise = new Bluebird<T>(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        let resolver: Bluebird.Resolver<T> = <Bluebird.Resolver<T>>{};
        resolver.resolve = resolve;
        resolver.reject = reject;
        resolver.promise = promise;
        return resolver;
    }

    export import Resolver = Bluebird.Resolver;
}

export = PromiseWrapper;
