import {
    getTimezoneOffsetFromSeconds,
    leftZeroPadInteger,
    parseLocalTime,
    parseOffsetDateTime,
    parseLocalDateTime,
    parseLocalDate
} from '../util/DatetimeUtil';
import {IllegalArgumentError} from '../core';

/**
 * Local time object. Represents time in day without timezone.
 * This class is similar to LocalTime class in java. Node.js client uses this class to represent the SQL data type TIME.
 */
export class HzLocalTime {
    /**
     * @param hour Must be between 0-23
     * @param minute Must be between 0-59
     * @param second Must be between 0-24
     * @param nano Must be between 0-999_999_999(10^9-1)
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
     * @param timeString A string in the form hh:mm:ss.sss (at most 9 digits, so nano second precision)
     * @throws {@link IllegalArgumentError} if invalid timeString is given
     */
    static fromString(timeString: string): HzLocalTime {
        return parseLocalTime(timeString);
    }

    /**
     * Returns string representation of the localtime
     *
     * @returns A string in the form hh:mm:ss.sss (9 digits, so nano second precision). The constructed string is
     * zero-padded. So if hour is 1, in the string it is denoted as "01". Likewise, minute and second values are also padded until
     * 2 digits, whereas nano second value is padded until 9 digits. If nanosecond is 0, it is not included in the constructed
     * string. e.g hh:mm:ss
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
 * Local date object. Represents date in year without timezone.
 * This class is similar to LocalDate class in java. Node.js client uses this class to represent the SQL data type DATE.
 */
export class HzLocalDate {
    /**
     * @param year Must be between -(1e9-1) - (1e9-1)
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
        return parseLocalDate(dateString);
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
     * @returns A string in the form yyyy:mm:dd. Values are zero padded from left. Year is padded until 4 digits, 2 for month and
     * date.
     */
    toString(): string {
        const year = leftZeroPadInteger(this.year, 4);
        const month = leftZeroPadInteger(this.month, 2);
        const date = leftZeroPadInteger(this.date, 2);
        return `${year}-${month}-${date}`;
    }
}

export class HzLocalDateTime {
    constructor(
        private readonly hzLocalDate: HzLocalDate,
        private readonly hzLocalTime: HzLocalTime
    ) {
    }

    getHzLocalTime(): HzLocalTime {
        return this.hzLocalTime;
    }

    /**
     * Constructs HzLocalDateTime from iso 8601 iso string. The iso string must not include timezone information at the end.
     * @throws {@link IllegalArgumentError} if iso string is invalid
     * @param isoString
     */
    static fromISOString(isoString: string): HzLocalDateTime {
        return parseLocalDateTime(isoString);
    }

    getHzLocalDate(): HzLocalDate {
        return this.hzLocalDate;
    }

    toString(): string {
        return `${this.hzLocalDate.toString()}T${this.hzLocalTime.toString()}`;
    }
}

export class HzOffsetDateTime {

    private hzLocalDateTime: HzLocalDateTime;

    constructor(date: Date, private readonly offsetSeconds: number) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new IllegalArgumentError('Invalid date.');
        }
        if (!(offsetSeconds >= -64800 && offsetSeconds <= 64800)) {
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

    static fromHzLocalDateTime(hzLocalDatetime: HzLocalDateTime, offsetSeconds: number): HzOffsetDateTime {
        const instance = new HzOffsetDateTime(new Date(), offsetSeconds);
        instance.setHzLocalDatetime(hzLocalDatetime);
        return instance
    }

    /** @internal */
    setHzLocalDatetime(hzLocalDatetime: HzLocalDateTime): void {
        this.hzLocalDateTime = hzLocalDatetime;
    }

    static fromISOString(isoString: string): HzOffsetDateTime {
        return parseOffsetDateTime(isoString);
    }

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
            + this.offsetSeconds * 1000
        );
    }

    getOffsetSeconds(): number {
        return this.offsetSeconds;
    }

    toISOString(): string {
        const timezoneOffsetString = getTimezoneOffsetFromSeconds(this.offsetSeconds);
        return this.hzLocalDateTime.toString() + timezoneOffsetString;
    }
}


