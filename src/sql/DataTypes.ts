import {
    getTimezoneOffsetFromSeconds,
    leftZeroPadInteger,
    parseLocalTime,
} from '../util/DatetimeUtil';
import {IllegalArgumentError} from '../core';

/**
 * ### Local time object
 * * Represents time in day without timezone.
 * * This class is similar to LocalTime class in java. Node.js client uses this class to represent the TIME datatype in SQL.
 */
export class HzLocalTime {
    /**
     * @param hour Must be between 0-23
     * @param minute Must be between 0-59
     * @param second Must be between 0-24
     * @param nano Must be between 0-999999999
     * @throws {@link IllegalArgumentError} if any of the arguments are invalid
     */
    constructor(
        private readonly hour: number,
        private readonly minute: number,
        private readonly second: number,
        private readonly nano: number
    ) {
        if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second) || !Number.isInteger(nano)) {
            throw new IllegalArgumentError('Illegal arguments given to HzLocalTime. All arguments must be integers.');
        }
        if (!(hour >= 0 && hour <= 23)) {
            throw new IllegalArgumentError('Hour must be between 0-23');
        }
        if (!(minute >= 0 && minute <= 59)) {
            throw new IllegalArgumentError('Minute must be between 0-59');
        }
        if (!(second >= 0 && second <= 59)) {
            throw new IllegalArgumentError('Second must be between 0-59');
        }
        if (!(nano >= 0 && nano <= 1e9 - 1)) {
            throw new IllegalArgumentError('Nano must be between 0-999_999_999');
        }
    }

    /**
     * Returns hour value of this local time
     */
    getHour(): number {
        return this.hour;
    }

    /**
     * Returns minute value of this local time
     */
    getMinute(): number {
        return this.minute;
    }

    /**
     * Returns second value of this local time
     */
    getSecond(): number {
        return this.second;
    }

    /**
     * Returns nanosecond value of this local time
     */
    getNano(): number {
        return this.nano;
    }

    /**
     * Constructs a new {@link HzLocalTime} object from timeString.
     * @param timeString A string in the form hh:mm:ss[.sss] (at most 9 digits allowed for second decimal)
     * @throws {@link IllegalArgumentError} if invalid timeString is given
     */
    static fromString(timeString: string): HzLocalTime {
        return parseLocalTime(timeString);
    }

    /**
     * Returns string representation of this local time.
     *
     * @returns A string in the form hh:mm:ss[.sssssssss] (9 digits, nano second precision). The constructed string is
     * zero-padded from left. If nanosecond is 0, it is not included in the constructed string.
     */
    toString(): string {
        const hour = leftZeroPadInteger(this.hour, 2);
        const minute = leftZeroPadInteger(this.minute, 2);
        const second = leftZeroPadInteger(this.second, 2);

        let hourMinuteSecondString = `${hour}:${minute}:${second}`;
        // Do not add .000000000 if nano is 0
        if (this.nano !== 0) {
            hourMinuteSecondString += `.${leftZeroPadInteger(this.nano, 9)}`;
        }
        return hourMinuteSecondString;
    }
}

/**
 * Months for HzLocalDate
 * @internal
 */
enum Months {
    January = 1,
    February,
    March,
    April,
    May,
    June,
    July,
    August,
    September,
    October,
    November,
    December
}

/**
 * ### Local date object
 * * Represents date in year without timezone.
 * * This class is similar to LocalDate class in java. Node.js client uses this class to represent the DATE datatype in SQL.
 */
export class HzLocalDate {
    /**
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-28/31 depending on year and month.
     * @throws {@link IllegalArgumentError} if any of the arguments are invalid
     */
    constructor(
        private readonly year: number,
        private readonly month: number,
        private readonly date: number
    ) {
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(date)) {
            throw new IllegalArgumentError('Illegal arguments given to HzLocalTime. All arguments must be integers.');
        }
        if (!(month >= 1 && month <= 12)) {
            throw new IllegalArgumentError('Month must be between 1-12');
        }
        if (!(year >= -999_999_999 && year <= 999_999_999)) {
            throw new IllegalArgumentError('Year must be between -(1e9-1) - (1e9-1)');
        }

