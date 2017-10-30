import com.hazelcast.nio.serialization.PortableReader;
import com.hazelcast.nio.serialization.PortableWriter;
import com.hazelcast.nio.serialization.VersionedPortable;

import java.io.IOException;

public class OuterPortable implements VersionedPortable {

    private InnerPortable innerPortable;

    public OuterPortable(InnerPortable innerPortable) {
        this.innerPortable = innerPortable;
    }

    public OuterPortable() {
        //no-op
    }

    @Override
    public int getClassVersion() {
        return 3;
    }

    @Override
    public int getFactoryId() {
        return 10;
    }

    @Override
    public int getClassId() {
        return 555;
    }

    @Override
    public void writePortable(PortableWriter writer) throws IOException {
        writer.writePortable("inner_portable", this.innerPortable);
    }

    @Override
    public void readPortable(PortableReader reader) throws IOException {
        this.innerPortable = reader.readPortable("inner_portable");
    }

    public InnerPortable getInnerPortable() {
        return innerPortable;
    }

    public void setInnerPortable(InnerPortable innerPortable) {
        this.innerPortable = innerPortable;
    }
}
