const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

function load(file, imports = {}) {
  const exported = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
  }).outputText, {exports: exported, require: name => imports[name] || require(name), process, Buffer, URL, URLSearchParams});
  return exported;
}

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kiraye-media-'));
  const previous = process.env.KIRAYE_STORAGE_ROOT;
  process.env.KIRAYE_STORAGE_ROOT = root;
  try {
    const owner = '11111111-1111-4111-8111-111111111111';
    const file = '22222222-2222-4222-8222-222222222222.jpg';
    const folder = path.join(root, owner);
    await fs.mkdir(folder);
    await fs.writeFile(path.join(folder, file), 'full-resolution-original');
    let fails = true;
    const {GET} = load('app/api/media/[owner]/[file]/route.ts', {
      '../../../../../lib/host/thumbnail': {
        makeThumbnail: () => {if (fails) throw new Error('decoder memory limit'); return Buffer.from('small-thumbnail');},
        queuedThumbnail: async (_key, make) => {try {return await make();} catch {return null;}},
      },
    });
    const get = query => GET(new Request(`http://localhost/api/media/${owner}/${file}${query}`), {params: Promise.resolve({owner, file})});
    let response = await get('?s=thumb');
    assert.equal(response.status, 422);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(await (await get('')).text(), 'full-resolution-original');
    await fs.writeFile(path.join(folder, `share-${file}`), 'detail-size-photo');
    assert.equal(await (await get('?s=view')).text(), 'detail-size-photo');
    fails = false;
    response = await get('?s=thumb');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'small-thumbnail');
    fails = true;
    assert.equal(await (await get('?s=thumb')).text(), 'small-thumbnail');
    const {sized} = load('lib/image-size.ts');
    const address = `/api/media/${owner}/${file}`;
    assert.equal(sized(address), `${address}?s=thumb&v=2`);
    const query = new URL(sized(`${address}?s=view&other=keep`), 'http://localhost').searchParams;
    assert.equal(query.get('s'), 'thumb');
    assert.equal(query.get('v'), '2');
    assert.equal(query.get('other'), 'keep');
    console.log('PASS failed thumbnail never serves original; generation, cache, detail images and URL versioning work');
  } finally {
    if (previous === undefined) delete process.env.KIRAYE_STORAGE_ROOT;
    else process.env.KIRAYE_STORAGE_ROOT = previous;
    await fs.rm(root, {recursive: true, force: true});
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
