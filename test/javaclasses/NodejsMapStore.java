import com.hazelcast.core.MapStore;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class NodejsMapStore implements MapStore<String, String> {

    private ConcurrentMap<String, String> store = new ConcurrentHashMap<String, String>();

    @Override
    public void store(String key, String value) {
        store.put(key, value);
    }

    @Override
    public void storeAll(Map<String, String> map) {
        final Set<Map.Entry<String, String>> entrySet = map.entrySet();
        for (Map.Entry<String, String> entry : entrySet) {
            store(entry.getKey(), entry.getValue());
        }
    }

    @Override
    public void delete(String key) {
        store.remove(key);
    }

    @Override
    public void deleteAll(Collection<String> keys) {
        for (String key : keys) {
            delete(key);
        }
    }

    @Override
    public String load(String key) {
        return store.get(key);
    }

    @Override
    public Map<String, String> loadAll(Collection<String> keys) {
        final Map<String, String> map = new HashMap<String, String>();
        for (String key : keys) {
            map.put(key, load(key));
        }
        return map;
    }

    @Override
    public Set<String> loadAllKeys() {
        return store.keySet();
    }
}