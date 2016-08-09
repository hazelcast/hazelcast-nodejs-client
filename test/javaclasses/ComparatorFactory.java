import com.hazelcast.nio.serialization.DataSerializableFactory;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;

public class ComparatorFactory implements DataSerializableFactory {

    private static ReverseValueComparator reverseComparator = new ReverseValueComparator();

    @Override
    public IdentifiedDataSerializable create(int typeId) {
        if (typeId == 1) {
            return reverseComparator;
        } else {
            return null;
        }
    }
}
