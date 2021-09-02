import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;

public class Main {
    public static void main(String[] args) {
        Config config = new Config();
        config.getSerializationConfig().addDataSerializableFactory(IdentifiedFactory.FACTORY_ID, new IdentifiedFactory());
        HazelcastInstance instance = Hazelcast.newHazelcastInstance(config);
    }
}
