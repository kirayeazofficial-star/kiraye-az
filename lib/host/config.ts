import "server-only";

export type HostConfig={
  mode:"host";
  db:{host:string;port:number;name:string;user:string;password:string};
  sessionSecret:string;
  storageRoot:string;
};

function value(name:string){return process.env[name]?.trim()||"";}

export function hostMode():HostConfig["mode"]{
  const mode=value("KIRAYE_BACKEND")||"host";
  if(mode!=="host")throw new Error("KIRAYE_BACKEND must be host.");
  return "host";
}

export function hostConfig():HostConfig|null{
  const mode=hostMode();
  const host=value("KIRAYE_DB_HOST"),name=value("KIRAYE_DB_NAME"),user=value("KIRAYE_DB_USER"),password=value("KIRAYE_DB_PASSWORD"),sessionSecret=value("KIRAYE_SESSION_SECRET"),storageRoot=value("KIRAYE_STORAGE_ROOT");
  const port=Number(value("KIRAYE_DB_PORT")||5432);
  if(!host||!name||!user||!password||!storageRoot||!Number.isInteger(port)||port<1||port>65535)throw new Error("Host database configuration is incomplete.");
  if(sessionSecret.length<32)throw new Error("KIRAYE_SESSION_SECRET must contain at least 32 characters.");
  return{mode,db:{host,port,name,user,password},sessionSecret,storageRoot};
}
