import {ClientMessage, Frame, LinkedListFrame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';

export class ReaderAndWriter {
    private chunks: Buffer[] = [];
    private chunksTotalSize: number = 0;
    private frameSize: number = 0;
    private writeOffset: number = -1;

    read(): Frame {
        if (this.chunksTotalSize < BitsUtil.INT_SIZE_IN_BYTES) {
            return null;
        }
        if (this.frameSize === 0) {
            this.frameSize = this.readFrameSize();
        }
        if (this.chunksTotalSize < this.frameSize) {
            return null;
        }
        let content: Buffer;
        let flags: number;

        const buffer: Buffer = this.chunks.length === 1 ? this.chunks[0] : Buffer.concat(this.chunks, this.chunksTotalSize);
        if (this.chunksTotalSize > this.frameSize) {
            if (this.chunks.length === 1) {
                this.chunks[0] = buffer.slice(this.frameSize);
            } else {
                this.chunks = [buffer.slice(this.frameSize)];
            }
            content = buffer.slice(6, this.frameSize);
            flags = buffer.readUInt16LE(4);
        } else {
            this.chunks = [];
        }
        this.chunksTotalSize -= this.frameSize;
        this.frameSize = 0;

        const frame: Frame = new Frame(content, flags);
        return frame;
    }

    private readFrameSize(): number {
        if (this.chunks[0].length >= BitsUtil.INT_SIZE_IN_BYTES) {
            return this.chunks[0].readInt32LE(0);
        }
        let readChunksSize = 0;
        for (let i = 0; i < this.chunks.length; i++) {
            readChunksSize += this.chunks[i].length;
            if (readChunksSize >= BitsUtil.INT_SIZE_IN_BYTES) {
                const merged = Buffer.concat(this.chunks.slice(0, i + 1), readChunksSize);
                return merged.readInt32LE(0);
            }
        }
        throw new Error('Detected illegal internal call in FrameReader!');
    }

    // tslint:disable-next-line:member-ordering
    getFrames(clientMessage: ClientMessage): LinkedListFrame {
        return new LinkedListFrame(clientMessage.get());
    }

    // tslint:disable-next-line:member-ordering
    readFrom(frame: Frame): ClientMessage {
        const message: ClientMessage = new ClientMessage(frame);
        const readFlag: Frame = this.read();
        for (; ;) {
            if (readFlag !== null) {
                message.add(frame);
                if (ClientMessage.isFlagSet(message.getTail().flags, ClientMessage.IS_FINAL_FLAG)) {
                    return message;
                }
            } else {
                return message;
            }
        }
    }
    // tslint:disable-next-line:member-ordering
    write(clientMessage: ClientMessage): Buffer {
        const buffer: Buffer = Buffer.allocUnsafe(clientMessage.getFrameLength());
        let currentFrame = clientMessage.get();
        const length = currentFrame.content.length;
        const frameLength = length + 6;
        const flagsOffset = 4 + this.writeOffset;
        while (currentFrame !== null) {
            this.writeOffset = -1;
            buffer.writeInt32LE(frameLength, 0);
            this.writeOffset = this.writeOffset + 4;
            if (currentFrame.next === null) {
                // tslint:disable-next-line:no-bitwise
                buffer.writeInt16LE(currentFrame.flags | ClientMessage.IS_FINAL_FLAG , flagsOffset);
            } else {
                buffer.writeInt16LE(currentFrame.flags, flagsOffset);
            }
            this.writeOffset = this.writeOffset + 2;
            for (let i = 0; i < length; i++) {
                buffer.writeInt8(currentFrame.content.indexOf(i), this.writeOffset);
                this.writeOffset++;
            }
            currentFrame = currentFrame.next;
        }
        return buffer;
    }

}
