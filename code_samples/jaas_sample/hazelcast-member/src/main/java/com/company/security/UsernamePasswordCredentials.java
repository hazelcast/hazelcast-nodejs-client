package com.company.security;

import com.hazelcast.internal.json.Json;
import com.hazelcast.internal.json.JsonObject;
import com.hazelcast.security.SimpleTokenCredentials;

import static java.util.Objects.requireNonNull;

public class UsernamePasswordCredentials {

    private final String username;
    private final String password;
    private final String endpoint;

    public UsernamePasswordCredentials(String username, String password, String endpoint) {
        this.username = requireNonNull(username, "username required");
        this.password = requireNonNull(password, "password required");
        this.endpoint = requireNonNull(endpoint, "endpoint required");
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getName() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public static UsernamePasswordCredentials readFromToken(SimpleTokenCredentials token) {
        String tokenContents = new String(token.getToken());
        int jsonStartIdx = tokenContents.indexOf('{');
        if (jsonStartIdx < 0) {
            throw new IllegalArgumentException("JSON object expected");
        }
        // need to trim the header part
        tokenContents = tokenContents.substring(jsonStartIdx);
        JsonObject object = Json.parse(tokenContents).asObject();
        String username = object.getString("username", null);
        String password = object.getString("password", null);
        String endpoint = object.getString("endpoint", null);
        return new UsernamePasswordCredentials(username, password, endpoint);
    }
}
