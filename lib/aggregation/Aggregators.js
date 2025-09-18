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
exports.distinct = exports.longSum = exports.longAvg = exports.integerSum = exports.integerAvg = exports.min = exports.max = exports.floatingPointSum = exports.fixedPointSum = exports.numberAvg = exports.doubleSum = exports.doubleAvg = exports.count = void 0;
const Aggregator_1 = require("./Aggregator");
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that counts the input values.
 * Accepts nulls as input values.
 * Aggregation result type `Long`.
 */
function count(attributePath) {
    return new Aggregator_1.CountAggregator(attributePath);
}
exports.count = count;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Double input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
function doubleAvg(attributePath) {
    return new Aggregator_1.DoubleAverageAggregator(attributePath);
}
exports.doubleAvg = doubleAvg;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Double input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
function doubleSum(attributePath) {
    return new Aggregator_1.DoubleSumAggregator(attributePath);
}
exports.doubleSum = doubleSum;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `number`.
 */
function numberAvg(attributePath) {
    return new Aggregator_1.NumberAverageAggregator(attributePath);
}
exports.numberAvg = numberAvg;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `Long`.
 */
function fixedPointSum(attributePath) {
    return new Aggregator_1.FixedPointSumAggregator(attributePath);
}
exports.fixedPointSum = fixedPointSum;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `number`.
 */
function floatingPointSum(attributePath) {
    return new Aggregator_1.FloatingPointSumAggregator(attributePath);
}
exports.floatingPointSum = floatingPointSum;
/**
 * @param attributePath extracts values from this path if given
 * @param <R> type of the input object.
 * @return an aggregator that calculates the max of the input values.
 * Accepts `null` input values.
 * Aggregation result type is `R`.
 */
function max(attributePath) {
    return new Aggregator_1.MaxAggregator(attributePath);
}
exports.max = max;
/**
 * @param attributePath extracts values from this path if given
 * @param <R> type of the input object.
 * @return an aggregator that calculates the min of the input values.
 * Accepts `null` input values.
 * Aggregation result type is `R`.
 */
function min(attributePath) {
    return new Aggregator_1.MinAggregator(attributePath);
}
exports.min = min;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Integer input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
function integerAvg(attributePath) {
    return new Aggregator_1.IntegerAverageAggregator(attributePath);
}
exports.integerAvg = integerAvg;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Integer input values (primitive and boxed).
 * Aggregation result type is `Long`.
 */
function integerSum(attributePath) {
    return new Aggregator_1.IntegerSumAggregator(attributePath);
}
exports.integerSum = integerSum;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Long input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
function longAvg(attributePath) {
    return new Aggregator_1.LongAverageAggregator(attributePath);
}
exports.longAvg = longAvg;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Long input values (primitive and boxed).
 * Aggregation result type is `Long`.
 */
function longSum(attributePath) {
    return new Aggregator_1.LongSumAggregator(attributePath);
}
exports.longSum = longSum;
/**
 * @param attributePath extracts values from this path if given.
 * @param <R> type of the return object.
 * @return an aggregator that calculates the distinct set of input values.
 * Accepts null input values.
 * Aggregation result type is a Set of R.
 */
function distinct(attributePath) {
    return new Aggregator_1.DistinctValuesAggregator();
}
exports.distinct = distinct;
//# sourceMappingURL=Aggregators.js.map