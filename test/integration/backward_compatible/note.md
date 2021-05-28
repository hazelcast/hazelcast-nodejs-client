
# Sql

## execute

* can be used via sql statement or function params

* function params: sql, params, options
* lite member
### sql

* valid
  * can have one or more parameter
  * can have zero parameter
* invalid
  * garbage

* Errors:
  * map not found
  * parameter mismatch
  * missing from
  * unsupported statements

### params

* try all different params

### options

* try different options
  * cursor buffer size -> pagination
  * timeoutMillis -> hard to test
  * schema -> imdg does not support yet
  * return raw result
  * return type -> not supported

## SqlResult

* should be iterable using next and async iterables
* close should reject iteration with correct error code
* getRowMetadata
* isRowSet
* getUpdateCount


## SqlRowMetadata

* getColumnCount
* getColumnByIndex
* getColumns
* findColumn

## Errors

* CONNECTION_PROBLEM
* CANCELLED_BY_USER

## SqlRow

* getObject
* getMetadata
