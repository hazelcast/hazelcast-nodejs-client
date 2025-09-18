import { SqlResult } from './SqlResult';
import { SqlStatement, SqlStatementOptions } from './SqlStatement';
/**
 * SQL Service of the client. You can use this service to execute SQL queries.
 *
 * ## Enabling SQL Service
 *
 * To use this service, the Jet engine must be enabled on the members and the `hazelcast-sql` module must be in the classpath
 * of the members. If you are using the CLI, Docker image, or distributions to start Hazelcast members, then you don't need to
 * do anything, as the above preconditions are already satisfied for such members.
 *
 * However, if you are using Hazelcast members in the embedded mode, or receiving errors saying that
 * `The Jet engine is disabled` or `Cannot execute SQL query because "hazelcast-sql" module is not in the classpath.` while
 * executing queries, enable the Jet engine following one of the instructions pointed out in the error message, or add the
 * `hazelcast-sql` module to your member's classpath.
 *
 * ## Overview
 *
 * Hazelcast is currently able to execute distributed SQL queries using the following connectors:
 * * {@link IMap}
 * * Kafka
 * * Files
 *
 * SQL statements are not atomic. _INSERT_/_SINK_ can fail and commit part of the data.
 *
 * ## Usage
 *
 * Before you can access any object using SQL, a _mapping_ has to be created. See the documentation for the `CREATE MAPPING`
 * command.
 *
 * When a query is executed, an {@link SqlResult} is returned. The returned result is an async iterable of {@link SqlRowType}.
 * It can also be iterated using {@link SqlResult.next} method. The result should be closed at the end to release server
 * resources. Fetching the last page closes the result. The code snippet below demonstrates a typical usage pattern:
 *
 * ```
 * const client = await Client.newHazelcastClient();
 * const result = await client.getSql().execute('SELECT * FROM persons');
 * for await (const row of result) {
 *    console.log(row.personId);
 *    console.log(row.name);
 * }
 * await result.close();
 * await client.shutdown();
 * ```
 */
export interface SqlService {
    /**
     * Executes SQL and returns an {@link SqlResult}.
     * Converts passed SQL string and parameter values into an {@link SqlStatement} object and invokes {@link executeStatement}.
     *
     * @param sql SQL string. SQL string placeholder character is question mark(`?`)
     * @param params Parameter list. The parameter count must be equal to number of placeholders in the SQL string
     * @param options Options that are affecting how the query is executed
     * @throws {@link IllegalArgumentError} if arguments are not valid
     * @throws {@link HazelcastSqlException} in case of an execution error
     */
    execute(sql: string, params?: any[], options?: SqlStatementOptions): Promise<SqlResult>;
    /**
     * Executes SQL and returns an {@link SqlResult}.
     * @param sql SQL statement object
     * @throws {@link IllegalArgumentError} if arguments are not valid
     * @throws {@link HazelcastSqlException} in case of an execution error
     */
    executeStatement(sql: SqlStatement): Promise<SqlResult>;
}
