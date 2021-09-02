import com.hazelcast.nio.serialization.DataSerializableFactory;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;

public class IdentifiedFactory implements DataSerializableFactory {
    public static final int FACTORY_ID = 66;

    @Override
    public IdentifiedDataSerializable create(int typeId) {
        if (typeId == Comparator.CLASS_ID) {
            return new Comparator();
        }
        return null;
    }
}
