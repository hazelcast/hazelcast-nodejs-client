# Security

To be able to use security configuration, you must have
Hazelcast Enterprise edition, and enable security in
the member configuration.

An example XML member configuration is shared below,
for the code sample that uses username password credentials.

```xml
<hazelcast xmlns="http://www.hazelcast.com/schema/config"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://www.hazelcast.com/schema/config
           http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">

    <security enabled="true">
        <realms>
            <realm name="usernamePasswordCredentials">
                <identity>
                    <username-password username="admin" password="some-strong-password"/>
                </identity>
            </realm>
        </realms>
        <member-authentication realm="usernamePasswordCredentials"/>
        <!--
        Not defining client-authentication to use the identity config of the member realm with
        default authentication.
        See https://docs.hazelcast.com/hazelcast/latest/security/default-authentication
        -->
    </security>

</hazelcast>
```
