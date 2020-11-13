package com.company.security;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DummyAuthenticator {

    private final Map<String, String> users;
    private final Map<String, List<String>> userGrous;

    public DummyAuthenticator(){
        userGrous = new HashMap<>();
        users = new HashMap<>();

        users.put("admin", "password1");
        users.put("reader", "password2");

        userGrous.put("admin", Collections.singletonList("adminGroup"));
        userGrous.put("reader", Collections.singletonList("readerGroup"));
    }

    public boolean authenticate(String username, String password){
        String userPassword = users.get(username);
        if (userPassword != null) {
            return userPassword.equals(password);
        }
        return false;
    }

    public List<String> getRoles(String username){
        return userGrous.get(username);
    }
}
