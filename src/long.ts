/**
 * @license
 * Copyright 2009 The Closure Library Authors
 * Copyright 2020 Daniel Wirtz / The long.js Authors.
 * Copyright 2026 Hazelcast, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


/**
 * Any value or object that either is or can be converted to a Long.
 */
export type LongLike =
  | Long
  | number
  | bigint
  | string
  | { low: number; high: number; unsigned: boolean };

// --- Numeric constants (no dependency on Long) ---

const TWO_PWR_16_DBL = 1 << 16;
const TWO_PWR_24_DBL = 1 << 24;
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
const TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
const TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

const pow_dbl = Math.pow;

// --- Caches ---

const INT_CACHE: Record<number, Long> = {};
const UINT_CACHE: Record<number, Long> = {};

// --- Helper functions ---

function isLong(obj: any): obj is Long {
  return (obj && obj['__isLong__']) === true;
}

function fromBits(lowBits: number, highBits: number, unsigned = false): Long {
  return new Long(lowBits, highBits, unsigned);
}

function fromInt(value: number, unsigned = false): Long {
  let obj: Long;
  let cachedObj: Long | undefined;
  let cache: boolean;
  if (unsigned) {
    value >>>= 0;
    if ((cache = 0 <= value && value < 256)) {
      cachedObj = UINT_CACHE[value];
      if (cachedObj) {return cachedObj;}
    }
    obj = fromBits(value, 0, true);
    if (cache) {UINT_CACHE[value] = obj;}
    return obj;
  } else {
    value |= 0;
    if ((cache = -128 <= value && value < 128)) {
      cachedObj = INT_CACHE[value];
      if (cachedObj) {return cachedObj;}
    }
    obj = fromBits(value, value < 0 ? -1 : 0, false);
    if (cache) {INT_CACHE[value] = obj;}
    return obj;
  }
}

function fromNumber(value: number, unsigned = false): Long {
  if (isNaN(value)) {return unsigned ? UZERO : ZERO;}
  if (unsigned) {
    if (value < 0) {return UZERO;}
    if (value >= TWO_PWR_64_DBL) {return MAX_UNSIGNED_VALUE;}
  } else {
    if (value <= -TWO_PWR_63_DBL) {return MIN_VALUE;}
    if (value + 1 >= TWO_PWR_63_DBL) {return MAX_VALUE;}
  }
  if (value < 0) {return fromNumber(-value, unsigned).neg();}
  return fromBits(
    value % TWO_PWR_32_DBL | 0,
    (value / TWO_PWR_32_DBL) | 0,
    unsigned,
  );
}

function fromString(str: string, unsigned = false, radix = 10): Long {
  if (str.length === 0) {throw Error('empty string');}
  if (
    str === 'NaN' ||
    str === 'Infinity' ||
    str === '+Infinity' ||
    str === '-Infinity'
  )
    {return unsigned ? UZERO : ZERO;}
  if (radix < 2 || 36 < radix) {throw RangeError('radix');}

  const p = str.indexOf('-');
  if (p > 0) {throw Error('interior hyphen');}
  else if (p === 0) {
    return fromString(str.substring(1), unsigned, radix).neg();
  }

  // Do several (8) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.
  const radixToPower = fromNumber(pow_dbl(radix, 8));

  let result = ZERO;
  for (let i = 0; i < str.length; i += 8) {
    const size = Math.min(8, str.length - i);
    const value = parseInt(str.substring(i, i + size), radix);
    if (size < 8) {
      const power = fromNumber(pow_dbl(radix, size));
      result = result.mul(power).add(fromNumber(value));
    } else {
      result = result.mul(radixToPower);
      result = result.add(fromNumber(value));
    }
  }
  result.unsigned = unsigned;
  return result;
}

function fromValue(val: LongLike, unsigned?: boolean): Long {
  if (typeof val === 'number') {return fromNumber(val, unsigned);}
  if (typeof val === 'string') {return fromString(val, unsigned);}
  // Throws for non-objects, converts non-instanceof Long:
  const v = val as { low: number; high: number; unsigned: boolean };
  return fromBits(
    v.low,
    v.high,
    typeof unsigned === 'boolean' ? unsigned : v.unsigned,
  );
}

function ensureLong(val: LongLike): Long {
  if (isLong(val)) {return val;}
  return fromValue(val);
}

// --- The Long class ---

/**
 * A Long class for representing a 64 bit two's-complement integer value.
 */
