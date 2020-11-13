package com.company.security;

import com.hazelcast.security.ClusterEndpointPrincipal;
import com.hazelcast.security.ClusterRolePrincipal;
import com.hazelcast.security.Credentials;
import com.hazelcast.security.CredentialsCallback;
import com.hazelcast.security.TokenCredentials;
import com.hazelcast.security.TokenDeserializerCallback;

import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class ClientLoginModule implements LoginModule {

    private UsernamePasswordCredentials usernamePasswordCredentials;
    private Subject subject;
    private CallbackHandler callbackHandler;
    private DummyAuthenticator authenticator;

    public void initialize(Subject subject,
                           CallbackHandler callbackHandler,
                           Map<String, ?> sharedState,
                           Map<String, ?> options) {
        this.subject = subject;
        this.callbackHandler = callbackHandler;
        this.authenticator = new DummyAuthenticator();
    }

    public boolean login() throws LoginException {
        return authenticateUser(getCredentials());
    }

    public boolean commit() throws LoginException {
        storeRolesOnPrincipal();
        return true;
    }

    public boolean abort() {
        clearSubject();
        return true;
    }

    @Override
    public boolean logout() {
        clearSubject();
        return true;
    }

    private UsernamePasswordCredentials getCredentials() throws LoginException {
        CredentialsCallback credcb = new CredentialsCallback();
        // Warning: this callback is used for code conciseness purposes.
        // We strongly recommend to avoid object deserialization during the authentication
        // to prevent serialization based attacks.
        TokenDeserializerCallback tdcb = new TokenDeserializerCallback();
        try {
            callbackHandler.handle(new Callback[] { credcb, tdcb });
        } catch (IOException | UnsupportedCallbackException e) {
            throw new LoginException("Unable to retrieve necessary data");
        }
        Credentials credentials = credcb.getCredentials();
        if (credentials == null) {
            throw new LoginException("Credentials could not be retrieved!");
        }

        if (credentials instanceof TokenCredentials) {
            TokenCredentials tokenCreds = (TokenCredentials) credentials;
            credentials = (Credentials) tdcb.getTokenDeserializer().deserialize(tokenCreds);
        }

        if (credentials instanceof UsernamePasswordCredentials) {
            usernamePasswordCredentials = (UsernamePasswordCredentials) credentials;
            return usernamePasswordCredentials;
        } else {
            throw new LoginException("Credentials is not an instance of UsernamePasswordCredentials!");
        }
    }

    private boolean authenticateUser(UsernamePasswordCredentials credentials) {
        String username = credentials.getUsername();
        String password = credentials.getPassword();
        return authenticator.authenticate(username, password);
    }

    private void storeRolesOnPrincipal() throws LoginException {
        List<String> userGroups = authenticator.getRoles(usernamePasswordCredentials.getUsername());
        if (userGroups != null) {
            for (String userGroup : userGroups) {
                subject.getPrincipals().add(new ClusterEndpointPrincipal(usernamePasswordCredentials.getEndpoint()));
                subject.getPrincipals().add(new ClusterRolePrincipal(userGroup));
            }
        } else {
            throw new LoginException("User Group(s) not found for user " + usernamePasswordCredentials.getUsername());
        }
    }

    private void clearSubject() {
        subject.getPrincipals().clear();
        subject.getPrivateCredentials().clear();
        subject.getPublicCredentials().clear();
    }
}
