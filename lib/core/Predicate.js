"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryConstants = exports.iterationTypeToId = exports.IterationType = exports.paging = exports.alwaysFalse = exports.alwaysTrue = exports.regex = exports.or = exports.not = exports.notEqual = exports.instanceOf = exports.inPredicate = exports.ilike = exports.like = exports.lessEqual = exports.lessThan = exports.greaterEqual = exports.greaterThan = exports.equal = exports.between = exports.and = exports.sql = void 0;
const DefaultPredicates_1 = require("../serialization/DefaultPredicates");
function sql(str) {
    return new DefaultPredicates_1.SqlPredicate(str);
}
exports.sql = sql;
function and(...predicates) {
    return new DefaultPredicates_1.AndPredicate(...predicates);
}
exports.and = and;
function between(field, from, to) {
    return new DefaultPredicates_1.BetweenPredicate(field, from, to);
}
exports.between = between;
function equal(field, value) {
    return new DefaultPredicates_1.EqualPredicate(field, value);
}
exports.equal = equal;
function greaterThan(field, value) {
    return new DefaultPredicates_1.GreaterLessPredicate(field, value, false, false);
}
exports.greaterThan = greaterThan;
function greaterEqual(field, value) {
    return new DefaultPredicates_1.GreaterLessPredicate(field, value, true, false);
}
exports.greaterEqual = greaterEqual;
function lessThan(field, value) {
    return new DefaultPredicates_1.GreaterLessPredicate(field, value, false, true);
}
exports.lessThan = lessThan;
function lessEqual(field, value) {
    return new DefaultPredicates_1.GreaterLessPredicate(field, value, true, true);
}
exports.lessEqual = lessEqual;
function like(field, expr) {
    return new DefaultPredicates_1.LikePredicate(field, expr);
}
exports.like = like;
function ilike(field, expr) {
    return new DefaultPredicates_1.ILikePredicate(field, expr);
}
exports.ilike = ilike;
function inPredicate(field, ...values) {
    return new DefaultPredicates_1.InPredicate(field, ...values);
}
exports.inPredicate = inPredicate;
function instanceOf(className) {
    return new DefaultPredicates_1.InstanceOfPredicate(className);
}
exports.instanceOf = instanceOf;
function notEqual(field, value) {
    return new DefaultPredicates_1.NotEqualPredicate(field, value);
}
exports.notEqual = notEqual;
function not(predicate) {
    return new DefaultPredicates_1.NotPredicate(predicate);
}
exports.not = not;
function or(...predicates) {
    return new DefaultPredicates_1.OrPredicate(...predicates);
}
exports.or = or;
function regex(field, reg) {
    return new DefaultPredicates_1.RegexPredicate(field, reg);
}
exports.regex = regex;
function alwaysTrue() {
    return DefaultPredicates_1.TruePredicate.INSTANCE;
}
exports.alwaysTrue = alwaysTrue;
function alwaysFalse() {
    return DefaultPredicates_1.FalsePredicate.INSTANCE;
}
exports.alwaysFalse = alwaysFalse;
function paging(predicate, pageSize, comparator = null) {
    return new DefaultPredicates_1.PagingPredicateImpl(predicate, pageSize, comparator);
}
exports.paging = paging;
/**
 * Iteration type.
 * @internal
 */
var IterationType;
(function (IterationType) {
    /**
     * Iterate over keys.
     */
    IterationType["KEY"] = "KEY";
    /**
     * Iterate over values.
     */
    IterationType["VALUE"] = "VALUE";
    /**
     * Iterate over whole entry (so key and value).
     */
    IterationType["ENTRY"] = "ENTRY";
})(IterationType = exports.IterationType || (exports.IterationType = {}));
/** @internal */
const iterationTypeToId = (type) => {
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
};
exports.iterationTypeToId = iterationTypeToId;
/** @internal */
var QueryConstants;
(function (QueryConstants) {
    /**
     * Attribute name of the key.
     */
    QueryConstants["KEY_ATTRIBUTE_NAME"] = "__key";
    /**
     * Attribute name of the "this".
     */
    QueryConstants["THIS_ATTRIBUTE_NAME"] = "this";
})(QueryConstants = exports.QueryConstants || (exports.QueryConstants = {}));
//# sourceMappingURL=Predicate.js.map