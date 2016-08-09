import com.hazelcast.nio.ObjectDataInput;
import com.hazelcast.nio.ObjectDataOutput;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;

import java.io.IOException;
import java.util.Comparator;
import java.util.Map;

public class ReverseValueComparator implements Comparator<Map.Entry<Double, Double>>, IdentifiedDataSerializable {
    @Override
    public int compare(Map.Entry<Double, Double> o1, Map.Entry<Double, Double> o2) {
        return o1.getValue().compareTo(o2.getValue()) * (-1);
    }

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
}
