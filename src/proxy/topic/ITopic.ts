import {TopicMessageListener} from './TopicMessageListener';
import * as Promise from 'bluebird';

export interface ITopic<E> {
    addMessageListener(listener: TopicMessageListener<E>): string;
    removeMessageListener(id: string): boolean;
    publish(message: E): Promise<void>;
}
