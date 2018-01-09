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

import {IdentifiedDataSerializable} from '../serialization/Serializable';
import {
    SqlPredicate, AndPredicate, FalsePredicate, BetweenPredicate, EqualPredicate,
    GreaterLessPredicate, LikePredicate, ILikePredicate, InPredicate, InstanceOfPredicate, NotEqualPredicate, NotPredicate,
    OrPredicate, RegexPredicate, TruePredicate, PagingPredicate
} from '../serialization/DefaultPredicates';
import {Comparator} from './Comparator';
export interface Predicate extends IdentifiedDataSerializable {
}

export function sql(str: string): Predicate {
    return new SqlPredicate(str);
}

export function and(...predicates: Predicate[]) {
    return new AndPredicate(...predicates);
}

export function isBetween(field: string, from: any, to: any) {
    return new BetweenPredicate(field, from, to);
}

export function isFalse() {
    return FalsePredicate.INSTANCE;
}

export function isEqualTo(field: string, value: any) {
    return new EqualPredicate(field, value);
}

export function greaterThan(field: string, value: any) {
    return new GreaterLessPredicate(field, value, false, false);
}

export function greaterEqual(field: string, value: any) {
    return new GreaterLessPredicate(field, value, true, false);
}

export function lessThan(field: string, value: any) {
    return new GreaterLessPredicate(field, value, false, true);
}

export function lessEqual(field: string, value: any) {
    return new GreaterLessPredicate(field, value, true, true);
}

export function like(field: string, expr: string) {
    return new LikePredicate(field, expr);
}

export function ilike(field: string, expr: string) {
    return new ILikePredicate(field, expr);
}

export function inPredicate(field: string, ...values: any[]) {
    return new InPredicate(field, ...values);
}

export function instanceOf(className: string) {
    return new InstanceOfPredicate(className);
}

export function notEqual(field: string, value: any) {
    return new NotEqualPredicate(field, value);
}

export function not(predic: Predicate) {
    return new NotPredicate(predic);
}

export function or(...predicates: Predicate[]) {
    return new OrPredicate(...predicates);
}

export function regex(field: string, reg: string) {
    return new RegexPredicate(field, reg);
}

export function truePredicate() {
    return TruePredicate.INSTANCE;
}

export function falsePredicate() {
    return FalsePredicate.INSTANCE;
}

export function paging(predicate: Predicate, pageSize: number, comparator: Comparator = null) {
    return new PagingPredicate(predicate, pageSize, comparator);
}

export enum IterationType {
    KEY,
    VALUE,
    ENTRY
}
