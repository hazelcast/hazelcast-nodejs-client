set HZ_VERSION="4.0"
set HZ_TEST_VERSION="4.0"
set HAZELCAST_TEST_VERSION=%HZ_TEST_VERSION%
set HAZELCAST_VERSION=%HZ_VERSION%
set HAZELCAST_ENTERPRISE_VERSION=%HZ_VERSION%
set HAZELCAST_RC_VERSION="0.7-SNAPSHOT"
set SNAPSHOT_REPO="https://oss.sonatype.org/content/repositories/snapshots"
set RELEASE_REPO="http://repo1.maven.apache.org/maven2"
set ENTERPRISE_RELEASE_REPO="https://repository.hazelcast.com/release/"
set ENTERPRISE_SNAPSHOT_REPO="https://repository.hazelcast.com/snapshot/"

echo %HZ_VERSION% | findstr /r ".*-SNAPSHOT" >nul 2>&1
if errorlevel 1 (
	set REPO=%RELEASE_REPO%
	set ENTERPRISE_REPO=%ENTERPRISE_RELEASE_REPO%
) else (
	set REPO=%SNAPSHOT_REPO%
	set ENTERPRISE_REPO=%ENTERPRISE_SNAPSHOT_REPO%
)

echo %HZ_TEST_VERSION% | findstr /r ".*-SNAPSHOT" >nul 2>&1
if errorlevel 1 (
	set TEST_REPO=%RELEASE_REPO%
    set ENTRERPRISE_TEST_REPO=%ENTERPRISE_RELEASE_REPO%
) else (
	set TEST_REPO=%SNAPSHOT_REPO%
    set ENTRERPRISE_TEST_REPO=%ENTERPRISE_SNAPSHOT_REPO%
)

if exist hazelcast-remote-controller-%HAZELCAST_RC_VERSION%.jar (
	echo remote controller already exist, not downloading from maven.
) else (
	echo Downloading: remote-controller jar com.hazelcast:hazelcast-remote-controller:%HAZELCAST_RC_VERSION%
	call mvn -q dependency:get -DrepoUrl=%SNAPSHOT_REPO% -Dartifact=com.hazelcast:hazelcast-remote-controller:%HAZELCAST_RC_VERSION% -Ddest=hazelcast-remote-controller-%HAZELCAST_RC_VERSION%.jar
	if errorlevel 1 (
		echo Failed download remote-controller jar com.hazelcast:hazelcast-remote-controller:%HAZELCAST_RC_VERSION%
		exit 1
	)
)

if exist hazelcast-%HAZELCAST_TEST_VERSION%-tests.jar (
	echo hazelcast-test.jar already exists, not downloading from maven.
) else (
	echo Downloading: hazelcast test jar com.hazelcast:hazelcast:%HAZELCAST_TEST_VERSION%:jar:tests
	call mvn -q dependency:get -DrepoUrl=%TEST_REPO% -Dartifact=com.hazelcast:hazelcast:%HAZELCAST_TEST_VERSION%:jar:tests -Ddest=hazelcast-%HAZELCAST_TEST_VERSION%-tests.jar
	if errorlevel 1 (
		echo Failed download hazelcast test jar com.hazelcast:hazelcast:%HAZELCAST_TEST_VERSION%:jar:tests
		exit 1
	)
)

set CLASSPATH=hazelcast-remote-controller-%HAZELCAST_RC_VERSION%.jar;hazelcast-%HAZELCAST_TEST_VERSION%-tests.jar;test\javaclasses

if defined HAZELCAST_ENTERPRISE_KEY (
	if exist hazelcast-enterprise-%HAZELCAST_ENTERPRISE_VERSION%.jar (
		echo hazelcast-enterprise.jar already exists, not downloading from maven.
	) else (
		echo Downloading: hazelcast enterprise jar com.hazelcast:hazelcast-enterprise:%HAZELCAST_ENTERPRISE_VERSION%
		call mvn -q dependency:get -DrepoUrl=%ENTERPRISE_REPO% -Dartifact=com.hazelcast:hazelcast-enterprise:%HAZELCAST_ENTERPRISE_VERSION% -Ddest=hazelcast-enterprise-%HAZELCAST_ENTERPRISE_VERSION%.jar
		if errorlevel 1 (
			echo Failed download hazelcast enterprise jar com.hazelcast:hazelcast-enterprise:%HAZELCAST_ENTERPRISE_VERSION%
			exit 1
		)
	)

	if exist hazelcast-enterprise-%HAZELCAST_TEST_VERSION%-tests.jar (
    	echo hazelcast-enterprise-test.jar already exists, not downloading from maven.
    ) else (
    	echo Downloading: hazelcast enterprise test jar com.hazelcast:hazelcast-enterprise:%HAZELCAST_ENTERPRISE_VERSION%:jar:tests
    	call mvn -q dependency:get -DrepoUrl=%TEST_REPO% -Dartifact=com.hazelcast:hazelcast-enterprise:%HAZELCAST_TEST_VERSION%:jar:tests -Ddest=hazelcast-enterprise-%HAZELCAST_TEST_VERSION%-tests.jar
    	if errorlevel 1 (
    		echo Failed download hazelcast enterprise test jar com.hazelcast:hazelcast-enterprise:%HAZELCAST_TEST_VERSION%:jar:tests
    		exit 1
    	)
    )

	set CLASSPATH=hazelcast-enterprise-%HAZELCAST_ENTERPRISE_VERSION%.jar;hazelcast-enterprise-%HAZELCAST_TEST_VERSION%-tests.jar;%CLASSPATH%
	echo Starting Remote Controller ... enterprise ...
) else (
	if exist hazelcast-%HAZELCAST_VERSION%.jar (
		echo hazelcast.jar already exists, not downloading from maven.
	) else (
		echo Downloading: hazelcast jar com.hazelcast:hazelcast:%HAZELCAST_VERSION%
		call mvn -q dependency:get -DrepoUrl=%REPO% -Dartifact=com.hazelcast:hazelcast:%HAZELCAST_VERSION% -Ddest=hazelcast-%HAZELCAST_VERSION%.jar
		if errorlevel 1 (
			echo Failed download hazelcast jar com.hazelcast:hazelcast:%HAZELCAST_VERSION%
			exit 1
		)
	)
	set CLASSPATH=hazelcast-%HAZELCAST_VERSION%.jar;%CLASSPATH%
    echo Starting Remote Controller ... oss ...
)

start /min "hazelcast-remote-controller" cmd /c "java -Dhazelcast.enterprise.license.key=%HAZELCAST_ENTERPRISE_KEY% -cp %CLASSPATH% com.hazelcast.remotecontroller.Main --use-simple-server> rc_stdout.txt 2>rc_stderr.txt"

echo wait for Hazelcast to start ...
ping -n 15 127.0.0.1 > nul


