import sql from "mssql";

let pool: sql.ConnectionPool | null = null;

function parseConnectionString(connStr: string): sql.config {
  const parts: Record<string, string> = {};
  connStr.split(";").forEach((part) => {
    const [key, ...rest] = part.split("=");
    if (key && rest.length) {
      parts[key.trim().toLowerCase()] = rest.join("=").trim();
    }
  });

  return {
    server: parts["server"] || parts["data source"] || "",
    database: parts["database"] || parts["initial catalog"] || "",
    user: parts["user id"] || parts["uid"] || "",
    password: parts["password"] || parts["pwd"] || "",
    options: {
      encrypt: parts["encrypt"]?.toLowerCase() === "true",
      trustServerCertificate: true,
    },
    requestTimeout: 120000,
    connectionTimeout: 30000,
  };
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;

  const connStr = process.env.NEXTIS_DB_CONNECTION;
  if (!connStr) throw new Error("NEXTIS_DB_CONNECTION not set");

  const config = parseConnectionString(connStr);
  pool = await new sql.ConnectionPool(config).connect();
  console.log("MSSQL connected.");
  return pool;
}

export async function query<T>(
  sqlText: string,
  params?: Record<string, { type: sql.ISqlTypeWithLength | sql.ISqlType; value: unknown }>
): Promise<T[]> {
  const p = await getPool();
  const request = p.request();
  if (params) {
    for (const [name, param] of Object.entries(params)) {
      request.input(name, param.type, param.value);
    }
  }
  const result = await request.query(sqlText);
  return result.recordset as T[];
}

export { sql };
