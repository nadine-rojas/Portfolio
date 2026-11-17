import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DATA, PROJECTS_DATA } from '../data/portfolioData';
import { computeCardTilt, filterProjects, validateContactForm } from './portfolioLogic';

test('PROFILE_DATA identifies Leia Rojas across brand and hero copy', () => {
  assert.equal(PROFILE_DATA.name, 'Leia Rojas');
  assert.equal(PROFILE_DATA.brandMark, 'Leia Rojas');
  assert.equal(PROFILE_DATA.heroHeadlineName, 'Leia Rojas');
});

test('PROJECTS_DATA contains all 6 real projects with exact live URLs', () => {
  assert.equal(PROJECTS_DATA.length, 6);

  const expectedUrls: Record<string, string> = {
    perday: 'https://perday-sigma.vercel.app/',
    wercelworld: 'https://wercelworl.vercel.app/',
    claudelink: 'https://nixai.neocities.org/LinkApp/CLAUDELINK',
    'libro-zay': 'https://nixai.neocities.org/LibroZay',
    fitzone: 'https://nixai.neocities.org/FitZone',
    'libro-2': 'https://nixai.neocities.org/Libro%202',
  };

  for (const project of PROJECTS_DATA) {
    assert.equal(project.liveUrl, expectedUrls[project.id]);
  }
});

test('filterProjects returns all 6 projects for Todos and filters specific categories', () => {
  const all = filterProjects(PROJECTS_DATA, 'Todos');
  assert.equal(all.length, 6);

  const gamesOnly = filterProjects(PROJECTS_DATA, 'Juegos 3D');
  assert.equal(gamesOnly.length, 1);
  assert.equal(gamesOnly[0].id, 'wercelworld');

  const readingOnly = filterProjects(PROJECTS_DATA, 'Lectura');
  assert.equal(readingOnly.length, 2);
});

test('validateContactForm rejects empty or invalid inputs with Spanish errors', () => {
  const invalid = validateContactForm({
    nombre: 'A',
    email: 'correo-invalido',
    mensaje: 'Hola',
  });

  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.nombre);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.mensaje);
});

test('validateContactForm accepts valid Spanish contact payload', () => {
  const valid = validateContactForm({
    nombre: 'Sofía Méndez',
    email: 'sofia@ejemplo.es',
    mensaje: 'Me encantaría colaborar contigo en una experiencia web interactiva.',
  });

  assert.equal(valid.isValid, true);
  assert.deepEqual(valid.errors, {});
});

test('computeCardTilt computes symmetrical rotation within bounds', () => {
  const rect = { left: 100, top: 100, width: 200, height: 200 };
  const center = computeCardTilt(200, 200, rect, 8);
  assert.deepEqual(center, { rotateX: 0, rotateY: 0 });

  const topRight = computeCardTilt(300, 100, rect, 8);
  assert.equal(topRight.rotateY, 8);
  assert.equal(topRight.rotateX, 8);
});
