/*
 * Copyright (c) 2008-2026, Hazelcast, Inc. All Rights Reserved.
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

import Long from '../long';

/**
 * JavaScript exposes a single numeric type (`number`, an IEEE-754 double), while Hazelcast
 * distinguishes several numeric wire types: `byte`, `short`, `int`, `long`, `float` and `double`.
 * A plain JS `number` is always serialized as a 64-bit float (`double`).
 *
 * The factory functions in this module let you tag an individual value with its intended numeric
 * type. A value produced by one of these functions is serialized using that specific wire type,
 * independent of the default `double` representation used for plain numbers.
 */

/**
 * Base class for all typed number wrappers. Instances are value types: two instances are logically
 * equal when their type and value match, even though they are distinct object references.
 *
 * @internal
 */
abstract class TypedNumberBase<T> {
    /** The numeric content (`Long` for {@link Int64}, a plain `number` otherwise). */
    readonly value: T;

    /** Stable identifier of the type, e.g. `'int32'`. */
    readonly typeName: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(typeName: string, value: T) {
        this.typeName = typeName;
        this.value = value;
        // Reinforce the value-type semantics of these wrappers.
        Object.freeze(this);
    }

    /**
     * Returns `true` when `other` is the same wrapper type with an equal value.
     */
    equals(other: unknown): boolean {
        return other instanceof (this.constructor as any) && (other as TypedNumberBase<T>).value === this.value;
    }

    /**
     * Human readable form, e.g. `"int32(5)"`.
     */
    toString(): string {
        return `${this.typeName}(${this.value})`;
    }
}

/**
 * A value that is serialized as a Hazelcast `byte` (8-bit signed integer).
 * Create instances with {@link int8}.
 */
export class Int8 extends TypedNumberBase<number> {
    constructor(value: number) {
        super('int8', value);
    }
}

/**
 * A value that is serialized as a Hazelcast `short` (16-bit signed integer).
 * Create instances with {@link int16}.
 */
export class Int16 extends TypedNumberBase<number> {
    constructor(value: number) {
        super('int16', value);
    }
}

/**
 * A value that is serialized as a Hazelcast `int` (32-bit signed integer).
 * Create instances with {@link int32}.
 */
export class Int32 extends TypedNumberBase<number> {
    constructor(value: number) {
        super('int32', value);
    }
}

/**
 * A value that is serialized as a Hazelcast `long` (64-bit signed integer).
 * Create instances with {@link int64}. The underlying value is a {@link Long}.
 */
export class Int64 extends TypedNumberBase<Long> {
    constructor(value: Long) {
        super('int64', value);
    }

    /**
     * Returns `true` when `other` is an {@link Int64} with an equal value.
     */
    equals(other: unknown): boolean {
        return other instanceof Int64 && this.value.equals((other as Int64).value);
    }
}

/**
 * A value that is serialized as a Hazelcast `float` (32-bit IEEE-754 single precision).
 * Create instances with {@link float32}.
 */
export class Float32 extends TypedNumberBase<number> {
    constructor(value: number) {
        super('float32', value);
    }
}

/**
 * A value that is serialized as a Hazelcast `double` (64-bit IEEE-754 double precision).
 * Create instances with {@link float64}.
 */
export class Float64 extends TypedNumberBase<number> {
    constructor(value: number) {
        super('float64', value);
    }
}

const INT64_MAX_BIGINT = BigInt('9223372036854775807');
const INT64_MIN_BIGINT = BigInt('-9223372036854775808');

/** @internal */
function assertIntegerInRange(typeName: string, value: number, min: number, max: number): void {
    if (!Number.isInteger(value)) {
        throw new RangeError(`${value} is not an integer`);
    }
    if (value < min || value > max) {
        throw new RangeError(`${value} is out of the ${typeName} range [${min}, ${max}]`);
    }
}

/** @internal */
function assertFinite(typeName: string, value: number): void {
    if (!Number.isFinite(value)) {
        throw new RangeError(`${value} must be finite for ${typeName}`);
    }
}

/**
 * Creates a value that is serialized as a Hazelcast `byte` (int8).
 *
 * The value must be an integer within `[-128, 127]`.
 *
 * @param value the number to wrap
 * @throws RangeError if `value` is not an integer or is out of range.
 */
export function int8(value: number): Int8 {
    assertIntegerInRange('int8', value, -128, 127);
    return new Int8(value);
}

/**
 * Creates a value that is serialized as a Hazelcast `short` (int16).
 *
 * The value must be an integer within `[-32768, 32767]`.
 *
 * @param value the number to wrap
 * @throws RangeError if `value` is not an integer or is out of range.
 */
export function int16(value: number): Int16 {
    assertIntegerInRange('int16', value, -32768, 32767);
    return new Int16(value);
}

/**
 * Creates a value that is serialized as a Hazelcast `int` (int32).
 *
 * The value must be an integer within `[-2147483648, 2147483647]`.
 *
 * @param value the number to wrap
 * @throws RangeError if `value` is not an integer or is out of range.
 */
export function int32(value: number): Int32 {
    assertIntegerInRange('int32', value, -2147483648, 2147483647);
    return new Int32(value);
}

/**
 * Creates a value that is serialized as a Hazelcast `long` (int64).
 *
 * Accepts a `number`, a `bigint`, or an existing {@link Long}. The result always holds a `Long`.
 *
 * - A `number` must be an integer whose magnitude does not exceed `Number.MAX_SAFE_INTEGER`
 *   (`2^53 - 1`), because larger magnitudes cannot be represented exactly.
 * - A `bigint` must be within the signed 64-bit range `[-2^63, 2^63 - 1]`.
 * - A `Long` is used as-is.
 *
 * @param value the value to wrap
 * @throws RangeError if the value cannot be represented exactly in a 64-bit integer.
 */
export function int64(value: number | bigint | Long): Int64 {
    let long: Long;
    if (typeof value === 'number') {
        if (!Number.isInteger(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
            throw new RangeError(
                `${value} is not exactly representable as an int64. `
                + 'Use a bigint or Long for values beyond the safe integer range.');
        }
        long = Long.fromBigInt(BigInt(value));
    } else if (typeof value === 'bigint') {
        if (value > INT64_MAX_BIGINT || value < INT64_MIN_BIGINT) {
            throw new RangeError(`${value} is out of the int64 range [${INT64_MIN_BIGINT}, ${INT64_MAX_BIGINT}]`);
        }
        long = Long.fromBigInt(value);
    } else if (Long.isLong(value)) {
        long = value;
    } else {
        throw new RangeError(`int64() expects a number, bigint or Long, got ${typeof value}`);
    }
    return new Int64(long);
}

/**
 * Creates a value that is serialized as a Hazelcast `float` (float32).
 *
 * The value must be finite. It is rounded to single precision on the wire; this is expected and
 * not an error.
 *
 * @param value the number to wrap
 * @throws RangeError if `value` is not finite (`NaN`, `Infinity`, `-Infinity`).
 */
export function float32(value: number): Float32 {
    assertFinite('float32', value);
    return new Float32(value);
}

/**
 * Creates a value that is serialized as a Hazelcast `double` (float64).
 *
 * The value must be finite. This is the same representation a plain (unwrapped) number always uses,
 * so `float64(x)` is byte-identical to storing the plain number `x`.
 *
 * @param value the number to wrap
 * @throws RangeError if `value` is not finite (`NaN`, `Infinity`, `-Infinity`).
 */
export function float64(value: number): Float64 {
    assertFinite('float64', value);
    return new Float64(value);
}
