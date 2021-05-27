import {
    getOffsetSecondsFromTimezoneString,
    getTimezoneOffsetFromSeconds
} from '../util/DatetimeUtil';

/**
 * ### Local time object
 * * Represents time in day without timezone.
 */
export class HzLocalTime {
    private static readonly timeStringRegex = /(\d\d):(\d\d):(\d\d)(\.\d+)?/;

    /**
     * @param hour The hour-of-day to represent, from 0 to 23
     * @param minute The minute-of-hour to represent, from 0 to 59
     * @param second The second-of-minute to represent, from 0 to 59
     * @param nano The nano-of-second to represent, from 0 to 999,999,999
     * @throws RangeError if any of the arguments are invalid
     */
    constructor(
        readonly hour: number,
        readonly minute: number,
        readonly second: number,
        readonly nano: number
    ) {
        if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second) || !Number.isInteger(nano)) {
            throw new RangeError('Illegal arguments given to HzLocalTime. All arguments must be integers.');
        }
        if (!(hour >= 0 && hour <= 23)) {
            throw new RangeError('Hour-of-day must be between 0-23');
        }
        if (!(minute >= 0 && minute <= 59)) {
            throw new RangeError('Minute-of-hour must be between 0-59');
        }
        if (!(second >= 0 && second <= 59)) {
            throw new RangeError('Second-of-minute must be between 0-59');
        }
        if (!(nano >= 0 && nano <= 999_999_999)) {
            throw new RangeError('Nano-of-second must be between 0-999_999_999');
        }
    }

    /**
     * Constructs a new {@link HzLocalTime} object from timeString.
     * @param timeString A string in the form HH:mm:ss.SSS, where the last part represents nanoseconds and optional.
     * At most 9 digits allowed for nanosecond value. If more than 9 digits are given, the first 9 of them are used.
     * @throws RangeError if invalid timeString is given
     */
    static fromString(timeString: string): HzLocalTime {
        if (typeof timeString !== 'string') {
            throw new RangeError('String expected.');
        }
        let match = timeString.match(HzLocalTime.timeStringRegex);
        if (!match) {
            throw new RangeError('Illegal time string. Expected a string in HH:mm:ss.SSS format');
        }
        match = match.slice(1); // Discard first match which is the first complete match

        const hours = +match[0];
        const minutes = +match[1];
        const seconds = +match[2];

        let nano = 0;
        if (match[3] !== undefined) { // nano second included
            let nanoStr = match[3].substring(1); // does not include first dot
            // make nanoStr 9 digits if it's longer
            if (nanoStr.length > 9) nanoStr = nanoStr.slice(0, 9);

            nanoStr = nanoStr.padEnd(9, '0');
            nano = +nanoStr;
        }

        return new HzLocalTime(hours, minutes, seconds, nano);
    }

    /**
     * Returns the string representation of this local time.
     *
     * @returns A string in the form HH:mm:ss.SSS (9 digits, nano second precision). The constructed string is
     * zero-padded from left. If nanosecond is 0, it is not included in the constructed string.
     */
    toString(): string {
        const hour = this.hour.toString().padStart(2, '0');
        const minute = this.minute.toString().padStart(2, '0');
        const second = this.second.toString().padStart(2, '0');

        let hourMinuteSecondString = `${hour}:${minute}:${second}`;
        // Do not add .000000000 if nano is 0
        if (this.nano !== 0) {
            hourMinuteSecondString += `.${this.nano.toString().padStart(9, '0')}`;
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
 */
export class HzLocalDate {
    private static readonly dateRegex = /(-?\d+)-(\d\d)-(\d\d)/;
    /**
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-31 depending on year and month
     * @throws RangeError if any of the arguments are invalid
     */
    constructor(
        readonly year: number,
        readonly month: number,
        readonly date: number
    ) {
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(date)) {
            throw new RangeError('Illegal arguments given to HzLocalTime. All arguments must be integers.');
        }
        if (!(month >= 1 && month <= 12)) {
            throw new RangeError('Month must be between 1-12');
        }
        if (!(year >= -999_999_999 && year <= 999_999_999)) {
            throw new RangeError('Year must be between -999_999_999 - 999_999_999');
        }

        if (date < 1) {
            throw new RangeError('Invalid date. Date cannot be less than 1');
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
            }

            if (date > maxDate) {
                if (date == 29) {
                    throw new RangeError(`Invalid date. February 29 as ${this.year} is not a leap year`);
                }
                throw new RangeError(`Invalid date. ${Months[this.month]} ${this.date}`);
            }
        }
    }

    /**
     * @internal
     * Implementation is taken from java IsoChronology.isLeapYear()
     * @param year Year value
     */
    private static isLeapYear(year: number): boolean {
        return (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    /**
     * Constructs a {@link HzLocalDate} object from string.
     * @throws RangeError if string is not passed, or string format is wrong
     * @param dateString String in the form of yyyy-mm-dd
     */
    static fromString(dateString: string): HzLocalDate {
        if (typeof dateString !== 'string') {
            throw new RangeError('String expected.');
        }
        const match = dateString.match(HzLocalDate.dateRegex);
        if (!match) {
            throw new RangeError('Invalid format. Expected a string in yyyy-mm-dd format');
        }

        const yearNumber = +match[1];
        const monthNumber = +match[2];
        const dateNumber = +match[3];

        if (isNaN(yearNumber) || isNaN(monthNumber) || isNaN(dateNumber)) {
            throw new RangeError('Invalid format. Expected a string in yyyy-mm-dd format');
        }
        return new HzLocalDate(yearNumber, monthNumber, dateNumber);
    }

    /**
     * Returns the string representation of this local date.
     * @returns A string in the form yyyy:mm:dd. Values are zero padded from left
     */
    toString(): string {
        const sign = this.year < 0 ? '-' : '';
        const paddedYear = Math.abs(this.year).toString().padStart(4, '0');
        const month = this.month.toString().padStart(2, '0');
        const date = this.date.toString().padStart(2, '0');
        return `${sign}${paddedYear}-${month}-${date}`;
    }
}

/**
 * ### Local datetime object
 * * Represents date and time without timezone.
 */
export class HzLocalDateTime {
    /**
     * @throws RangeError if arguments are invalid
     */
    constructor(
        readonly hzLocalDate: HzLocalDate,
        readonly hzLocalTime: HzLocalTime
    ) {
        if (!(hzLocalDate instanceof HzLocalDate)) {
            throw new RangeError('Invalid local date.');
        }
        if (!(hzLocalTime instanceof HzLocalTime)) {
            throw new RangeError('Invalid local time.');
        }
    }

    /**
     * Constructs HzLocalDateTime from ISO 8601 string.
     * @param isoString Must not include timezone information. The string format is yyyy-mm-ss(T|t)HH:mm:ss.SSS. The last SSS
     * part represents nanoseconds and can be omitted.
     * @throws RangeError if ISO string is invalid or any of the values in ISO string is invalid
     */
    static fromString(isoString: string): HzLocalDateTime {
        if (typeof isoString !== 'string') {
            throw new RangeError('String expected.');
        }
        const split = isoString.split(/[Tt]/);
        if (split.length !== 2) {
            throw new RangeError('Invalid format. Expected a string in the form yyyy-mm-ss(T|t)HH:mm:ss.SSS');
        }
        return new HzLocalDateTime(HzLocalDate.fromString(split[0]), HzLocalTime.fromString(split[1]));
    }

    /**
     * Returns the string representation of this local datetime.
     * @returns A string in the form yyyy:mm:ddTHH:mm:ss.SSS. Values are zero padded from left. If nano second value
     * is zero, second decimal is not include in the returned string
     */
    toString(): string {
        return `${this.hzLocalDate.toString()}T${this.hzLocalTime.toString()}`;
    }
}

/**
 * ### Offset datetime object
 * * Represents date and time with timezone.
 * * Timezone is specified with offset from UTC in seconds. This offset can be negative or positive.
 * * This class internally stores a {@link HzLocalDateTime} and offset number.
 */
export class HzOffsetDateTime {

    hzLocalDateTime: HzLocalDateTime;
    private static readonly timezoneRegex = /([Zz]|[+-]\d\d:\d\d)/;

    /**
     * @param date Must be a valid date. So `date.getTime()` should be not NaN
     * @param offsetSeconds Must be between -64800-64800 (-+18:00)
     */
    constructor(date: Date, readonly offsetSeconds: number) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new RangeError('Invalid date.');
        }
        if (!Number.isInteger(offsetSeconds) || !(offsetSeconds >= -64800 && offsetSeconds <= 64800)) {
            throw new RangeError('Offset seconds can be between -64800(-18:00) and 64800(+18:00).');
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
     * Constructs a new instance from {@link HzLocalDateTime} and offset seconds.
     */
    static fromHzLocalDateTime(hzLocalDatetime: HzLocalDateTime, offsetSeconds: number): HzOffsetDateTime {
        const hzOffsetDateTime = new HzOffsetDateTime(new Date(), offsetSeconds);
        hzOffsetDateTime.hzLocalDateTime = hzLocalDatetime;
        return hzOffsetDateTime;
    }

    /**
     * Constructs a new instance from ISO 8601 string.
     * @param isoString ISO 8601 string with timezone. If timezone is omitted, UTC is assumed
     */
    static fromString(isoString: string): HzOffsetDateTime {
        if (typeof isoString !== 'string') {
            throw new RangeError('String expected');
        }
        const indexOfFirstMatch = isoString.search(HzOffsetDateTime.timezoneRegex);
        const split = isoString.split(isoString[indexOfFirstMatch]);
        let offsetSeconds;
        if(split.length !== 2) {
            throw new RangeError('Invalid format');
        }
        if (indexOfFirstMatch === -1) {
            offsetSeconds = 0;
        }else{
            offsetSeconds = getOffsetSecondsFromTimezoneString(isoString[indexOfFirstMatch] + split[1]);
        }
        return HzOffsetDateTime.fromHzLocalDateTime(HzLocalDateTime.fromString(split[0]), offsetSeconds);
    }

    /**
     * Returns this offset datetime as Date. Note that the timezone information is not stored in Date objects and you
     * effectively get a timestamp.(an instance in time without timezone)
     */
    asDate(): Date {
        return new Date(
            Date.UTC(
                this.hzLocalDateTime.hzLocalDate.year,
                this.hzLocalDateTime.hzLocalDate.month - 1, // month start with 0 in Date
                this.hzLocalDateTime.hzLocalDate.date,
                this.hzLocalDateTime.hzLocalTime.hour,
                this.hzLocalDateTime.hzLocalTime.minute,
                this.hzLocalDateTime.hzLocalTime.second,
                Math.floor(this.hzLocalDateTime.hzLocalTime.nano / 1_000_000)
            )
            - this.offsetSeconds * 1000
        );
    }

    /**
     * Returns ISO 8601 string with timezone of this instance.
     * @returns A string in the format yyyy-mm-ddTHH-mm-ss.SSS(Z | (+|-)HH:mm)
     * Timezone is denoted either with `Z` or timezone string like +-HH:mm
     */
    toISOString(): string {
        const timezoneOffsetString = getTimezoneOffsetFromSeconds(this.offsetSeconds);
        return this.hzLocalDateTime.toString() + timezoneOffsetString;
    }
}


