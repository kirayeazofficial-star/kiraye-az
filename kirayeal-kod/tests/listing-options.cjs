const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const exports_={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/listing-form-options.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exports_,require:()=>({rentalSpecLabels:{}})});
const {carModels,motorcycleModels}=exports_;
for(const models of [carModels,motorcycleModels])for(const [brand,choices] of Object.entries(models)){
 assert(brand.length>0&&brand.length<=40);
 assert.equal(new Set(choices).size,choices.length,`${brand} has duplicate choices`);
 for(const choice of choices)assert(choice.length>0&&choice.length<=60);
}
for(const [brand,choices] of Object.entries({Chevrolet:['Cruze','Corvette','Camaro','Tahoe','Volt'],Lamborghini:['Aventador','Huracan','Urus','Gallardo','Revuelto','Temerario'],Fiat:['Punto','Tipo','Ducato'],Toyota:['Voxy','Hilux','C-HR'],Chery:['Tiggo 4','Tiggo 4 Pro'],Changan:['UNI-K','UNI-T','UNI-V','UNI-Z']}))for(const choice of choices)assert(carModels[brand].includes(choice),`${brand}: ${choice} lost during catalogue merge`);
for(const choice of ['Sportster','Fat Boy','Nightster','Road King','Pan America 1250'])assert(motorcycleModels['Harley-Davidson'].includes(choice));
console.log('PASS merged vehicle catalogues preserve existing and expanded choices without duplicates');
