import Long = require('long');

export const enum TimeUnit {
    DAYS,
    HOURS,
    MINUTES,
    SECONDS,
    MILLISECONDS,
    MICROSECONDS,
    NANOSECONDS
}

const MILLIS_IN_MINUTES = 60 * 1000;
const MILLIS_IN_HOURS = 60 * MILLIS_IN_MINUTES;
const MILLIS_IN_DAY = 24 * MILLIS_IN_HOURS;

export function toMillis(value: Long|number|string, timeunit: TimeUnit): Long {
    let result = Long.fromValue(value);
    switch (timeunit) {
        case TimeUnit.DAYS:
            return result.multiply(MILLIS_IN_DAY);
        case TimeUnit.HOURS:
            return result.multiply(MILLIS_IN_HOURS);
        case TimeUnit.MINUTES:
            return result.multiply(MILLIS_IN_MINUTES);
        case TimeUnit.SECONDS:
            return result.multiply(1000);
        case TimeUnit.MILLISECONDS:
            return result;
        case TimeUnit.MICROSECONDS:
            return result.divide(1000);
        case TimeUnit.NANOSECONDS:
            return result.divide(1000000);
    }
}
