import "server-only";
import {Pool,type PoolClient,type QueryResultRow} from "pg";
import {hostConfig} from "./config";

let pool:Pool|undefined;
export function hostPool(){
  const config=hostConfig();
  if(!config)throw new Error("Host backend is not enabled.");
  pool??=new Pool({
    host:config.db.host,port:config.db.port,database:config.db.name,user:config.db.user,password:config.db.password,
    max:5,idleTimeoutMillis:30_000,connectionTimeoutMillis:10_000,
    keepAlive:true,keepAliveInitialDelayMillis:0,
  });
  return pool;
}

type SqlValue=string|number|bigint|boolean|Date|null|Buffer|Uint8Array;
export async function hostQuery<T extends QueryResultRow=QueryResultRow>(sql:string,values:SqlValue[]=[]){
  const result=await hostPool().query<T>(sql,values);return result.rows;
}

export async function hostTransaction<T>(task:(connection:PoolClient)=>Promise<T>){
  const connection=await hostPool().connect();
  try{await connection.query("BEGIN");const result=await task(connection);await connection.query("COMMIT");return result;}
  catch(error){await connection.query("ROLLBACK");throw error;}finally{connection.release();}
}
