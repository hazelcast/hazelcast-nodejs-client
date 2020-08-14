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
    Aggregator,
    CountAggregator,
    DoubleAverageAggregator,
    DoubleSumAggregator,
    FixedPointSumAggregator,
    FloatingPointSumAggregator,
    IntegerAverageAggregator,
    IntegerSumAggregator,
    LongAverageAggregator,
    LongSumAggregator,
    MaxAggregator,
    MinAggregator,
    NumberAverageAggregator,
} from './Aggregator';

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that counts the input values.
 * Accepts nulls as input values.
 * Aggregation result type `Long`.
 */
export function count(attributePath?: string): Aggregator<Long> {
    return new CountAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Double input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export function doubleAvg(attributePath?: string): Aggregator<number> {
    return new DoubleAverageAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Double input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export function doubleSum(attributePath?: string): Aggregator<number> {
    return new DoubleSumAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `number`.
 */
export function numberAvg(attributePath?: string): Aggregator<number> {
    return new NumberAverageAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `Long`.
 */
export function fixedPointSum(attributePath?: string): Aggregator<Long> {
    return new FixedPointSumAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `number`.
 */
export function floatingPointSum(attributePath?: string): Aggregator<number> {
    return new FloatingPointSumAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @param <R> type of the input object.
 * @return an aggregator that calculates the max of the input values.
 * Accepts `null` input values.
 * Aggregation result type is `R`.
 */
export function max<R>(attributePath?: string): Aggregator<R> {
    return new MaxAggregator<R>(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @param <R> type of the input object.
 * @return an aggregator that calculates the min of the input values.
 * Accepts `null` input values.
 * Aggregation result type is `R`.
 */
export function min<R>(attributePath?: string): Aggregator<R> {
    return new MinAggregator<R>(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Integer input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export function integerAvg(attributePath?: string): Aggregator<number> {
    return new IntegerAverageAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Integer input values (primitive and boxed).
 * Aggregation result type is `Long`.
 */
export function integerSum(attributePath?: string): Aggregator<Long> {
    return new IntegerSumAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Long input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export function longAvg(attributePath?: string): Aggregator<number> {
    return new LongAverageAggregator(attributePath);
}

/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Long input values (primitive and boxed).
 * Aggregation result type is `Long`.
 */
export function longSum(attributePath?: string): Aggregator<Long> {
    return new LongSumAggregator(attributePath);
}
