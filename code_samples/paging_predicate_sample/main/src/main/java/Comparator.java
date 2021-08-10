import com.hazelcast.nio.ObjectDataInput;
import com.hazelcast.nio.ObjectDataOutput;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;

import java.io.IOException;
import java.util.Map;

public class Comparator implements java.util.Comparator<Map.Entry<String, Double>>, IdentifiedDataSerializable {
    public static final int CLASS_ID = 103;

    public Comparator() {
    }

    @Override
    public void writeData(ObjectDataOutput out) throws IOException {
    }

    @Override
    public void readData(ObjectDataInput in) throws IOException {
    }


    // We needed a Double comparator since the default number type is 'double' in Node.js client. You can change it via defaultNumberType serialization setting.
    @Override
    public int compare(Map.Entry<String, Double> e1, Map.Entry<String, Double> e2) {
        Double firstValue = e1.getValue();
        Double secondValue = e2.getValue();
        if (firstValue > secondValue) return -1;
        if (secondValue > firstValue) return 1;
        return 0;
    }

    @Override
    public int getFactoryId() {
        return IdentifiedFactory.FACTORY_ID;
    }

    @Override
    public int getClassId() {
        return CLASS_ID;
    }

    @Override
    public String toString() {
        return "Comparator()";
    }
}
