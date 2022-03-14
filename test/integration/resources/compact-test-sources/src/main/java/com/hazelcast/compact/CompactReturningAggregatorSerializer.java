package com.hazelcast.compact;

import com.hazelcast.nio.serialization.compact.CompactReader;
import com.hazelcast.nio.serialization.compact.CompactSerializer;
import com.hazelcast.nio.serialization.compact.CompactWriter;

public class CompactReturningAggregatorSerializer implements CompactSerializer<CompactReturningAggregator> {
    @Override
    public CompactReturningAggregator read(CompactReader compactReader) {
        return new CompactReturningAggregator();
    }

    @Override
    public void write(CompactWriter compactWriter, CompactReturningAggregator compactReturningAggregator) {

    }
}
