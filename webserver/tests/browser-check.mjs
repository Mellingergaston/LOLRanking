import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';

const result = await build({ entryPoints: ['tests/ui-fixture.tsx'], bundle: true, write: false,
  platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' } });
const css = (await Promise.all(['src/app/globals.css', 'src/app/redesign.css'].map((file) => readFile(file, 'utf8')))).join('\n');
const server = createServer((req, res) => {
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(result.outputFiles[0].text); }
  else { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body><div id="root"></div><script src="/fixture.js"></script></body></html>`); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await mkdir('test-results', { recursive: true });
async function fits() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'page overflows viewport');
}
try {
  await page.goto(url);
  await page.getByRole('heading', { name: /La misma grieta/ }).waitFor();
  await fits();
  await page.screenshot({ path: 'test-results/ranking-desktop.png', fullPage: true });
  await page.getByRole('textbox', { name: 'Buscar jugador en el ranking' }).fill('Nahid');
  assert.equal(await page.locator('.table__row').count(), 1);
  await page.getByRole('textbox', { name: 'Buscar jugador en el ranking' }).fill('does-not-exist');
  await page.getByText('Sin resultados', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'LIMPIAR BÚSQUEDA' }).click();
  assert.equal(await page.locator('.table__row').count(), 6);
  await page.getByRole('button', { name: 'WINRATE', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'WINRATE', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.route('**/api/sync', (route) => route.fulfill({ status: 500, json: { error: 'Test failure' } }));
  await page.getByRole('button', { name: /Sincronizar partidas/ }).click();
  await page.getByRole('status').filter({ hasText: /No se pudo sincronizar/ }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await fits();
  await page.screenshot({ path: 'test-results/ranking-mobile.png', fullPage: true });
  await page.goto(`${url}/?view=profile`);
  await page.getByRole('heading', { name: 'Nos volvemos a encontrar.' }).waitFor();
  await fits();
  await page.screenshot({ path: 'test-results/profile-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await fits();
  await page.screenshot({ path: 'test-results/profile-desktop.png', fullPage: true });
  assert.equal(await page.locator('.encounter-table tbody tr').count(), 5);
  await page.getByRole('button', { name: 'Aliados', exact: true }).click();
  assert.equal(await page.locator('.encounter-table tbody tr').count(), 4);
  await page.getByRole('textbox', { name: 'Buscar encuentros' }).fill('Nahid');
  await page.getByText('No encontramos coincidencias', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Rivales', exact: true }).click();
  assert.equal(await page.locator('.encounter-table tbody tr').count(), 1);
  await page.goto(`${url}/?view=many`);
  await page.getByRole('button', { name: /Ver más jugadores/ }).waitFor();
  assert.equal(await page.locator('.encounter-table tbody tr').count(), 10);
  await page.getByRole('button', { name: /Ver más jugadores/ }).click();
  assert.equal(await page.locator('.encounter-table tbody tr').count(), 25);
  assert.equal(await page.getByRole('button', { name: /Ver más jugadores/ }).count(), 0);
  await page.goto(`${url}/?view=empty`);
  await page.getByText('Cada partida deja una conexión', { exact: true }).waitFor();
  await page.getByText(/Hay 4 partidas guardadas pendientes/).waitFor();
  await page.goto(`${url}/?view=error`);
  await page.getByText('No pudimos conectar con Riot Games.', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Browser QA passed: desktop/mobile fit, ranking search/sort, sync failure, encounter filters/search, empty/error states. Screenshots: test-results/');
} catch (error) {
  console.error('Browser errors:', errors);
  throw error;
} finally {
  await browser.close();
  server.close();
}
