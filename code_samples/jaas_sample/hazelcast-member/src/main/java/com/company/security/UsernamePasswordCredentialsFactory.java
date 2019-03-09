package com.company.security;

import com.hazelcast.nio.serialization.Portable;
import com.hazelcast.nio.serialization.PortableFactory;

public class UsernamePasswordCredentialsFactory implements PortableFactory {

    public static final int FACTORY_ID = 1;

    @Override
    public Portable create(int id) {
        if(UsernamePasswordCredentials.CLASS_ID == id){
            return new UsernamePasswordCredentials();
        }
        return null;
    }
}
