package com.company.security;

import com.hazelcast.security.ClusterPrincipal;
import com.hazelcast.security.Credentials;
import com.hazelcast.security.CredentialsCallback;

import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;
import java.security.Principal;
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

    public boolean abort() throws LoginException {
        clearSubject();
        return true;
    }

    @Override
    public boolean logout() throws LoginException {
        clearSubject();
        return true;
    }

    private UsernamePasswordCredentials getCredentials() throws LoginException {
        final CredentialsCallback cb = new CredentialsCallback();
        Credentials credentials;
        try {
            callbackHandler.handle(new Callback[]{cb});
            credentials = cb.getCredentials();
        } catch (Exception e) {
            throw new LoginException(e.getClass().getName() + ":" + e.getMessage());
        }
        if (credentials == null) {
            throw new LoginException("Credentials could not be retrieved!");
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
                Principal principal = new ClusterPrincipal(new UserGroupCredentials(usernamePasswordCredentials.getEndpoint(), userGroup));
                subject.getPrincipals().add(principal);
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
