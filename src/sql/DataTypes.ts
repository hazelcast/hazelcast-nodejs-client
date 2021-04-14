import {combineISOStringWithTimeString, getTimezoneOffsetFromSeconds, leftZeroPadInteger} from '../util/DatetimeUtil';
import {IllegalArgumentError} from '../core';

export class HzLocalTime {
    constructor(
        private readonly hour: number,
        private readonly minute: number,
        private readonly second: number,
        private readonly nano: number
    ) {
        if(!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second) || !Number.isInteger(nano)){
            throw new IllegalArgumentError('Illegal arguments given to HzLocalTime. All arguments must be integers.');
        }
        if(!(hour >= 0 && hour <= 23)){
            throw new IllegalArgumentError('Hour must be between 0-23');
        }
        if(!(minute >= 0 && minute <= 59)){
            throw new IllegalArgumentError('Minute must be between 0-59');
        }
        if(!(second >= 0 && second <= 59)){
            throw new IllegalArgumentError('Second must be between 0-24');
        }
        if(!(nano >= 0 && nano <= 1e9 - 1)){
            throw new IllegalArgumentError('Nano must be between 0-(1e9-1)');
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
        const nano = leftZeroPadInteger(this.nano, 9);

        return `${hour}:${minute}:${second}.${nano}`;
    }
}

export class HzLocalDate {
    constructor(
        private readonly year: number,
        private readonly month: number,
        private readonly date: number
    ) {
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

    toISOString(): string {
        const year = leftZeroPadInteger(this.year, 4);
        const month = leftZeroPadInteger(this.month, 2);
        const dayOfMonth = leftZeroPadInteger(this.date, 2);
        return `${year}-${month}-${dayOfMonth}T00:00:00`;
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
        return combineISOStringWithTimeString(this.hzLocalDate.toISOString(), this.hzLocalTime.toString());
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


