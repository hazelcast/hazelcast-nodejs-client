package com.hazelcast.compact;

import java.util.Objects;

public class Inner {
    private final String stringField;

    public Inner(String stringField) {
        this.stringField = stringField;
    }

    public String getStringField() {
        return stringField;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Inner inner = (Inner) o;
        return Objects.equals(stringField, inner.stringField);
    }

    @Override
    public int hashCode() {
        return Objects.hash(stringField);
    }
}
