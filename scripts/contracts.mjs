import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'src/services/api/contracts');
await fs.mkdir(directory, { recursive: true });
const backendPath = path.join(root, '../backend/openapi.json');
const snapshotPath = path.join(directory, 'openapi.json');
if (process.argv.includes('--sync')) await fs.copyFile(backendPath, snapshotPath);
const snapshot = await fs.readFile(snapshotPath, 'utf8');
const generated = '/** Generado desde OpenAPI. Ejecutar npm run contracts:sync; no editar manualmente. */\n'
  + astToString(await openapiTS(JSON.parse(snapshot)));
const target = path.join(directory, 'schema.d.ts');
if (process.argv.includes('--check')) {
  if (await fs.readFile(target, 'utf8') !== generated) throw new Error('Tipos desactualizados. Ejecute npm run contracts:generate.');
  try {
    if (await fs.readFile(backendPath, 'utf8') !== snapshot) throw new Error('Contrato distinto del backend. Exporte OpenAPI y ejecute npm run contracts:sync.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  console.log('Contrato y tipos frontend sincronizados.');
} else { await fs.writeFile(target, generated); console.log('Tipos API generados desde OpenAPI.'); }
