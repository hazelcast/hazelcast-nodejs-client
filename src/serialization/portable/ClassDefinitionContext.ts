import {ClassDefinition} from './ClassDefinition';

export class ClassDefinitionContext {
    private factoryId: number;

    private classDefs: {[classId: string]: ClassDefinition};

    constructor(factoryId: number, portableVersion: number) {
        this.factoryId = factoryId;
        this.classDefs = {};
    }

    private static encodeVersionedClassId(classId: number, version: number): string {
        return classId + 'v' + version;
    }

    private static decodeVersionedClassId(encoded: string): [number, number] {
        var re = /(\d+)v(\d+)/;
        var extracted = re.exec(encoded);
        return [Number.parseInt(extracted[1]), Number.parseInt(extracted[2])];
    }

    lookup(classId: number, version: number) {
        var encoded = ClassDefinitionContext.encodeVersionedClassId(classId, version);
        return this.classDefs[encoded];
    }

    register(classDefinition: ClassDefinition): ClassDefinition {
        if (classDefinition === null) {
            return null;
        }
        if (classDefinition.getFactoryId() !== this.factoryId) {
            throw new RangeError(`This factory's number is ${this.factoryId}. 
            Intended factory id is ${classDefinition.getFactoryId()}`);
        }
        var cdKey = ClassDefinitionContext.encodeVersionedClassId(classDefinition.getClassId(), classDefinition.getVersion());
        var current = this.classDefs[cdKey];
        if (current == null) {
            this.classDefs[cdKey] = classDefinition;
            return classDefinition;
        }
        if (current instanceof ClassDefinition && !current.equals(classDefinition)) {
            throw new RangeError(`Incompatible class definition with same class id: ${classDefinition.getClassId()}`);
        }
        return classDefinition;
    }
}
