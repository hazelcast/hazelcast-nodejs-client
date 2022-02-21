/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { Schema } = require('../../../../lib/serialization/compact/Schema');
const { SchemaService } = require('../../../../lib/serialization/compact/SchemaService');
const { FieldKind } = require('../../../../lib');
const { FieldDescriptor } = require('../../../../lib/serialization/generic_record/FieldDescriptor');

chai.should();

describe('SchemaServiceTest', function () {
    let schemaService;
    let fakeInvocationService;

    beforeEach(function() {
        fakeInvocationService = {invoke: sandbox.fake.resolves()};
        const getFakeInvocationService = () => fakeInvocationService;
        schemaService = new SchemaService(getFakeInvocationService, {
            trace: () => {},
            log: () => {},
            error: () => {},
            warn: () => {},
            info: () => {},
            debug: () => {},
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should not send invocation if schema is already registered', async function () {
        const fields = [];
        for (const f in FieldKind) {
            const fieldKind = +f;
            // enums are reverse mapped.
            if (!isNaN(+fieldKind) && fieldKind !== FieldKind.PORTABLE && fieldKind !== FieldKind.ARRAY_OF_PORTABLE) {
                fields.push(new FieldDescriptor(FieldKind[fieldKind], fieldKind));
            }
        }
        const schema = new Schema('something', fields);
        await schemaService.put(schema);
        await schemaService.put(schema);

        fakeInvocationService.invoke.callCount.should.be.eq(1);
    });
});