export class Long {
  /**
   * The low 32 bits as a signed value.
   */
  low: number;

  /**
   * The high 32 bits as a signed value.
   */
  high: number;

  /**
   * Whether unsigned or not.
   */
  unsigned: boolean;

  /**
   * An indicator used to reliably determine if an object is a Long or not.
   */
  private __isLong__ = true;

  /**
   * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as signed integers.
   * @param low The low (signed) 32 bits of the long
   * @param high The high (signed) 32 bits of the long
   * @param unsigned Whether unsigned or not, defaults to signed
   */
  constructor(low: number, high = 0, unsigned = false) {
    this.low = low | 0;
    this.high = high | 0;
    this.unsigned = !!unsigned;
  }

  /**
   * Tests if the specified object is a Long.
   */
  static isLong(obj: any): obj is Long {
    return (obj && obj['__isLong__']) === true;
  }

  // --- Static constants (assigned after class definition) ---

  static ZERO: Long = null as any;
  static UZERO: Long = null as any;
  static ONE: Long = null as any;
  static UONE: Long = null as any;
  static NEG_ONE: Long = null as any;
  static MAX_VALUE: Long = null as any;
  static MIN_VALUE: Long = null as any;
  static MAX_UNSIGNED_VALUE: Long = null as any;

  // --- Static factory methods ---

  /**
   * Returns a Long representing the given 32 bit integer value.
   */
  static fromInt(value: number, unsigned = false): Long {
    return fromInt(value, unsigned);
  }

  /**
   * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
   */
  static fromNumber(value: number, unsigned = false): Long {
    return fromNumber(value, unsigned);
  }

  /**
   * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits.
   */
  static fromBits(lowBits: number, highBits: number, unsigned = false): Long {
    return new Long(lowBits, highBits, unsigned);
  }

  /**
   * Returns a Long representation of the given string, written using the specified radix.
   */
  static fromString(
    str: string,
    unsignedOrRadix?: boolean | number,
    radix?: number,
  ): Long {
    let unsigned: boolean;
    if (typeof unsignedOrRadix === 'number') {
      // For goog.math.long compatibility
      radix = unsignedOrRadix;
      unsigned = false;
    } else {
      unsigned = !!unsignedOrRadix;
    }
    return fromString(str, unsigned, radix);
  }

  /**
   * Converts the specified value to a Long using the appropriate from* function for its type.
   */
  static fromValue(val: LongLike, unsigned?: boolean): Long {
    if (typeof val === 'bigint') {return Long.fromBigInt(val, unsigned);}
    return fromValue(val, unsigned);
  }

  /**
   * Creates a Long from its byte representation.
   */
  static fromBytes(bytes: number[], unsigned = false, le = false): Long {
    return le
      ? Long.fromBytesLE(bytes, unsigned)
      : Long.fromBytesBE(bytes, unsigned);
  }

