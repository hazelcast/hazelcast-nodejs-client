/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var Buffer = require('safe-buffer').Buffer;
var expect = require('chai').expect;
var Long = require('long');
var ObjectData = require('../../lib/serialization/ObjectData');
var ODInp = ObjectData.ObjectDataInput;
var ODOut = ObjectData.ObjectDataOutput;

describe('ObjectData Test', function () {

    var isStandardUTFValues = [true, false];

    isStandardUTFValues.forEach(function(isStandardUTF) {
        var out = new ODOut(null, true, isStandardUTF);
        var label = ' - ' + (isStandardUTF ? 'standard' : 'legacy') + ' string serialization';

        before(function () {
            out.write(15);
            out.write(Buffer.from(['t'.charCodeAt(0), 'e'.charCodeAt(0), 's'.charCodeAt(0), 't'.charCodeAt(0)]));
            out.writeBoolean(true);
            out.writeBooleanArray([true, false, false, true, true]);
            out.writeByte(255 | 0);
            out.writeByteArray([0 | 0, 1 | 0, 65535 | 0]);
            out.writeBytes('bytes');
            out.writeChar('∂');
            out.writeCharArray(['h', 'a', 'z', 'e', 'l']);
            out.writeChars('cast');
            out.writeDouble(435437.23);
            out.writeDoubleArray([21.2, 0, -34253.2, -436, 41, 0.444444444444444444]);
            out.writeFloat(3.4);
            out.writeFloatArray([21.2, 0, -34253.2, -436, 41, 0.444444444444444444]);
            out.writeInt(9876543);
            out.writeIntArray([1, -2, 0, 54]);
            out.writeLong(new Long(255, 255));
            out.writeLongArray([new Long(255, 255), Long.fromNumber(-2)]);
            out.writeShort(32767);
            out.writeZeroBytes(6);
            out.writeShortArray([-32768, 0, 32767]);
            out.writeUTF('selamœ∑®ßåç∫˙˜');
            out.writeUTFArray([
                '',
                'istanbul',
                'üsküdar',
                '∑@√≤¬µç√ç¨ç¬|¨®¨i$üsküdar  fatih'
            ]);
        });

        it('read' + label, function () {
            var inp = new ODInp(out.toBuffer(), 0, null, true, isStandardUTF);
            expect(inp.read()).to.equal(15);
            expect(inp.read()).to.equal('t'.charCodeAt(0));
            expect(inp.read()).to.equal('e'.charCodeAt(0));
            expect(inp.read()).to.equal('s'.charCodeAt(0));
            expect(inp.read()).to.equal('t'.charCodeAt(0));
            expect(inp.readBoolean()).to.be.true;
            expect(inp.readBooleanArray()).to.deep.equal([true, false, false, true, true]);
            expect(inp.readByte()).to.equal(255);
            expect(inp.readByteArray()).to.deep.equal([0, 1, 255]);
            var readBytes = [];
            readBytes.push(inp.readByte());
            readBytes.push(inp.readByte());
            readBytes.push(inp.readByte());
            readBytes.push(inp.readByte());
            readBytes.push(inp.readByte());
            expect(String.fromCharCode.apply(null, readBytes)).to.equal('bytes');
            expect(inp.readChar()).to.equal('∂');
            expect(inp.readCharArray()).to.deep.equal(['h', 'a', 'z', 'e', 'l']);
            expect(inp.readCharArray().join('')).to.equal('cast');
            expect(inp.readDouble()).to.equals(435437.23);
            inp.readDoubleArray().forEach(function (fl, index) {
                expect(fl).to.be.closeTo([21.2, 0, -34253.2, -436, 41, 0.444444444444444444][index], 0.001);
            });
            expect(inp.readFloat()).to.be.closeTo(3.4, 0.0001);
            inp.readFloatArray().forEach(function (fl, index) {
                expect(fl).to.be.closeTo([21.2, 0, -34253.2, -436, 41, 0.444444444444444444][index], 0.001);
            });
            expect(inp.readInt()).to.equal(9876543);
            expect(inp.readIntArray()).to.deep.equal([1, -2, 0, 54]);
            expect(inp.readLong()).to.deep.equal(new Long(255, 255));
            expect(inp.readLongArray()).to.deep.equal([new Long(255, 255), new Long(4294967294, 4294967295)]);
            expect(inp.readShort()).to.equal(32767);
            inp.skipBytes(6);
            expect(inp.readShortArray()).to.deep.equal([-32768, 0, 32767]);
            expect(inp.readUTF()).to.equal('selamœ∑®ßåç∫˙˜');
            expect(inp.readUTFArray()).to.deep.equal([
                '',
                'istanbul',
                'üsküdar',
                '∑@√≤¬µç√ç¨ç¬|¨®¨i$üsküdar  fatih'
            ]);
            inp.reset();
            expect(inp.read()).to.equal(15);
        });

        it('read from pos' + label, function () {
            var inp = new ODInp(out.toBuffer(), 0, null, true, isStandardUTF);
            inp.read();
            expect(inp.read(0)).to.equal(15);
        });

        it('position' + label, function () {
            var inp = new ODInp(out.toBuffer(), 0, null, true, isStandardUTF);
            inp.read();
            inp.position(0);
            expect(inp.read()).to.equal(15);
        });

        it('non integer position does not affect' + label, function () {
            var inp = new ODInp(out.toBuffer(), 0, null, true, isStandardUTF);
            inp.read();
            inp.position(0.5);
            expect(inp.read()).to.equal('t'.charCodeAt(0));
        });
    });
});
