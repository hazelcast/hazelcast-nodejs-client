import com.hazelcast.nio.serialization.PortableReader;
import com.hazelcast.nio.serialization.PortableWriter;
import com.hazelcast.nio.serialization.VersionedPortable;

import java.io.IOException;

public class InnerPortable implements VersionedPortable {

    private String m;
    private String r;

    public InnerPortable() {
        //no-op
    }

    public InnerPortable(String m, String r) {
        this.m = m;
        this.r = r;
    }

    @Override
    public int getClassVersion() {
        return 1;
    }

    @Override
    public int getFactoryId() {
        return 10;
    }

    @Override
    public int getClassId() {
        return 999;
    }

    @Override
    public void writePortable(PortableWriter writer) throws IOException {
        writer.writeUTF("m", this.m);
        writer.writeUTF("r", this.r);
    }

    @Override
    public void readPortable(PortableReader reader) throws IOException {
        this.m = reader.readUTF("m");
        this.r = reader.readUTF("r");
    }

    public String getM() {
        return m;
    }

    public void setM(String m) {
        this.m = m;
    }

    public String getR() {
        return r;
    }

    public void setR(String r) {
        this.r = r;
    }
}
