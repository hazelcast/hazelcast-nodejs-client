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

import {Comparator} from '../core/Comparator';
import {IterationType, Predicate, PagingPredicate} from '../core/Predicate';
import {enumFromString} from '../Util';
import {DataInput, DataOutput} from './Data';
import {IdentifiedDataSerializable} from './Serializable';

export const PREDICATE_FACTORY_ID = -20;

abstract class AbstractPredicate implements Predicate {

    abstract classId: number;
    factoryId = PREDICATE_FACTORY_ID;

    abstract readData(input: DataInput): any;

    abstract writeData(output: DataOutput): void;
}

export class SqlPredicate extends AbstractPredicate {

    static CLASS_ID = 0;

    classId = SqlPredicate.CLASS_ID;
    private sql: string;

    constructor(sql?: string) {
        super();
        this.sql = sql;
    }

    readData(input: DataInput): any {
        this.sql = input.readUTF();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.sql);
    }
}

export class AndPredicate extends AbstractPredicate {

    static CLASS_ID = 1;

    classId = AndPredicate.CLASS_ID;
    private predicates: Predicate[];

    constructor(...predicates: Predicate[]) {
        super();
        this.predicates = predicates;
    }

    readData(input: DataInput): any {
        const s = input.readInt();
        this.predicates = [];
        for (let i = 0; i < s; i++) {
            this.predicates[i] = input.readObject();
        }
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.predicates.length);
        this.predicates.forEach(function (predicate: Predicate): void {
            output.writeObject(predicate);
        });
    }
}

export class BetweenPredicate extends AbstractPredicate {

    static CLASS_ID = 2;

    classId = BetweenPredicate.CLASS_ID;
    private field: string;
    private from: any;
    private to: any;

    constructor(field?: string, from?: any, to?: any) {
        super();
        this.field = field;
        this.from = from;
        this.to = to;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        this.to = input.readObject();
        this.from = input.readObject();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeObject(this.to);
        output.writeObject(this.from);
    }
}

export class EqualPredicate extends AbstractPredicate {

    static CLASS_ID = 3;

    classId = EqualPredicate.CLASS_ID;
    private field: string;
    private value: any;

    constructor(field?: string, value?: any) {
        super();
        this.field = field;
        this.value = value;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        this.value = input.readObject();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeObject(this.value);
    }
}

export class GreaterLessPredicate extends AbstractPredicate {

    static CLASS_ID = 4;

    classId = GreaterLessPredicate.CLASS_ID;
    private field: string;
    private value: any;
    private equal: boolean;
    private less: boolean;

    constructor(field?: string, value?: any, equal?: boolean, less?: boolean) {
        super();
        this.field = field;
        this.value = value;
        this.equal = equal;
        this.less = less;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        this.value = input.readObject();
        this.equal = input.readBoolean();
        this.less = input.readBoolean();
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeObject(this.value);
        output.writeBoolean(this.equal);
        output.writeBoolean(this.less);
    }
}

export class LikePredicate extends AbstractPredicate {

    static CLASS_ID = 5;

    classId = LikePredicate.CLASS_ID;
    private field: string;
    private expr: string;

    constructor(field?: string, expr?: string) {
        super();
        this.field = field;
        this.expr = expr;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        this.expr = input.readUTF();
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeUTF(this.expr);
    }
}

export class ILikePredicate extends LikePredicate {

    static CLASS_ID = 6;

    classId = ILikePredicate.CLASS_ID;
}

export class InPredicate extends AbstractPredicate {

    static CLASS_ID = 7;

    classId = InPredicate.CLASS_ID;
    private field: string;
    private values: any[];

    constructor(field?: string, ...values: any[]) {
        super();
        this.field = field;
        this.values = values;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        const s = input.readInt();
        this.values = [];
        for (let i = 0; i < s; i++) {
            this.values.push(input.readObject());
        }
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeInt(this.values.length);
        this.values.forEach(function (val): void {
            output.writeObject(val);
        });
    }
}

export class InstanceOfPredicate extends AbstractPredicate {

    static CLASS_ID = 8;

    classId = InstanceOfPredicate.CLASS_ID;
    private className: string;

    constructor(className?: string) {
        super();
        this.className = className;
    }

    readData(input: DataInput): any {
        this.className = input.readUTF();
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.className);
    }
}

export class NotEqualPredicate extends EqualPredicate {

    static CLASS_ID = 9;

    classId = NotEqualPredicate.CLASS_ID;
}

export class NotPredicate extends AbstractPredicate {

    static CLASS_ID = 10;

    classId = NotPredicate.CLASS_ID;
    private predicate: Predicate;

    constructor(predicate?: Predicate) {
        super();
        this.predicate = predicate;
    }

    readData(input: DataInput): any {
        this.predicate = input.readObject();
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeObject(this.predicate);
    }
}

export class OrPredicate extends AbstractPredicate {

    static CLASS_ID = 11;

    classId = OrPredicate.CLASS_ID;
    private predicates: Predicate[];

    constructor(...predicates: Predicate[]) {
        super();
        this.predicates = predicates;
    }

    readData(input: DataInput): any {
        const s = input.readInt();
        this.predicates = [];
        for (let i = 0; i < s; i++) {
            this.predicates.push(input.readObject());
        }
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.predicates.length);
        this.predicates.forEach(function (predicate: Predicate): void {
            output.writeObject(predicate);
        });
    }
}

