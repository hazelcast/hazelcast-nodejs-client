import {DataInput, DataOutput} from './Data';
import {AbstractPredicate} from './PredicateFactory';
import {Predicate, IterationType} from '../core/Predicate';
import {enumFromString} from '../Util';
import {Comparator} from '../core/Comparator';

export class SqlPredicate extends AbstractPredicate {

    private sql: string;

    constructor(sql: string) {
        super();
        this.sql = sql;
    }

    readData(input: DataInput): any {
        this.sql = input.readUTF();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.sql);
    }

    getClassId(): number {
        return 0;
    }
}

export class AndPredicate extends AbstractPredicate {

    private predicates: Predicate[];

    constructor(...predicates: Predicate[]) {
        super();
        this.predicates = predicates;
    }

    readData(input: DataInput): any {
        var s = input.readInt();
        this.predicates = [];
        for (var i = 0; i < s; i++) {
            this.predicates[i] = input.readObject();
        }
    }

    writeData(output: DataOutput) {
        output.writeInt(this.predicates.length);
        this.predicates.forEach(function (pred: Predicate) {
            output.writeObject(pred);
        });
    }

    getClassId(): number {
        return 1;
    }
}

export class BetweenPredicate extends AbstractPredicate {

    private field: string;
    private from: any;
    private to: any;

    constructor(field: string, from: any, to: any) {
        super();
        this.field = field;
        this.from = from;
        this.to = to;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        this.from = input.readObject();
        this.to = input.readObject();
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeObject(this.from);
        output.writeObject(this.to);
    }

    getClassId(): number {
        return 2;
    }
}

export class EqualPredicate extends AbstractPredicate {

    private field: string;
    private value: any;

    constructor(field: string, value: any) {
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

    getClassId(): number {
        return 3;
    }
}

export class GreaterLessPredicate extends AbstractPredicate {

    private field: string;
    private value: any;
    private equal: boolean;
    private less: boolean;

    constructor (field: string, value: any, equal: boolean, less: boolean) {
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

    getClassId(): number {
        return 4;
    }
}

export class LikePredicate extends AbstractPredicate {

    private field: string;
    private expr: string;

    constructor(field: string, expr: string) {
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

    getClassId(): number {
        return 5;
    }
}

export class ILikePredicate extends LikePredicate {
    getClassId(): number {
        return 6;
    }
}

export class InPredicate extends AbstractPredicate {
    private field: string;
    private values: any[];

    constructor(field: string, ...values: any[]) {
        super();
        this.field = field;
        this.values = values;
    }

    readData(input: DataInput): any {
        this.field = input.readUTF();
        var s = input.readInt();
        this.values = [];
        for (var i = 0; i < s; i++) {
            this.values.push(input.readObject());
        }
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeUTF(this.field);
        output.writeInt(this.values.length);
        this.values.forEach(function(val) {
            output.writeObject(val);
        });
    }

    getClassId(): number {
        return 7;
    }
}

export class InstanceOfPredicate extends AbstractPredicate {

    private className: string;

    constructor(className: string) {
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

    getClassId(): number {
        return 8;
    }
}

export class NotEqualPredicate extends EqualPredicate {
    getClassId(): number {
        return 9;
    }
}

export class NotPredicate extends AbstractPredicate {
    private pred: Predicate;

    constructor(pred: Predicate) {
        super();
        this.pred = pred;
    }

    readData(input: DataInput): any {
        this.pred = input.readObject();
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeObject(this.pred);
    }

    getClassId(): number {
        return 10;
    }
}

export class OrPredicate extends AbstractPredicate {

    private preds: Predicate[];

    constructor(...preds: Predicate[]) {
        super();
        this.preds = preds;
    }

    readData(input: DataInput): any {
        var s = input.readInt();
        this.preds = [];
        for (var i = 0; i < s; i++) {
            this.preds.push(input.readObject());
        }
        return this;
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.preds.length);
        this.preds.forEach(function (pred: Predicate) {
            output.writeObject(pred);
        });
    }

    getClassId(): number {
        return 11;
    }
}

export class RegexPredicate extends AbstractPredicate {
    private field: string;
    private regex: string;

    constructor(field: string, regex: string) {
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

    getClassId(): number {
        return 12;
    }
}

export class FalsePredicate extends AbstractPredicate {

    static INSTANCE: FalsePredicate = new FalsePredicate();

    readData(input: DataInput): any {
        //Empty method
    }

    writeData(output: DataOutput): any {
        //Empty method
    }

    getClassId(): number {
        return 13;
    }
}


export class TruePredicate extends AbstractPredicate {

    static INSTANCE: TruePredicate = new TruePredicate();

    readData(input: DataInput): any {
        //Empty method
    }

    writeData(output: DataOutput): any {
        //Empty method
    }

    getClassId(): number {
        return 14;
    }
}

export class PagingPredicate extends AbstractPredicate {

    private static NULL_ANCHOR: [number, [any, any]] = [-1, null];

    private internalPredicate: Predicate;
    private pageSize: number;
    private comparatorObject: Comparator;
    private page: number = 0;
    private iterationType: IterationType = IterationType.ENTRY;
    private anchorList: [number, [any, any]][] = [];

    constructor(internalPredicate: Predicate, pageSize: number, comparator: Comparator) {
        super();
        this.internalPredicate = internalPredicate;
        this.pageSize = pageSize;
        this.comparatorObject = comparator;
    }

    readData(input: DataInput): any {
        this.internalPredicate = input.readObject();
        this.comparatorObject = input.readObject();
        this.page = input.readInt();
        this.pageSize = input.readInt();
        this.iterationType = enumFromString<IterationType>(IterationType, input.readUTF());
        this.anchorList = [];
        var size = input.readInt();
        for (var i = 0; i < size; i++) {
            var p = input.readInt();
            var k = input.readObject();
            var v = input.readObject();
            this.anchorList.push([p, [k, v]]);
        }
    }

    writeData(output: DataOutput): void {
        output.writeObject(this.internalPredicate);
        output.writeObject(this.comparatorObject);
        output.writeInt(this.page);
        output.writeInt(this.pageSize);
        output.writeUTF(IterationType[this.iterationType]);
        output.writeInt(this.anchorList.length);
        this.anchorList.forEach(function(anchorEntry: [number, [any, any]]) {
            output.writeInt(anchorEntry[0]);
            output.writeObject(anchorEntry[1][0]);
            output.writeObject(anchorEntry[1][1]);
        });
    }

    getClassId(): number {
        return 15;
    }

    setIterationType(iterationType: IterationType) {
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

    setAnchor(page: number, anchor: [any, any]) {
        var anchorEntry: [number, [any, any]] = [page, anchor];
        var anchorCount = this.anchorList.length;
        if (page < anchorCount) {
            this.anchorList[page] = anchorEntry;
        } else if (page === anchorCount) {
            this.anchorList.push(anchorEntry);
        } else {
            throw new Error('Anchor index is not correct, expected: ' + page + 'found: ' + anchorCount);
        }
    }

    getPage(): number {
        return this.page;
    }

    getPageSize(): number {
        return this.pageSize;
    }

    getNearestAnchorEntry(): [number, [any, any]] {
        var anchorCount = this.anchorList.length;
        if (this.page === 0 || anchorCount === 0) {
            return PagingPredicate.NULL_ANCHOR;
        }
        var anchoredEntry: [number, [any, any]];
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

