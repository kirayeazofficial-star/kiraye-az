const endpoint='https://api.github.com/repos/kirayeazofficial-star/kiraye-az/actions/workflows/disaster-backup.yml/dispatches';
export async function requestCloudBackup(commit,{token=process.env.KIRAYE_BACKUP_DISPATCH_TOKEN,fetcher=fetch}={}){
 if(!/^[a-f0-9]{40}$/.test(commit||''))return {ok:false,reason:'invalid_commit'};
 if(!token)return {ok:false,reason:'missing_dispatch_credential'};
 try{
  const response=await fetcher(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{reason:'verified-deployment',expected_commit:commit}}),signal:AbortSignal.timeout(15000)});
  // Accepted only means queued. The Google watchdog and Drive verification establish completion.
  return {ok:response.status===204,queued:response.status===204,status:response.status};
 }catch{return {ok:false,reason:'dispatch_failed'};}
}