export class RegexPredicate extends AbstractPredicate {

    static CLASS_ID = 12;

    classId = RegexPredicate.CLASS_ID;
    private field: string;
    private regex: string;

    constructor(field?: string, regex?: string) {
        super();
        this.field = field;
        this.regex = regex;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        this.regex = input.readUTF();
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeUTF(this.regex);
    }
}

export class FalsePredicate extends AbstractPredicate {

    static CLASS_ID = 13;

    classId = FalsePredicate.CLASS_ID;
    static INSTANCE: FalsePredicate = new FalsePredicate();

    readData(input: DataInput): any {
        // no-op
    }

    writeData(output: DataOutput): any {
        // no-op
    }
}

export class TruePredicate extends AbstractPredicate {

    static CLASS_ID = 14;

    classId = TruePredicate.CLASS_ID;
    static INSTANCE: TruePredicate = new TruePredicate();

    readData(input: DataInput): any {
        // no-op
    }

    writeData(output: DataOutput): any {
        // no-op
    }
}

export class PagingPredicateImpl extends AbstractPredicate implements PagingPredicate {

    private static NULL_ANCHOR: [number, [any, any]] = [-1, null];
    static CLASS_ID = 15;

    classId = PagingPredicateImpl.CLASS_ID;
    private internalPredicate: Predicate;
    private pageSize: number;
    private comparatorObject: Comparator;
    private page = 0;
    private iterationType: IterationType = IterationType.ENTRY;
    private anchorList: Array<[number, [any, any]]> = [];

    constructor(internalPredicate?: Predicate, pageSize?: number, comparator?: Comparator) {
        super();
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

    readData(input: DataInput): any {
        this.internalPredicate = input.readObject();
        this.comparatorObject = input.readObject();
        this.page = input.readInt();
        this.pageSize = input.readInt();
        this.iterationType = enumFromString<IterationType>(IterationType, input.readUTF());
        this.anchorList = [];
        const size = input.readInt();
        for (let i = 0; i < size; i++) {
            const p = input.readInt();
            const k = input.readObject();
            const v = input.readObject();
            this.anchorList.push([p, [k, v]]);
        }
    }

    writeData(output: DataOutput): void {
        output.writeObject(this.internalPredicate);
        output.writeObject(this.comparatorObject);
        output.writeInt(this.page);
        output.writeInt(this.pageSize);
        output.writeUTF(this.iterationType);
        output.writeInt(this.anchorList.length);
        this.anchorList.forEach(function (anchorEntry: [number, [any, any]]): void {
            output.writeInt(anchorEntry[0]);
            output.writeObject(anchorEntry[1][0]);
            output.writeObject(anchorEntry[1][1]);
        });
    }

    setIterationType(iterationType: IterationType): void {
        this.iterationType = iterationType;
    }

    nextPage(): PagingPredicate {
        this.page++;
        return this;
    }

    previousPage(): PagingPredicate {
        this.page--;
        return this;
    }

    setPage(page: number): PagingPredicate {
        this.page = page;
        return this;
    }

    setAnchor(page: number, anchor: [any, any]): void {
        const anchorEntry: [number, [any, any]] = [page, anchor];
        const anchorCount = this.anchorList.length;
        if (page < anchorCount) {
            this.anchorList[page] = anchorEntry;
        } else if (page === anchorCount) {
            this.anchorList.push(anchorEntry);
        } else {
            throw new RangeError('Anchor index is not correct, expected: '
                + page + 'found: ' + anchorCount);
        }
    }

    setAnchorList(anchorList: Array<[number, [any, any]]>): void {
        this.anchorList = anchorList;
    }

    getPredicate(): Predicate {
        return this.internalPredicate;
    }

    getAnchorList(): Array<[number, [any, any]]> {
        return this.anchorList;
    }

    getPage(): number {
        return this.page;
    }

    getPageSize(): number {
        return this.pageSize;
    }

    getNearestAnchorEntry(): [number, [any, any]] {
        const anchorCount = this.anchorList.length;
        if (this.page === 0 || anchorCount === 0) {
            return PagingPredicateImpl.NULL_ANCHOR;
        }
        let anchoredEntry: [number, [any, any]];
        if (this.page < anchorCount) {
            anchoredEntry = this.anchorList[this.page - 1];
        } else {
            anchoredEntry = this.anchorList[anchorCount - 1];
        }
        return anchoredEntry;
    }

    getIterationType(): IterationType {
        return this.iterationType;
    }

    getComparator(): Comparator {
        return this.comparatorObject;
    }
}

interface PredicateConstructor {
    new (): Predicate;
    CLASS_ID: number;
}

const allPredicates: Array<PredicateConstructor> = [
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

const idToConstructorMap: { [id: number]: PredicateConstructor } = {};
for (const predicate of allPredicates) {
    idToConstructorMap[predicate.CLASS_ID] = predicate;
}

export function predicateFactory(classId: number): IdentifiedDataSerializable {
    if (idToConstructorMap[classId]) {
        return new idToConstructorMap[classId]();
    } else {
        throw new RangeError(`There is no default predicate with id ${classId}.`);
    }
}
