package com.hazelcast.compact;

import com.hazelcast.nio.serialization.compact.CompactReader;
import com.hazelcast.nio.serialization.compact.CompactSerializer;
import com.hazelcast.nio.serialization.compact.CompactWriter;

public class CompactPredicateSerializer implements CompactSerializer<CompactPredicate> {
    @Override
    public CompactPredicate read(CompactReader compactReader) {
        return new CompactPredicate();
    }

    @Override
    public void write(CompactWriter compactWriter, CompactPredicate compactPredicate) {

    }
}
