import { ILogger } from '../logging/ILogger';
export interface Properties {
    [prop: string]: Property;
}
export declare type Property = string | number | boolean | ILogger;
