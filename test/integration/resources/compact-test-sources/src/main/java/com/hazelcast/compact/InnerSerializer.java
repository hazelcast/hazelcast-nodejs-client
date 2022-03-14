package com.hazelcast.compact;

import com.hazelcast.nio.serialization.compact.CompactReader;
import com.hazelcast.nio.serialization.compact.CompactSerializer;
import com.hazelcast.nio.serialization.compact.CompactWriter;

public class InnerSerializer implements CompactSerializer<Inner> {
    @Override
    public Inner read(CompactReader compactReader) {
        return new Inner(compactReader.readString("string_field"));
    }

    @Override
    public void write(CompactWriter compactWriter, Inner inner) {
        compactWriter.writeString("string_field", inner.getStringField());
    }
}
