/**
 * ### Local time object
 * * Represents time in day without timezone.
 */
export declare class LocalTime {
    readonly hour: number;
    readonly minute: number;
    readonly second: number;
    readonly nano: number;
    private static readonly timeStringRegex;
    /**
     * @param hour The hour-of-day to represent, from 0 to 23
     * @param minute The minute-of-hour to represent, from 0 to 59
     * @param second The second-of-minute to represent, from 0 to 59
     * @param nano The nano-of-second to represent, from 0 to 999,999,999
     * @throws TypeError if any of the arguments are invalid
     * @throws RangeError if value of any of the arguments are invalid
     */
    constructor(hour: number, minute: number, second: number, nano: number);
    /**
     * Constructs a new {@link LocalTime} object from timeString.
     * @param timeString A string in the form HH:mm:ss.SSS, where the last part represents nanoseconds and optional.
     * At most 9 digits allowed for nanosecond value. If more than 9 digits are given, the first 9 of them are used.
     * @throws RangeError if given timeString is invalid
     * @throws TypeError if given argument is not string
     */
    static fromString(timeString: string): LocalTime;
    /**
     * Constructs a new instance from Date.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @throws TypeError if the passed param is not a Date
     * @throws RangeError if an invalid Date is passed
     */
    static fromDate(date: Date): LocalTime;
    /**
     * Returns the string representation of this local time.
     *
     * @returns A string in the form HH:mm:ss.SSS (9 digits, nano second precision). The constructed string is
     * zero-padded from left. If nanosecond is 0, it is not included in the constructed string.
     */
    toString(): string;
}
/**
 * ### Local date object
 * * Represents date in year without timezone.
 */
export declare class LocalDate {
    readonly year: number;
    readonly month: number;
    readonly date: number;
    private static readonly dateRegex;
    /**
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-31 depending on year and month
     * @throws RangeError if value of any of the arguments are invalid, or the date formed by them is invalid (e.g 02/29/2021)
     * @throws TypeError if any of the arguments are of wrong type
     */
    constructor(year: number, month: number, date: number);
    /**
     * Constructs a {@link LocalDate} object from string.
     * @param dateString String in the form of yyyy-mm-dd
     * @throws TypeError if a string is not passed
     * @throws RangeError if the string format is wrong
     */
    static fromString(dateString: string): LocalDate;
    /**
     * Constructs a new instance from Date.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @throws TypeError if the passed param is not a Date
     * @throws RangeError if an invalid Date is passed
     */
    static fromDate(date: Date): LocalDate;
    /**
     * Returns the string representation of this local date.
     * @returns A string in the form yyyy:mm:dd. Values are zero padded from left
     */
    toString(): string;
}
/**
 * ### Local datetime object
 * * Represents date and time without timezone.
 */
export declare class LocalDateTime {
    readonly localDate: LocalDate;
    readonly localTime: LocalTime;
    private static separatorRegex;
    /**
     * @param localDate a {@link LocalDate} object
     * @param localTime a {@link LocalTime} object
     * @throws TypeError if passed arguments are of wrong type
     */
    constructor(localDate: LocalDate, localTime: LocalTime);
    /**
     * Constructs LocalDateTime from ISO 8601 string.
     * @param isoString Must not include timezone information. The string format is yyyy-mm-ss(T|t)HH:mm:ss.SSS. The last SSS
     * part represents nanoseconds and can be omitted.
     * @throws RangeError if ISO string is invalid or any of the values in ISO string is invalid
     * @throws TypeError if the value is not a string
     */
    static fromString(isoString: string): LocalDateTime;
    /**
     * Returns this LocalDataTime as Date.
     */
    asDate(): Date;
    /**
     * Constructs a new instance from Date.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @throws TypeError if the passed param is not a Date
     * @throws RangeError if an invalid Date is passed
     */
    static fromDate(date: Date): LocalDateTime;
    /**
     * Static constructor for convenient construction.
     *
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-31 depending on year and month
     * @param hour The hour-of-day to represent, from 0 to 23
     * @param minute The minute-of-hour to represent, from 0 to 59
     * @param second The second-of-minute to represent, from 0 to 59
     * @param nano The nano-of-second to represent, from 0 to 999,999,999
     * @throws TypeError if passed arguments are of wrong type
     * @throws RangeError if value of any of the arguments are invalid
     */
    static from(year: number, month: number, date: number, hour: number, minute: number, second: number, nano: number): LocalDateTime;
    /**
     * Returns the string representation of this local datetime.
     * @returns A string in the form yyyy:mm:ddTHH:mm:ss.SSS. Values are zero padded from left. If nano second value
     * is zero, second decimal is not include in the returned string
     */
    toString(): string;
}
/**
 * ### Offset datetime object
 * * Represents date and time with timezone.
 * * Timezone is specified with offset from UTC in seconds. This offset can be negative or positive.
 * * This class internally stores a {@link LocalDateTime} and offset number.
 */
export declare class OffsetDateTime {
    readonly localDateTime: LocalDateTime;
    readonly offsetSeconds: number;
    private static readonly timezoneRegex;
    /**
     * @param localDateTime {@link LocalDateTime} object
     * @param offsetSeconds timezone offset in seconds. Must be in [-64800, 64800] range.
     * @throws TypeError if type of arguments are invalid
     */
    constructor(localDateTime: LocalDateTime, offsetSeconds: number);
    /**
     * Constructs a new instance from Date and offset seconds.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @param offsetSeconds Offset in seconds, must be between [-64800, 64800]
     * @throws TypeError if a wrong type is passed as argument
     * @throws RangeError if an invalid argument value is passed
     */
    static fromDate(date: Date, offsetSeconds: number): OffsetDateTime;
    /**
     * Constructs a new instance from ISO 8601 string. The string format is yyyy-mm-ddTHH-mm-ss.SSS(Z | (+|-)HH:mm).
     * @param isoString ISO 8601 string with timezone. If timezone is omitted, UTC is assumed
     * @throws TypeError if passed value is not a string
     * @throws RangeError if passed string is invalid
     */
    static fromString(isoString: string): OffsetDateTime;
    /**
     * Returns this offset datetime as Date. Note that the timezone information is not stored in Date objects and you
     * effectively get a timestamp.(an instance in time without timezone)
     */
    asDate(): Date;
    /**
     * Static constructor for convenient construction.
     *
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-31 depending on year and month
     * @param hour The hour-of-day to represent, from 0 to 23
     * @param minute The minute-of-hour to represent, from 0 to 59
     * @param second The second-of-minute to represent, from 0 to 59
     * @param nano The nano-of-second to represent, from 0 to 999,999,999
     * @param offsetSeconds timezone offset in seconds. Must be in [-64800, 64800] range.
     * @throws TypeError if passed arguments are of wrong type
     * @throws RangeError if value of any of the arguments are invalid
     */
    static from(year: number, month: number, date: number, hour: number, minute: number, second: number, nano: number, offsetSeconds: number): OffsetDateTime;
    /**
     * Returns ISO 8601 string with timezone of this instance.
     * @returns A string in the format yyyy-mm-ddTHH-mm-ss.SSS(Z | (+|-)HH:mm)
     * Timezone is denoted either with `Z` or timezone string like +-HH:mm
     */
    toString(): string;
}
