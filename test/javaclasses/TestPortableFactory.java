import com.hazelcast.nio.serialization.HazelcastSerializationException;
import com.hazelcast.nio.serialization.Portable;
import com.hazelcast.nio.serialization.PortableFactory;

public class TestPortableFactory implements PortableFactory {
    @Override
    public Portable create(int classId) {
        if (classId == 555) {
            return new OuterPortable();
        } else if (classId == 999) {
            return new InnerPortable();
        } else {
            throw new HazelcastSerializationException("No registered portable with id " + classId);
        }
    }
}
