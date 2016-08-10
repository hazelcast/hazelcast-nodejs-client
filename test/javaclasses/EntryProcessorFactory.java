import com.hazelcast.nio.serialization.DataSerializableFactory;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;

public class EntryProcessorFactory implements DataSerializableFactory {
    @Override
    public IdentifiedDataSerializable create(int typeId) {
        if (typeId == 1) {
            return new SimpleEntryProcessor();
        } else {
            return null;
        }
    }
}
