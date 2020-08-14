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
    PagingPredicateImpl,
    RegexPredicate,
    SqlPredicate,
    TruePredicate,
} from '../serialization/DefaultPredicates';
import {IdentifiedDataSerializable} from '../serialization/Serializable';
import {Comparator} from './Comparator';

/**
 * Specifies conditions for entry lookup during iteration over a Map.
 */
export interface Predicate extends IdentifiedDataSerializable {
}

/**
 * This interface is a special Predicate which helps to get a page-by-page
 * result of a query. It can be constructed with a page-size, an inner
 * predicate for filtering, and a comparator for sorting.
 */
export interface PagingPredicate extends Predicate {

    /**
     * Sets the page value to next page.
     */
    nextPage(): PagingPredicate;

    /**
     * Sets the page value to previous page.
     */
    previousPage(): PagingPredicate;

    /**
     * Returns the current page value.
     */
    getPage(): number;

    /**
     * Sets the current page value.
     *
     * @param page page number
     */
    setPage(page: number): PagingPredicate;

    /**
     * Returns the page size.
     */
    getPageSize(): number;

    /**
     * Retrieve the anchor object which is the last value object on the
     * previous page.
     *
     * Note: This method will return "null" anchor on the first page of the query
     * result or if the predicate was not applied for the previous page number.
     */
    getAnchor(): [number, [any, any]];

    /**
     * Returns the comparator used by this predicate (if any).
     */
    getComparator(): Comparator;

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

export function not(predicate: Predicate): Predicate {
    return new NotPredicate(predicate);
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

export function paging(predicate: Predicate, pageSize: number, comparator: Comparator = null): PagingPredicate {
    return new PagingPredicateImpl(predicate, pageSize, comparator);
}

/**
 * Iteration type.
 * @internal
 */
export enum IterationType {

    /**
     * Iterate over keys.
     */
    KEY = 'KEY',

    /**
     * Iterate over values.
     */
    VALUE = 'VALUE',

    /**
     * Iterate over whole entry (so key and value).
     */
    ENTRY = 'ENTRY',

}

/** @internal */
export const iterationTypeToId = (type: IterationType): number => {
    switch (type) {
        case IterationType.KEY:
            return 0;
        case IterationType.VALUE:
            return 1;
        case IterationType.ENTRY:
            return 2;
        default:
            throw new TypeError('Unexpected type value: ' + type);
    }
}

/** @internal */
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