        if (date < 1) {
            throw new IllegalArgumentError('Invalid date. Date cannot be less than 1');
        }

        if (date > 28) {
            let maxDate = 31;
            switch (month) {
                case 2:
                    maxDate = HzLocalDate.isLeapYear(this.year) ? 29 : 28;
                    break;
                case 4:
                    maxDate = 30;
                    break;
                case 6:
                    maxDate = 30;
                    break;
                case 9:
                    maxDate = 30;
                    break;
                case 11:
                    maxDate = 30;
                    break;
                default:
                    break;
            }

            if (date > maxDate) {
                if (date == 29) {
                    throw new IllegalArgumentError(`Invalid date. February 29 as ${this.year} is not a leap year`);
                }
                throw new IllegalArgumentError(`Invalid date. ${Months[this.month]} ${this.date}`);
            }
        }
    }

    /**
     * @internal
     * Implementation is taken from java IsoChronology.isLeapYear()
     * @param year Year value
     */
    static isLeapYear(year: number): boolean {
        return (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    /**
     * Constructs a {@link HzLocalDate} object from string.
     * @param dateString
     */
    static fromString(dateString: string): HzLocalDate {
        return null;
    }

    /**
     * Returns year value of this local date.
     */
    getYear(): number {
        return this.year;
    }

    /**
     * Returns month value of this local date.
     */
    getMonth(): number {
        return this.month;
    }

    /**
     * Returns date (day of month) value of this local date.
     */
    getDate(): number {
        return this.date;
    }

    /**
     * Returns string representation of this local date.
     * @returns A string in the form yyyy:mm:dd. Values are zero padded from left.
     */
    toString(): string {
        const year = leftZeroPadInteger(this.year, 4);
        const month = leftZeroPadInteger(this.month, 2);
        const date = leftZeroPadInteger(this.date, 2);
        return `${year}-${month}-${date}`;
    }
}

/**
 * ### Local datetime object
 * * Represents date and time without timezone.
 * * This class is similar to LocalDateTime class in java. Node.js client uses this class to represent the TIMESTAMP datatype
 * in SQL.
 */
export class HzLocalDateTime {
    /**
     * @throws {@link IllegalArgumentError} if arguments are invalid
     * @param hzLocalDate
     * @param hzLocalTime
     */
    constructor(
        private readonly hzLocalDate: HzLocalDate,
        private readonly hzLocalTime: HzLocalTime
    ) {
        if (!(hzLocalDate instanceof HzLocalDate)) {
            throw new IllegalArgumentError('Invalid local date.');
        }
        if (!(hzLocalTime instanceof HzLocalTime)) {
            throw new IllegalArgumentError('Invalid local time.');
        }
    }

    /**
     * Get {@link HzLocalTime} of this local datetime.
     */
    getHzLocalTime(): HzLocalTime {
        return this.hzLocalTime;
    }

    /**
     * Get {@link HzLocalDate} of this local datetime.
     */
    getHzLocalDate(): HzLocalDate {
        return this.hzLocalDate;
    }

    /**
     * Constructs HzLocalDateTime from ISO 8601 string.
     * @param isoString Must not include timezone information. The string format is yyyy-mm-ssThh:mm:ss[.sss], so, second
     * decimal value can be omitted.
     * @throws {@link IllegalArgumentError} if iso string is invalid
     */
    static fromISOString(isoString: string): HzLocalDateTime {
        return null;
    }

    /**
     * Returns string representation of this local datetime.
     * @returns A string in the form yyyy:mm:ddThh:mm:ss[.sssssssss]. Values are zero padded from left. If nano second value
     * is zero, second decimal is not include in the returned string.
     */
    toString(): string {
        return `${this.hzLocalDate.toString()}T${this.hzLocalTime.toString()}`;
    }
}

/**
 * ### Offset datetime object
 * * Represents date and time with timezone.
 * * Timezone is specified with offset from utc in seconds. This offset can be negative or positive.
 * * This class internally stores a {@link HzLocalDateTime} and offset number.
 * * This class is similar to OffsetDateTime class in java. Node.js client uses this class to represent the
 * TIMESTAMP WITH TIMEZONE datatype in SQL.
 */
export class HzOffsetDateTime {

    private hzLocalDateTime: HzLocalDateTime;

    /**
     * @param date Must be a valid date. So `date.getTime()` should be not NaN.
     * @param offsetSeconds Must be between -64800-64800 (-+18:00)
     */
    constructor(date: Date, private readonly offsetSeconds: number) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new IllegalArgumentError('Invalid date.');
        }
        if (!Number.isInteger(offsetSeconds) || !(offsetSeconds >= -64800 && offsetSeconds <= 64800)) {
            throw new IllegalArgumentError('Offset seconds can be between -64800(-18:00) and 64800(+18:00).');
        }

        this.hzLocalDateTime = new HzLocalDateTime(
            new HzLocalDate(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate()
            ),
            new HzLocalTime(
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds(),
                date.getUTCMilliseconds() * 1_000_000
            )
        );
    }

    /**
     *
     * @param hzLocalDatetime
     * @param offsetSeconds
     */
    static fromHzLocalDateTime(hzLocalDatetime: HzLocalDateTime, offsetSeconds: number): HzOffsetDateTime {
        const instance = new HzOffsetDateTime(new Date(), offsetSeconds);
        instance.setHzLocalDatetime(hzLocalDatetime);
        return instance
    }

    /** @internal */
    setHzLocalDatetime(hzLocalDatetime: HzLocalDateTime): void {
        this.hzLocalDateTime = hzLocalDatetime;
    }

    /**
     * Constructs a new instance from ISO 8601 string.
     * @param isoString ISO 8601 string with timezone. If timezone is omitted, UTC is assumed.
     */
    static fromISOString(isoString: string): HzOffsetDateTime {
        return null;
    }

    /**
     * Returns this offset datetime as date. In order to do this, internal {@link HzLocalDateTime} is treated as UTC date and
     * offset seconds is added onto it.
     */
    asDate(): Date {
        return new Date(
            Date.UTC(
                this.hzLocalDateTime.getHzLocalDate().getYear(),
                this.hzLocalDateTime.getHzLocalDate().getMonth(),
                this.hzLocalDateTime.getHzLocalDate().getDate(),
                this.hzLocalDateTime.getHzLocalTime().getHour(),
                this.hzLocalDateTime.getHzLocalTime().getMinute(),
                this.hzLocalDateTime.getHzLocalTime().getSecond(),
                Math.floor(this.hzLocalDateTime.getHzLocalTime().getNano() / 1_000_000)
            )
            - this.offsetSeconds * 1000
        );
    }

    /**
     * Returns offset seconds of this offset datetime.
     */
    getOffsetSeconds(): number {
        return this.offsetSeconds;
    }

    /**
     * Returns {@link HzLocalDateTime} of this offset datetime.
     */
    getHzLocalDateTime(): HzLocalDateTime {
        return this.hzLocalDateTime;
    }

    /**
     * Returns ISO 8601 string with timezone of this instance.
     * @returns A string in the format yyyy-mm-ddThh-mm-ss[.sssssssss](Z | (+|-)hh:mm)
     * Timezone is denoted either with `Z` or timezone string like +-hh:mm
     */
    toISOString(): string {
        const timezoneOffsetString = getTimezoneOffsetFromSeconds(this.offsetSeconds);
        return this.hzLocalDateTime.toString() + timezoneOffsetString;
    }
}


