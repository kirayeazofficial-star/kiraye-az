import "server-only";
import mysql,{type Pool,type PoolConnection,type RowDataPacket} from "mysql2/promise";
import {hostConfig} from "./config";

let pool:Pool|undefined;
export function hostPool(){
  const config=hostConfig();
  if(!config)throw new Error("Host backend is not enabled.");
  pool??=mysql.createPool({
    host:config.db.host,port:config.db.port,database:config.db.name,user:config.db.user,password:config.db.password,
    charset:"utf8mb4",timezone:"Z",connectionLimit:5,maxIdle:2,idleTimeout:30_000,queueLimit:20,
    enableKeepAlive:true,keepAliveInitialDelay:0,
  });
  return pool;
}

type SqlValue=string|number|bigint|boolean|Date|null|Buffer|Uint8Array;
export async function hostQuery<T extends RowDataPacket[]>(sql:string,values:SqlValue[]=[]){
  const [rows]=await hostPool().execute<T>(sql,values);return rows;
}

export async function hostTransaction<T>(task:(connection:PoolConnection)=>Promise<T>){
  const connection=await hostPool().getConnection();
  try{await connection.beginTransaction();const result=await task(connection);await connection.commit();return result;}
  catch(error){await connection.rollback();throw error;}finally{connection.release();}
}
