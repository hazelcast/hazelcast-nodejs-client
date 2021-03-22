This folder contains integration tests that should be backward compatible with
the released 4.x Node.js clients.

One must use mostly public API in the tests located in this folder. If the test
requires usage of the private API or usage of newly added public API, one must make
sure it either:

- the private API exists in the all released versions of the client
- the private/public API can be conditionally accessed via some mechanism (check TestUtil.js for such examples)
- the test can be conditionally disabled for the certain client/server versions
