package com.hazelcast.compact;

import com.hazelcast.query.PagingPredicate;
import com.hazelcast.query.Predicates;

import java.util.Comparator;
import java.util.Map;

public class CompactPagingPredicate implements PagingPredicate<Object, Object> {

    private final PagingPredicate delegate = Predicates.pagingPredicate(Predicates.alwaysTrue(), 1);

    @Override
    public void reset() {
        delegate.reset();
    }

    @Override
    public void nextPage() {
        delegate.nextPage();
    }

    @Override
    public void previousPage() {
        delegate.previousPage();
    }

    @Override
    public int getPage() {
        return delegate.getPage();
    }

    @Override
    public void setPage(int i) {
        delegate.setPage(i);
    }

    @Override
    public int getPageSize() {
        return delegate.getPageSize();
    }

    @Override
    public Comparator<Map.Entry<Object, Object>> getComparator() {
        return delegate.getComparator();
    }

    @Override
    public Map.Entry<Object, Object> getAnchor() {
        return delegate.getAnchor();
    }

    @Override
    public boolean apply(Map.Entry<Object, Object> entry) {
        return delegate.apply(entry);
    }
}
