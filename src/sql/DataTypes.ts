import {getTimezoneOffsetFromSeconds, leftZeroPadInteger} from '../util/DatetimeUtil';
import {IllegalArgumentError} from '../core';

export class HzLocalTime {
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
            throw new IllegalArgumentError('Second must be between 0-24');
        }
        if (!(nano >= 0 && nano <= 1e9 - 1)) {
            throw new IllegalArgumentError('Nano must be between 0-999_999_999');
        }
    }

    getHour(): number {
        return this.hour;
    }

    getMinute(): number {
        return this.minute;
    }

    getSecond(): number {
        return this.second;
    }

    getNano(): number {
        return this.nano;
    }

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

export class HzLocalDate {
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
            throw new IllegalArgumentError('Year must be between -999_999_999-999_999_999');
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
                    throw new IllegalArgumentError(`Invalid date 'February 29' as '${this.year}' is not a leap year`);
                }
                throw new IllegalArgumentError(`Invalid date '${Months[this.month]} '${this.date}'`);
            }
        }
    }

    /**
     * Implementation is taken from java IsoChronology.isLeapYear()
     * @internal
     * @param {number} year
     */
    static isLeapYear(year: number): boolean {
        return (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    getYear(): number {
        return this.year;
    }

    getMonth(): number {
        return this.month;
    }

    getDate(): number {
        return this.date;
    }

    toString(): string {
        const year = leftZeroPadInteger(this.year, 4);
        const month = leftZeroPadInteger(this.month, 2);
        const dayOfMonth = leftZeroPadInteger(this.date, 2);
        return `${year}-${month}-${dayOfMonth}`;
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

    getHzLocalDate(): HzLocalDate {
        return this.hzLocalDate;
    }

    toDate(): Date {
        return new Date(
            this.hzLocalDate.getYear(),
            this.hzLocalDate.getMonth(),
            this.hzLocalDate.getDate(),
            this.hzLocalTime.getHour(),
            this.hzLocalTime.getMinute(),
            this.hzLocalTime.getSecond(),
            Math.floor(this.hzLocalTime.getNano() / 1000_000)
        )
    }

    toISOString(): string {
        return `${this.hzLocalDate.toString()}T${this.hzLocalTime.toString()}`;
    }
}

export class HzOffsetDateTime {

    constructor(
        private readonly hzLocalDatetime: HzLocalDateTime,
        private readonly offsetSeconds: number
    ) {
    }

    getOffsetSeconds(): number {
        return this.offsetSeconds;
    }

    getHzLocalDateTime() {
        return this.hzLocalDatetime;
    }

    toISOString(): string {
        const timezoneOffsetString = getTimezoneOffsetFromSeconds(this.offsetSeconds);
        return this.hzLocalDatetime.toISOString() + timezoneOffsetString;
    }
}


