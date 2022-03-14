package com.hazelcast.compact;

import com.hazelcast.aggregation.Aggregator;

public class CompactReturningAggregator implements Aggregator {
    @Override
    public void accumulate(Object o) {

    }

    @Override
    public void combine(Aggregator aggregator) {

    }

    @Override
    public Object aggregate() {
        return Outer.INSTANCE;
    }
}
