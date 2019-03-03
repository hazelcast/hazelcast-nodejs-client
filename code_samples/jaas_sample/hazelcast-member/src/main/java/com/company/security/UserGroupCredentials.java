package com.company.security;

import com.hazelcast.nio.ObjectDataInput;
import com.hazelcast.nio.ObjectDataOutput;
import com.hazelcast.nio.serialization.DataSerializable;
import com.hazelcast.security.Credentials;

import java.io.IOException;

public class UserGroupCredentials implements Credentials, DataSerializable {
    private String endpoint;
    private String userGroup;

    public UserGroupCredentials(){
    }

    public UserGroupCredentials(String endpoint, String userGroup){
        this.endpoint = endpoint;
        this.userGroup = userGroup;
    }

    @Override
    public String getEndpoint() {
        return endpoint;
    }

    @Override
    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    @Override
    public String getPrincipal() {
        return userGroup;
    }

    @Override
    public void writeData(ObjectDataOutput objectDataOutput) throws IOException {
        objectDataOutput.writeUTF(endpoint);
        objectDataOutput.writeUTF(userGroup);
    }

    @Override
    public void readData(ObjectDataInput objectDataInput) throws IOException {
        endpoint = objectDataInput.readUTF();
        userGroup = objectDataInput.readUTF();
    }
}
