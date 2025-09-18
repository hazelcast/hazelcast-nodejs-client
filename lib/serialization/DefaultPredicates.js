"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.predicateFactory = exports.PagingPredicateImpl = exports.TruePredicate = exports.FalsePredicate = exports.RegexPredicate = exports.OrPredicate = exports.NotPredicate = exports.NotEqualPredicate = exports.InstanceOfPredicate = exports.InPredicate = exports.ILikePredicate = exports.LikePredicate = exports.GreaterLessPredicate = exports.EqualPredicate = exports.BetweenPredicate = exports.AndPredicate = exports.SqlPredicate = exports.PREDICATE_FACTORY_ID = void 0;
const Predicate_1 = require("../core/Predicate");
const Util_1 = require("../util/Util");
/** @internal */
exports.PREDICATE_FACTORY_ID = -20;
/** @internal */
class AbstractPredicate {
    constructor() {
        this.factoryId = exports.PREDICATE_FACTORY_ID;
    }
}
/** @internal */
class SqlPredicate extends AbstractPredicate {
    constructor(sql) {
        super();
        this.classId = SqlPredicate.CLASS_ID;
        this.sql = sql;
    }
    readData(input) {
        this.sql = input.readString();
    }
    writeData(output) {
        output.writeString(this.sql);
    }
}
exports.SqlPredicate = SqlPredicate;
SqlPredicate.CLASS_ID = 0;
/** @internal */
class AndPredicate extends AbstractPredicate {
    constructor(...predicates) {
        super();
        this.classId = AndPredicate.CLASS_ID;
        this.predicates = predicates;
    }
    readData(input) {
        const s = input.readInt();
        this.predicates = [];
        for (let i = 0; i < s; i++) {
            this.predicates[i] = input.readObject();
        }
    }
    writeData(output) {
        output.writeInt(this.predicates.length);
        this.predicates.forEach(function (predicate) {
            output.writeObject(predicate);
        });
    }
}
exports.AndPredicate = AndPredicate;
AndPredicate.CLASS_ID = 1;
/** @internal */
class BetweenPredicate extends AbstractPredicate {
    constructor(field, from, to) {
        super();
        this.classId = BetweenPredicate.CLASS_ID;
        this.field = field;
        this.from = from;
        this.to = to;
    }
    readData(input) {
        this.field = input.readString();
        this.to = input.readObject();
        this.from = input.readObject();
    }
    writeData(output) {
        output.writeString(this.field);
        output.writeObject(this.to);
        output.writeObject(this.from);
    }
}
exports.BetweenPredicate = BetweenPredicate;
BetweenPredicate.CLASS_ID = 2;
/** @internal */
class EqualPredicate extends AbstractPredicate {
    constructor(field, value) {
        super();
        this.classId = EqualPredicate.CLASS_ID;
        this.field = field;
        this.value = value;
    }
    readData(input) {
        this.field = input.readString();
        this.value = input.readObject();
    }
    writeData(output) {
        output.writeString(this.field);
        output.writeObject(this.value);
    }
}
exports.EqualPredicate = EqualPredicate;
EqualPredicate.CLASS_ID = 3;
/** @internal */
class GreaterLessPredicate extends AbstractPredicate {
    constructor(field, value, equal, less) {
        super();
        this.classId = GreaterLessPredicate.CLASS_ID;
        this.field = field;
        this.value = value;
        this.equal = equal;
        this.less = less;
    }
    readData(input) {
        this.field = input.readString();
        this.value = input.readObject();
        this.equal = input.readBoolean();
        this.less = input.readBoolean();
        return this;
    }
    writeData(output) {
        output.writeString(this.field);
        output.writeObject(this.value);
        output.writeBoolean(this.equal);
        output.writeBoolean(this.less);
    }
}
exports.GreaterLessPredicate = GreaterLessPredicate;
GreaterLessPredicate.CLASS_ID = 4;
/** @internal */
class LikePredicate extends AbstractPredicate {
    constructor(field, expr) {
        super();
        this.classId = LikePredicate.CLASS_ID;
        this.field = field;
        this.expr = expr;
    }
    readData(input) {
        this.field = input.readString();
        this.expr = input.readString();
        return this;
    }
    writeData(output) {
        output.writeString(this.field);
        output.writeString(this.expr);
    }
}
exports.LikePredicate = LikePredicate;
LikePredicate.CLASS_ID = 5;
/** @internal */
class ILikePredicate extends LikePredicate {
    constructor() {
        super(...arguments);
        this.classId = ILikePredicate.CLASS_ID;
    }
}
exports.ILikePredicate = ILikePredicate;
ILikePredicate.CLASS_ID = 6;
/** @internal */
class InPredicate extends AbstractPredicate {
    constructor(field, ...values) {
        super();
        this.classId = InPredicate.CLASS_ID;
        this.field = field;
        this.values = values;
    }
    readData(input) {
        this.field = input.readString();
        const s = input.readInt();
        this.values = [];
        for (let i = 0; i < s; i++) {
            this.values.push(input.readObject());
        }
        return this;
    }
    writeData(output) {
        output.writeString(this.field);
        output.writeInt(this.values.length);
        this.values.forEach(function (val) {
            output.writeObject(val);
        });
    }
}
exports.InPredicate = InPredicate;
InPredicate.CLASS_ID = 7;
/** @internal */
class InstanceOfPredicate extends AbstractPredicate {
    constructor(className) {
        super();
        this.classId = InstanceOfPredicate.CLASS_ID;
        this.className = className;
    }
    readData(input) {
        this.className = input.readString();
        return this;
    }
    writeData(output) {
        output.writeString(this.className);
    }
}
exports.InstanceOfPredicate = InstanceOfPredicate;
InstanceOfPredicate.CLASS_ID = 8;
/** @internal */
class NotEqualPredicate extends EqualPredicate {
    constructor() {
        super(...arguments);
        this.classId = NotEqualPredicate.CLASS_ID;
    }
}
exports.NotEqualPredicate = NotEqualPredicate;
NotEqualPredicate.CLASS_ID = 9;
/** @internal */
class NotPredicate extends AbstractPredicate {
    constructor(predicate) {
        super();
        this.classId = NotPredicate.CLASS_ID;
        this.predicate = predicate;
    }
    readData(input) {
        this.predicate = input.readObject();
        return this;
    }
    writeData(output) {
        output.writeObject(this.predicate);
    }
}
exports.NotPredicate = NotPredicate;
NotPredicate.CLASS_ID = 10;
/** @internal */
class OrPredicate extends AbstractPredicate {
    constructor(...predicates) {
        super();
        this.classId = OrPredicate.CLASS_ID;
        this.predicates = predicates;
    }
    readData(input) {
        const s = input.readInt();
        this.predicates = [];
        for (let i = 0; i < s; i++) {
            this.predicates.push(input.readObject());
        }
        return this;
    }
    writeData(output) {
        output.writeInt(this.predicates.length);
        this.predicates.forEach(function (predicate) {
            output.writeObject(predicate);
        });
    }
}
exports.OrPredicate = OrPredicate;
OrPredicate.CLASS_ID = 11;
/** @internal */
class RegexPredicate extends AbstractPredicate {
    constructor(field, regex) {
        super();
        this.classId = RegexPredicate.CLASS_ID;
        this.field = field;
        this.regex = regex;
    }
    readData(input) {
        this.field = input.readString();
        this.regex = input.readString();
        return this;
    }
    writeData(output) {
        output.writeString(this.field);
        output.writeString(this.regex);
    }
}
exports.RegexPredicate = RegexPredicate;
RegexPredicate.CLASS_ID = 12;
/** @internal */
class FalsePredicate extends AbstractPredicate {
    constructor() {
        super(...arguments);
        this.classId = FalsePredicate.CLASS_ID;
    }
    readData(_input) {
        // no-op
    }
    writeData(_output) {
        // no-op
    }
}
exports.FalsePredicate = FalsePredicate;
FalsePredicate.CLASS_ID = 13;
FalsePredicate.INSTANCE = new FalsePredicate();
/** @internal */
class TruePredicate extends AbstractPredicate {
    constructor() {
        super(...arguments);
        this.classId = TruePredicate.CLASS_ID;
    }
    readData(_input) {
        // no-op
    }
    writeData(_output) {
        // no-op
    }
}
exports.TruePredicate = TruePredicate;
TruePredicate.CLASS_ID = 14;
TruePredicate.INSTANCE = new TruePredicate();
/** @internal */
class PagingPredicateImpl extends AbstractPredicate {
    constructor(internalPredicate, pageSize, comparator) {
        super();
        this.classId = PagingPredicateImpl.CLASS_ID;
        this.page = 0;
        this.iterationType = Predicate_1.IterationType.ENTRY;
        this.anchorList = [];
        if (pageSize <= 0) {
            throw new TypeError('Page size should be greater than 0!');
        }
        this.pageSize = pageSize;
        if (internalPredicate instanceof PagingPredicateImpl) {
            throw new TypeError('Nested paging predicates are not supported!');
        }
        this.internalPredicate = internalPredicate;
        this.comparatorObject = comparator;
    }
    readData(input) {
        this.internalPredicate = input.readObject();
        this.comparatorObject = input.readObject();
        this.page = input.readInt();
        this.pageSize = input.readInt();
        this.iterationType = (0, Util_1.enumFromString)(Predicate_1.IterationType, input.readString());
        this.anchorList = [];
        const size = input.readInt();
        for (let i = 0; i < size; i++) {
            const p = input.readInt();
            const k = input.readObject();
            const v = input.readObject();
            this.anchorList.push([p, [k, v]]);
        }
    }
    writeData(output) {
        output.writeObject(this.internalPredicate);
        output.writeObject(this.comparatorObject);
        output.writeInt(this.page);
        output.writeInt(this.pageSize);
        output.writeString(this.iterationType);
        output.writeInt(this.anchorList.length);
        this.anchorList.forEach(function (anchorEntry) {
            output.writeInt(anchorEntry[0]);
            output.writeObject(anchorEntry[1][0]);
            output.writeObject(anchorEntry[1][1]);
        });
    }
    nextPage() {
        this.page++;
        return this;
    }
    previousPage() {
        this.page--;
        return this;
    }
    setPage(page) {
        this.page = page;
        return this;
    }
    getPage() {
        return this.page;
    }
    getPageSize() {
        return this.pageSize;
    }
    getComparator() {
        return this.comparatorObject;
    }
    getAnchor() {
        const anchorCount = this.anchorList.length;
        if (this.page === 0 || anchorCount === 0) {
            return PagingPredicateImpl.NULL_ANCHOR;
        }
        let anchoredEntry;
        if (this.page < anchorCount) {
            anchoredEntry = this.anchorList[this.page - 1];
        }
        else {
            anchoredEntry = this.anchorList[anchorCount - 1];
        }
        return anchoredEntry;
    }
    getPredicate() {
        return this.internalPredicate;
    }
    getAnchorList() {
        return this.anchorList;
    }
    setAnchorList(anchorList) {
        this.anchorList = anchorList;
    }
    getIterationType() {
        return this.iterationType;
    }
    setIterationType(iterationType) {
        this.iterationType = iterationType;
    }
}
exports.PagingPredicateImpl = PagingPredicateImpl;
PagingPredicateImpl.NULL_ANCHOR = [-1, null];
PagingPredicateImpl.CLASS_ID = 15;
const allPredicates = [
    SqlPredicate,
    AndPredicate,
    BetweenPredicate,
    EqualPredicate,
    GreaterLessPredicate,
    LikePredicate,
    ILikePredicate,
    InPredicate,
    InstanceOfPredicate,
    NotEqualPredicate,
    NotPredicate,
    OrPredicate,
    RegexPredicate,
    FalsePredicate,
    TruePredicate,
    PagingPredicateImpl,
];
const idToConstructorMap = {};
for (const predicate of allPredicates) {
    idToConstructorMap[predicate.CLASS_ID] = predicate;
}
/** @internal */
function predicateFactory(classId) {
    if (idToConstructorMap[classId]) {
        return new idToConstructorMap[classId]();
    }
    else {
        throw new RangeError(`There is no default predicate with id ${classId}.`);
    }
}
exports.predicateFactory = predicateFactory;
//# sourceMappingURL=DefaultPredicates.js.map