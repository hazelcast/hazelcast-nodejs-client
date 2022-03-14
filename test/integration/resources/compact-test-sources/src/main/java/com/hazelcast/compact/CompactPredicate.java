package com.hazelcast.compact;

import com.hazelcast.query.Predicate;

import java.util.Map;

public class CompactPredicate implements Predicate<Object, Object> {
    @Override
    public boolean apply(Map.Entry<Object, Object> entry) {
        return true;
    }
}
