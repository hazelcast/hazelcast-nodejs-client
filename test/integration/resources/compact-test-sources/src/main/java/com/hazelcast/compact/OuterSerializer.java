package com.hazelcast.compact;

import com.hazelcast.nio.serialization.compact.CompactReader;
import com.hazelcast.nio.serialization.compact.CompactSerializer;
import com.hazelcast.nio.serialization.compact.CompactWriter;

public class OuterSerializer implements CompactSerializer<Outer> {
    @Override
    public Outer read(CompactReader compactReader) {
        return new Outer(compactReader.readInt32("int_field"), compactReader.readCompact("inner_field"));
    }

    @Override
    public void write(CompactWriter compactWriter, Outer outer) {
        compactWriter.writeInt32("int_field", outer.getIntField());
        compactWriter.writeCompact("inner_field", outer.getInnerField());
    }
}
