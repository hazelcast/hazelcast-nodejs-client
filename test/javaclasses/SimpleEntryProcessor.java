import com.hazelcast.map.AbstractEntryProcessor;
import com.hazelcast.nio.ObjectDataInput;
import com.hazelcast.nio.ObjectDataOutput;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;

import java.io.IOException;
import java.util.Map;

public class SimpleEntryProcessor extends AbstractEntryProcessor implements IdentifiedDataSerializable {
    @Override
    public int getFactoryId() {
        return 1;
    }

    @Override
    public int getId() {
        return 1;
    }

    @Override
    public void writeData(ObjectDataOutput out) throws IOException {
        //Empty
    }

    @Override
    public void readData(ObjectDataInput in) throws IOException {
        //Empty
    }

    @Override
    public Object process(Map.Entry entry) {
        String val = (String)entry.getValue();
        val += "processed";
        entry.setValue(val);
        return val;
    }
}
