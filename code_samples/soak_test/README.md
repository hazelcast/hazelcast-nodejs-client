# Soak Test Description

The test setup at Hazelcast lab environment is:

1. Use 4 member cluster on 2 servers (2 members each).
2. The client test program exercises the following API calls. At most 32 active operations are allowed at any time.
    + Put/Gets
    + Predicates
    + MapListeners
    + EntryProcessors
3. Run 10 clients on one lab machine and this machine only runs clients (i.e. no server at this machine).
4. Run the tests for 48 hours. Verify that:
    + Make sure that all the client processes are up and running before killing the clients after 48 hours.
    + Analyse the outputs: Make sure that there are no errors printed.

# Success Criteria

1. No errors printed.
2. All client processes are up and running after 48 hours with no problem.
