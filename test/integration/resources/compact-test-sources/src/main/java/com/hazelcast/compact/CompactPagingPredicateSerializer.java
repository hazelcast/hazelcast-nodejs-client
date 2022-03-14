package com.hazelcast.compact;

import com.hazelcast.nio.serialization.compact.CompactReader;
import com.hazelcast.nio.serialization.compact.CompactSerializer;
import com.hazelcast.nio.serialization.compact.CompactWriter;

public class CompactPagingPredicateSerializer implements CompactSerializer<CompactPagingPredicate> {
    @Override
    public CompactPagingPredicate read(CompactReader compactReader) {
        return new CompactPagingPredicate();
    }

    @Override
    public void write(CompactWriter compactWriter, CompactPagingPredicate compactPagingPredicate) {

    }
}
