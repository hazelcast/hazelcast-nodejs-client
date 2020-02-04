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

import {
    AndPredicate,
    BetweenPredicate,
    EqualPredicate,
    FalsePredicate,
    GreaterLessPredicate,
    ILikePredicate,
    InPredicate,
    InstanceOfPredicate,
    LikePredicate,
    NotEqualPredicate,
    NotPredicate,
    OrPredicate,
    PagingPredicate,
    RegexPredicate,
    SqlPredicate,
    TruePredicate,
} from '../serialization/DefaultPredicates';
import {IdentifiedDataSerializable} from '../serialization/Serializable';
import {Comparator} from './Comparator';

export interface Predicate extends IdentifiedDataSerializable {
}

export function sql(str: string): Predicate {
    return new SqlPredicate(str);
}

export function and(...predicates: Predicate[]): Predicate {
    return new AndPredicate(...predicates);
}

export function between(field: string, from: any, to: any): Predicate {
    return new BetweenPredicate(field, from, to);
}

export function equal(field: string, value: any): Predicate {
    return new EqualPredicate(field, value);
}

export function greaterThan(field: string, value: any): Predicate {
    return new GreaterLessPredicate(field, value, false, false);
}

export function greaterEqual(field: string, value: any): Predicate {
    return new GreaterLessPredicate(field, value, true, false);
}

export function lessThan(field: string, value: any): Predicate {
    return new GreaterLessPredicate(field, value, false, true);
}

export function lessEqual(field: string, value: any): Predicate {
    return new GreaterLessPredicate(field, value, true, true);
}

export function like(field: string, expr: string): Predicate {
    return new LikePredicate(field, expr);
}

export function ilike(field: string, expr: string): Predicate {
    return new ILikePredicate(field, expr);
}

export function inPredicate(field: string, ...values: any[]): Predicate {
    return new InPredicate(field, ...values);
}

export function instanceOf(className: string): Predicate {
    return new InstanceOfPredicate(className);
}

export function notEqual(field: string, value: any): Predicate {
    return new NotEqualPredicate(field, value);
}

export function not(predic: Predicate): Predicate {
    return new NotPredicate(predic);
}

export function or(...predicates: Predicate[]): Predicate {
    return new OrPredicate(...predicates);
}

export function regex(field: string, reg: string): Predicate {
    return new RegexPredicate(field, reg);
}

export function alwaysTrue(): Predicate {
    return TruePredicate.INSTANCE;
}

export function alwaysFalse(): Predicate {
    return FalsePredicate.INSTANCE;
}

export function paging(predicate: Predicate, pageSize: number, comparator: Comparator = null): Predicate {
    return new PagingPredicate(predicate, pageSize, comparator);
}

export enum IterationType {
    KEY,
    VALUE,
    ENTRY,
}

export enum QueryConstants {
    /**
     * Attribute name of the key.
     */
    KEY_ATTRIBUTE_NAME = '__key',

    /**
     * Attribute name of the "this".
     */
    THIS_ATTRIBUTE_NAME = 'this',
}
