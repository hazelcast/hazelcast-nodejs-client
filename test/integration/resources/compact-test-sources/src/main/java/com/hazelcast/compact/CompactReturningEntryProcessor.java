package com.hazelcast.compact;

import com.hazelcast.map.EntryProcessor;

import java.util.Map;

public class CompactReturningEntryProcessor implements EntryProcessor<Object, Object, Object> {
    @Override
    public Object process(Map.Entry entry) {
        return Outer.INSTANCE;
    }
}
