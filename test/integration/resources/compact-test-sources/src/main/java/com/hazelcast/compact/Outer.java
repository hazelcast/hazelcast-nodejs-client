package com.hazelcast.compact;

import java.util.Objects;

public class Outer {
    public static final Outer INSTANCE = new Outer(42, new Inner("42"));

    private final int intField;
    private final Inner innerField;

    public Outer(int intField, Inner innerField) {
        this.intField = intField;
        this.innerField = innerField;
    }

    public int getIntField() {
        return intField;
    }

    public Inner getInnerField() {
        return innerField;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Outer outer = (Outer) o;
        return intField == outer.intField && Objects.equals(innerField, outer.innerField);
    }

    @Override
    public int hashCode() {
        return Objects.hash(intField, innerField);
    }
}
