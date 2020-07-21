/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ClientMessage, Frame, NULL_FRAME} from '../../ClientMessage';

export class CodecUtil {
    static fastForwardToEndFrame(clientMessage: ClientMessage): void {
        // We are starting from 1 because of the BEGIN_FRAME we read
        // in the beginning of the decode method
        let numberOfExpectedEndFrames = 1;
        let frame: Frame;
        while (numberOfExpectedEndFrames !== 0) {
            frame = clientMessage.nextFrame();
            if (frame.isEndFrame()) {
                numberOfExpectedEndFrames--;
            } else if (frame.isBeginFrame()) {
                numberOfExpectedEndFrames++;
            }
        }
    }

    static encodeNullable<T>(clientMessage: ClientMessage, value: T, encoder: (msg: ClientMessage, val: T) => void): void {
        if (value == null) {
            clientMessage.addFrame(NULL_FRAME.copy());
        } else {
            encoder(clientMessage, value);
        }
    }

    static decodeNullable<T>(clientMessage: ClientMessage, decoder: (msg: ClientMessage) => T): T {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : decoder(clientMessage);
    }

    static nextFrameIsDataStructureEndFrame(clientMessage: ClientMessage): boolean {
        return clientMessage.peekNextFrame().isEndFrame();
    }

    /**
     * Returns whether the next frame is {@link NULL_FRAME} or not.
     * If it is a {@link NULL_FRAME}, this method consumes the iterator
     * by calling {@link ClientMessage.nextFrame} once to skip the {@link NULL_FRAME}.
     */
    static nextFrameIsNullFrame(clientMessage: ClientMessage): boolean {
        const isNull = clientMessage.peekNextFrame().isNullFrame();
        if (isNull) {
            clientMessage.nextFrame();
        }
        return isNull;
    }
}
