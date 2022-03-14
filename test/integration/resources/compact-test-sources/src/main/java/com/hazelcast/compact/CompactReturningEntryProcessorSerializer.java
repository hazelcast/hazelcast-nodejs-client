package com.hazelcast.compact;

import com.hazelcast.nio.serialization.compact.CompactReader;
import com.hazelcast.nio.serialization.compact.CompactSerializer;
import com.hazelcast.nio.serialization.compact.CompactWriter;

public class CompactReturningEntryProcessorSerializer implements CompactSerializer<CompactReturningEntryProcessor> {
    @Override
    public CompactReturningEntryProcessor read(CompactReader compactReader) {
        return new CompactReturningEntryProcessor();
    }

    @Override
    public void write(CompactWriter compactWriter, CompactReturningEntryProcessor compactReturningEntryProcessor) {

    }
}