  /**
   * Creates a Long from its little endian byte representation.
   */
  static fromBytesLE(bytes: number[], unsigned = false): Long {
    return new Long(
      bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24),
      bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24),
      unsigned,
    );
  }

  /**
   * Creates a Long from its big endian byte representation.
   */
  static fromBytesBE(bytes: number[], unsigned = false): Long {
    return new Long(
      (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7],
      (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3],
      unsigned,
    );
  }

  /**
   * Returns a Long representing the given big integer.
   */
  static fromBigInt(value: bigint, unsigned = false): Long {
    const lowBits = Number(BigInt.asIntN(32, value));
    const highBits = Number(BigInt.asIntN(32, value >> BigInt(32)));
    return new Long(lowBits, highBits, unsigned);
  }

  // --- Instance methods ---

  /**
   * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
   */
  toInt(): number {
    return this.unsigned ? this.low >>> 0 : this.low;
  }

  /**
   * Converts the Long to the nearest floating-point representation of this value (double, 53 bit mantissa).
   */
  toNumber(): number {
    if (this.unsigned)
      {return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);}
    return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
  }

  /**
   * Converts the Long to a string written in the specified radix.
   */
  toString(radix = 10): string {
    if (radix < 2 || 36 < radix) {throw RangeError('radix');}
    if (this.isZero()) {return '0';}
    if (this.isNegative()) {
      // Unsigned Longs are never negative
      if (this.eq(Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        const radixLong = fromNumber(radix);
        const div = this.div(radixLong);
        const rem1 = div.mul(radixLong).sub(this);
        return div.toString(radix) + rem1.toInt().toString(radix);
      } else {return '-' + this.neg().toString(radix);}
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    const radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned);
    let rem: Long = this.add(0);  // to prevent unexpected aliasing of 'this'
    let result = '';
    const forever = true;
    while (forever) {
      const remDiv = rem.div(radixToPower);
      const intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0;
      let digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {return digits + result;}
      else {
        while (digits.length < 6) {digits = '0' + digits;}
        result = '' + digits + result;
      }
    }
    return '';
  }

  /**
   * Gets the high 32 bits as an unsigned integer.
   */
  getHighBitsUnsigned(): number {
    return this.high >>> 0;
  }

  /**
   * Gets the low 32 bits as an unsigned integer.
   */
  getLowBitsUnsigned(): number {
    return this.low >>> 0;
  }

  /**
   * Tests if this Long's value equals zero.
   */
  isZero(): boolean {
    return this.high === 0 && this.low === 0;
  }

  /**
   * Tests if this Long's value is negative.
   */
  isNegative(): boolean {
    return !this.unsigned && this.high < 0;
  }

  /**
   * Tests if this Long's value is odd.
   */
  isOdd(): boolean {
    return (this.low & 1) === 1;
  }

  /**
   * Tests if this Long's value equals the specified's.
   */
  equals(other: LongLike): boolean {
    const o = ensureLong(other);
    if (
      this.unsigned !== o.unsigned &&
      this.high >>> 31 === 1 &&
      o.high >>> 31 === 1
    )
      {return false;}
    return this.high === o.high && this.low === o.low;
  }

  /** Alias of equals */
  eq(other: LongLike): boolean {
    return this.equals(other);
  }

  /**
   * Tests if this Long's value differs from the specified's.
   */
  notEquals(other: LongLike): boolean {
    return !this.eq(/* validates */ other);
  }

  /**
   * Tests if this Long's value is less than the specified's.
   */
  lessThan(other: LongLike): boolean {
    return this.comp(/* validates */ other) < 0;
  }

  /** Alias of lessThan */
  lt(other: LongLike): boolean {
    return this.lessThan(other);
  }

  /**
   * Tests if this Long's value is greater than the specified's.
   */
  greaterThan(other: LongLike): boolean {
    return this.comp(/* validates */ other) > 0;
  }

  /** Alias of greaterThan */
  gt(other: LongLike): boolean {
    return this.greaterThan(other);
  }

  /**
   * Tests if this Long's value is greater than or equal the specified's.
   */
  greaterThanOrEqual(other: LongLike): boolean {
    return this.comp(/* validates */ other) >= 0;
  }

  /** Alias of greaterThanOrEqual */
  gte(other: LongLike): boolean {
    return this.greaterThanOrEqual(other);
  }

  /**
   * Compares this Long's value with the specified's.
   * Returns 0 if they are the same, 1 if this is greater and -1 if the given one is greater.
   */
  compare(other: LongLike): number {
    const o = ensureLong(other);
    if (this.eq(o)) {return 0;}
    const thisNeg = this.isNegative();
    const otherNeg = o.isNegative();
    if (thisNeg && !otherNeg) {return -1;}
    if (!thisNeg && otherNeg) {return 1;}
    // At this point the sign bits are the same
    if (!this.unsigned) {return this.sub(o).isNegative() ? -1 : 1;}
    // Both are positive if at least one is unsigned
    return o.high >>> 0 > this.high >>> 0 ||
      (o.high === this.high && o.low >>> 0 > this.low >>> 0)
      ? -1
      : 1;
  }

  /** Alias of compare */
  comp(other: LongLike): number {
    return this.compare(other);
  }

  /**
   * Negates this Long's value.
   */
  negate(): Long {
    if (!this.unsigned && this.eq(Long.MIN_VALUE)) {return Long.MIN_VALUE;}
    return this.not().add(Long.ONE);
  }

  /** Alias of negate */
  neg(): Long {
    return this.negate();
  }

  /**
   * Returns the sum of this and the specified Long.
   */
  add(addend: LongLike): Long {
    const a = ensureLong(addend);

    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    const a48 = this.high >>> 16;
    const a32 = this.high & 0xffff;
    const a16 = this.low >>> 16;
    const a00 = this.low & 0xffff;

    const b48 = a.high >>> 16;
    const b32 = a.high & 0xffff;
    const b16 = a.low >>> 16;
    const b00 = a.low & 0xffff;

    let c48 = 0,
      c32 = 0,
      c16 = 0,
      c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xffff;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c48 += a48 + b48;
    c48 &= 0xffff;
    return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
  }

  /**
   * Returns the difference of this and the specified Long.
   */
  subtract(subtrahend: LongLike): Long {
    const s = ensureLong(subtrahend);
    return this.add(s.neg());
  }

  /** Alias of subtract */
  sub(subtrahend: LongLike): Long {
    return this.subtract(subtrahend);
  }

  /**
   * Returns the product of this and the specified Long.
   */
  multiply(multiplier: LongLike): Long {
    if (this.isZero()) {return this;}
    const m = ensureLong(multiplier);

    if (m.isZero()) {return this.unsigned ? Long.UZERO : Long.ZERO;}
    if (this.eq(Long.MIN_VALUE)) {return m.isOdd() ? Long.MIN_VALUE : Long.ZERO;}
    if (m.eq(Long.MIN_VALUE)) {return this.isOdd() ? Long.MIN_VALUE : Long.ZERO;}

    if (this.isNegative()) {
      if (m.isNegative()) {return this.neg().mul(m.neg());}
      else {return this.neg().mul(m).neg();}
    } else if (m.isNegative()) {return this.mul(m.neg()).neg();}

    // If both longs are small, use float multiplication
    if (this.lt(TWO_PWR_24) && m.lt(TWO_PWR_24))
      {return fromNumber(this.toNumber() * m.toNumber(), this.unsigned);}

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    const a48 = this.high >>> 16;
    const a32 = this.high & 0xffff;
    const a16 = this.low >>> 16;
    const a00 = this.low & 0xffff;

    const b48 = m.high >>> 16;
    const b32 = m.high & 0xffff;
    const b16 = m.low >>> 16;
    const b00 = m.low & 0xffff;

    let c48 = 0,
      c32 = 0,
      c16 = 0,
      c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xffff;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xffff;
    return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
  }

  /** Alias of multiply */
  mul(multiplier: LongLike): Long {
    return this.multiply(multiplier);
  }

  /**
   * Returns this Long divided by the specified. The result is signed if this Long is signed or unsigned if this Long is unsigned.
   */
  divide(divisor: LongLike): Long {
    let d = ensureLong(divisor);
    if (d.isZero()) {throw Error('division by zero');}
    if (this.isZero()) {return this.unsigned ? Long.UZERO : Long.ZERO;}
    let approx: number, rem: Long, res: Long;
    if (!this.unsigned) {
      // This section is only relevant for signed longs and is derived from the
      // closure library as a whole.
      if (this.eq(Long.MIN_VALUE)) {
        if (d.eq(Long.ONE) || d.eq(Long.NEG_ONE))
          {return Long.MIN_VALUE;} // recall that -MIN_VALUE == MIN_VALUE
        else if (d.eq(Long.MIN_VALUE)) {return Long.ONE;}
        else {
          // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
          const halfThis = this.shr(1);
          approx = halfThis.div(d).shl(1).toNumber();
          if (approx === 0) {
            return d.isNegative() ? Long.ONE : Long.NEG_ONE;
          } else {
            rem = this.sub(d.mul(approx));
            res = fromNumber(approx).add(rem.div(d));
            return res;
          }
        }
      } else if (d.eq(Long.MIN_VALUE))
        {return this.unsigned ? Long.UZERO : Long.ZERO;}
      if (this.isNegative()) {
        if (d.isNegative()) {return this.neg().div(d.neg());}
        return this.neg().div(d).neg();
      } else if (d.isNegative()) {return this.div(d.neg()).neg();}
      res = Long.ZERO;
    } else {
      // The algorithm below has not been made for unsigned longs. It's therefore
      // required to take special care of the MSB prior to running it.
      if (!d.unsigned) {d = d.toUnsigned();}
      if (d.gt(this)) {return Long.UZERO;}
      if (d.gt(this.shru(1)))
        // 15 >>> 1 = 7 ; with divisor = 8 ; true
        {return Long.UONE;}
      res = Long.UZERO;
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    rem = this.add(0); // to suppress unexpected aliasing of 'this'
    while (rem.gte(d)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      approx = Math.max(1, Math.floor(rem.toNumber() / d.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      const log2 = Math.ceil(Math.log(approx) / Math.LN2);
      const delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      let approxRes = fromNumber(approx);
      let approxRem = approxRes.mul(d);
      while (approxRem.isNegative() || approxRem.gt(rem)) {
        approx -= delta;
        approxRes = fromNumber(approx, this.unsigned);
        approxRem = approxRes.mul(d);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {approxRes = Long.ONE;}

      res = res.add(approxRes);
      rem = rem.sub(approxRem);
    }
    return res;
  }

  /** Alias of divide */
  div(divisor: LongLike): Long {
    return this.divide(divisor);
  }

  /**
   * Returns the bitwise NOT of this Long.
   */
  not(): Long {
    return fromBits(~this.low, ~this.high, this.unsigned);
  }

  /**
   * Returns the bitwise AND of this Long and the specified.
   */
  and(other: LongLike): Long {
    const o = ensureLong(other);
    return fromBits(this.low & o.low, this.high & o.high, this.unsigned);
  }

  /**
   * Returns the bitwise OR of this Long and the specified.
   */
  or(other: LongLike): Long {
    const o = ensureLong(other);
    return fromBits(this.low | o.low, this.high | o.high, this.unsigned);
  }

  /**
   * Returns the bitwise XOR of this Long and the given one.
   */
  xor(other: LongLike): Long {
    const o = ensureLong(other);
    return fromBits(this.low ^ o.low, this.high ^ o.high, this.unsigned);
  }

  /**
   * Returns this Long with bits shifted to the left by the given amount.
   */
  shiftLeft(numBits: number | Long): Long {
    let n = isLong(numBits) ? numBits.toInt() : (numBits as number);
    if ((n &= 63) === 0) {
        return this;
    }
    else if (n < 32) {
        return fromBits(
            this.low << n,
            (this.high << n) | (this.low >>> (32 - n)),
            this.unsigned,
          );
    }
    else {return fromBits(0, this.low << (n - 32), this.unsigned);}
  }

  /** Alias of shiftLeft */
  shl(numBits: number | Long): Long {
    return this.shiftLeft(numBits);
  }

  /**
   * Returns this Long with bits arithmetically shifted to the right by the given amount.
   */
  shiftRight(numBits: number | Long): Long {
    let n = isLong(numBits) ? numBits.toInt() : (numBits as number);
    if ((n &= 63) === 0) {return this;}
    else if (n < 32)
      {return fromBits(
        (this.low >>> n) | (this.high << (32 - n)),
        this.high >> n,
        this.unsigned,
      );}
    else
      {return fromBits(
        this.high >> (n - 32),
        this.high >= 0 ? 0 : -1,
        this.unsigned,
      );}
  }

  /** Alias of shiftRight */
  shr(numBits: number | Long): Long {
    return this.shiftRight(numBits);
  }

  /**
   * Returns this Long with bits logically shifted to the right by the given amount.
   */
  shiftRightUnsigned(numBits: number | Long): Long {
    let n = isLong(numBits) ? numBits.toInt() : (numBits as number);
    if ((n &= 63) === 0) {return this;}
    if (n < 32)
      {return fromBits(
        (this.low >>> n) | (this.high << (32 - n)),
        this.high >>> n,
        this.unsigned,
      );}
    if (n === 32) {return fromBits(this.high, 0, this.unsigned);}
    return fromBits(this.high >>> (n - 32), 0, this.unsigned);
  }

  /** Alias of shiftRightUnsigned */
  shru(numBits: number | Long): Long {
    return this.shiftRightUnsigned(numBits);
  }

  /**
   * Converts this Long to unsigned.
   */
  toUnsigned(): Long {
    if (this.unsigned) {return this;}
    return fromBits(this.low, this.high, true);
  }
}

const ZERO = fromInt(0);
const UZERO = fromInt(0, true);
const ONE = fromInt(1);
const UONE = fromInt(1, true);
const NEG_ONE = fromInt(-1);
const MAX_VALUE = fromBits(0xffffffff | 0, 0x7fffffff | 0, false);
const MIN_VALUE = fromBits(0, 0x80000000 | 0, false);
const MAX_UNSIGNED_VALUE = fromBits(0xffffffff | 0, 0xffffffff | 0, true);
const TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);

// Assign static class properties
Long.ZERO = ZERO;
Long.UZERO = UZERO;
Long.ONE = ONE;
Long.UONE = UONE;
Long.NEG_ONE = NEG_ONE;
Long.MAX_VALUE = MAX_VALUE;
Long.MIN_VALUE = MIN_VALUE;
Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;

export default Long;
