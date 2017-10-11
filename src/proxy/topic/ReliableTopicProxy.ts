import * as Promise from 'bluebird';
import {ITopic} from './ITopic';
import {TopicMessageListener} from './TopicMessageListener';
import HazelcastClient from '../../HazelcastClient';
import {IRingbuffer} from '../IRingbuffer';
import {Address} from '../../index';
import {UuidUtil} from '../../util/UuidUtil';
import {ReliableTopicListenerRunner} from './ReliableTopicListenerRunner';
import {ReliableTopicConfig} from '../../Config';
import {RawTopicMessage} from './RawTopicMessage';
import {SerializationService} from '../../serialization/SerializationService';
import {OverflowPolicy} from '../../core/OverflowPolicy';
import {TopicOverloadPolicy} from './TopicOverloadPolicy';
import {TopicOverloadError} from '../../HazelcastError';
import Long = require('long');

export const RINGBUFFER_PREFIX = '_hz_rb_';
export const TOPIC_INITIAL_BACKOFF = 100;
export const TOPIC_MAX_BACKOFF = 2000;

export class ReliableTopicProxy<E> implements ITopic<E> {
    private ringbuffer: IRingbuffer<RawTopicMessage>;
    private localAddress: Address;
    private batchSize: number;
    private runners: {[key: string]: ReliableTopicListenerRunner<E>} = {};
    private serializationService: SerializationService;
    private overloadPolicy: TopicOverloadPolicy;
    private name: string;

    constructor(name: string, client: HazelcastClient) {
        this.ringbuffer = client.getRingbuffer<RawTopicMessage>(RINGBUFFER_PREFIX + name);
        this.localAddress = client.getClusterService().getClientInfo().localAddress;
        var configs = client.getConfig().reliableTopicConfigs;
        var config: ReliableTopicConfig = configs[name] || configs['default'];
        this.batchSize = config.readBatchSize;
        this.overloadPolicy = config.overloadPolicy;
        this.serializationService = client.getSerializationService();
        this.name = name;
    }

    addMessageListener(listener: TopicMessageListener<E>): string {
        var listenerId = UuidUtil.generate();

        var runner = new ReliableTopicListenerRunner(listenerId, listener, this.ringbuffer,
            this.batchSize, this.serializationService, this);

        this.runners[listenerId] = runner;

        this.ringbuffer.tailSequence().then((sequence: Long) => {
            runner.sequenceNumber = sequence.toNumber() + 1;
            runner.next();
        });

        return listenerId;
    }


    removeMessageListener(id: string): boolean {
        var runner = this.runners[id];

        if (!runner) {
            return false;
        }

        runner.cancel();

        delete this.runners[id];

        return true;
    }

    publish(message: E): Promise<void> {
        var reliableTopicMessage = new RawTopicMessage();
        reliableTopicMessage.payload = this.serializationService.toData(message);
        reliableTopicMessage.publishTime = Long.fromNumber(new Date().getTime());
        reliableTopicMessage.publisherAddress = this.localAddress;

        switch (this.overloadPolicy) {
            case TopicOverloadPolicy.ERROR:
                return this.addWithError(reliableTopicMessage);
            case TopicOverloadPolicy.DISCARD_NEWEST:
                return this.addOrDiscard(reliableTopicMessage);
            case TopicOverloadPolicy.DISCARD_OLDEST:
                return this.addOrOverwrite(reliableTopicMessage);
            case TopicOverloadPolicy.BLOCK:
                return this.addWithBackoff(reliableTopicMessage);
            default:
                throw new RangeError('Unknown overload policy');
        }
    }

    private addOrDiscard(reliableTopicMessage: RawTopicMessage): Promise<void> {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy.FAIL).then<void>(() => {
            return null;
        });
    }

    private addWithError(reliableTopicMessage: RawTopicMessage): Promise<void> {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy.FAIL).then<void>((seq: Long) => {
            if (seq.toNumber() === -1) {
                throw new TopicOverloadError('Failed to publish message: ' + reliableTopicMessage +
                    ' on topic: ' + this.getName());
            }

            return null;
        });
    }

    private addOrOverwrite(reliableTopicMessage: RawTopicMessage): Promise<void> {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy.OVERWRITE).then<void>(() => {
            return null;
        });
    }

    private addWithBackoff(reliableTopicMessage: RawTopicMessage): Promise<void> {

        var resolve: Function;

        var promise = new Promise<void>(function () {
            resolve = arguments[0];
        });

        this.trySendMessage(reliableTopicMessage, TOPIC_INITIAL_BACKOFF, resolve);

        return promise;
    }

    private trySendMessage(message: RawTopicMessage, delay: number, resolve: Function) {
        this.ringbuffer.add(message, OverflowPolicy.FAIL).then((seq: Long) => {
            if (seq.toNumber() === -1) {
                var newDelay = delay *= 2;

                if (newDelay > TOPIC_MAX_BACKOFF) {
                    newDelay = TOPIC_MAX_BACKOFF;
                }

                this.trySendMessage(message, newDelay, resolve);
            } else {
                resolve();
            }

        });
    }

    public getRingbuffer(): IRingbuffer<RawTopicMessage> {
        return this.ringbuffer;
    }

    public getName(): String {
        return this.name;
    }

    destroy(): Promise<void> {
        for (var k in this.runners) {
            var runner = this.runners[k];
            runner.cancel();
        }

        return this.ringbuffer.destroy();
    }

}
