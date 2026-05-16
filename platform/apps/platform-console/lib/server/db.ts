import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

let pool: Pool | undefined;
export type DbParam = string | number | boolean | null | Date;

function getDatabaseConfig() {
  return {
    host: process.env.PLATFORM_DB_HOST ?? "mysql",
    port: Number(process.env.PLATFORM_DB_PORT ?? "3306"),
    user: process.env.PLATFORM_DB_USER ?? "platform",
    password: process.env.PLATFORM_DB_PASSWORD ?? "platform_dev_password",
    database: process.env.PLATFORM_DB_NAME ?? "platform"
  };
}

export function getDbPool() {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60_000,
      queueLimit: 0
    });
  }

  return pool;
}

export async function dbQuery<T extends RowDataPacket[]>(sql: string, params: DbParam[] = []) {
  const [rows] = await getDbPool().query<T>(sql, params);
  return rows;
}

export async function dbExecute(sql: string, params: DbParam[] = []) {
  const [result] = await getDbPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export async function dbTransaction<T>(work: (connection: PoolConnection) => Promise<T>) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
