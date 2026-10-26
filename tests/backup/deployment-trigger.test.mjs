import test from 'node:test';
import assert from 'node:assert/strict';
import {requestCloudBackup} from '../../scripts/request-cloud-backup.mjs';
const commit='a'.repeat(40);
test('verified deployment queues only the fixed repository with its expected commit',async()=>{
 let request;
 const result=await requestCloudBackup(commit,{token:'isolated-test-token',fetcher:async(url,options)=>{request={url,options};return {status:204};}});
 assert.equal(result.ok,true);assert.equal(result.queued,true);
 assert.equal(request.url,'https://api.github.com/repos/kirayeazofficial-star/kiraye-az/actions/workflows/disaster-backup.yml/dispatches');
 assert.equal(JSON.parse(request.options.body).inputs.expected_commit,commit);
 assert.ok(!JSON.stringify(result).includes('isolated-test-token'));
});
test('missing credential, rejected dispatch and network error are never success',async()=>{
 assert.equal((await requestCloudBackup(commit,{token:''})).ok,false);
 assert.equal((await requestCloudBackup(commit,{token:'test',fetcher:async()=>({status:403})})).ok,false);
 assert.equal((await requestCloudBackup(commit,{token:'test',fetcher:async()=>{throw Error('private-response');}})).ok,false);
 assert.equal((await requestCloudBackup('untrusted',{token:'test',fetcher:()=>{throw Error('should-not-call');}})).ok,false);
});
