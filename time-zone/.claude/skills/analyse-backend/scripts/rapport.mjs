#!/usr/bin/env node
// Manipulation déterministe du rapport d'analyse back-end, pour éviter de relire
// et réécrire tout le rapport à chaque changement de statut.
//
// Usage (depuis n'importe quel dossier) :
//   node rapport.mjs liste [ouverts|clos]        une ligne par point
//   node rapport.mjs bloc <ID>                   affiche le bloc avec fichier et lignes
//   node rapport.mjs statut <ID> <texte>         remplace la valeur de la ligne Statut
//   node rapport.mjs verif <ID>                  met « Dernière vérification » à la date du jour
//   node rapport.mjs ligne <ID> <texte>          ajoute « - <texte> » à la fin du bloc
//   node rapport.mjs clore <ID>                  déplace le point en tête du fichier des points clos
//   node rapport.mjs placer <ID> [<sous-section>] range un point ouvert dans sa sous-section (ex. 2.1)
//   node rapport.mjs synthese                    recalcule le tableau de synthèse
//
// <ID> accepte l'identifiant complet ou le numéro seul s'il est unique.
// Les commandes qui modifient le rapport recalculent ensuite la synthèse.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const MAIN = join(ROOT, 'rapport-analyse-backend.md');
const CLOS = join(ROOT, 'rapport-analyse-backend-clos.md');
const CLOS_HEADER = [
  "# Points clos du rapport d'analyse back-end",
  '',
  '> Points corrigés ou ignorés, triés par date de clôture (la plus récente en premier). Les points ouverts sont dans `rapport-analyse-backend.md`.',
  '',
];
const GRAVITES = ['Critique', 'Majeur', 'Mineur', 'Info'];
const AUCUN = 'Aucun point ouvert.';
const BLOCK_RE = /^#### (BACK-\d{8}-\d{2}) · (\S+) · (.*)$/;
const HEADING_RE = /^#{1,4} /;

const today = () => new Date().toLocaleDateString('sv-SE');
const fail = (msg) => { console.error(msg); process.exit(1); };
const read = (file) => existsSync(file) ? readFileSync(file, 'utf8').split('\n') : null;
const write = (file, lines) => writeFileSync(file, lines.join('\n').replace(/\n{3,}/g, '\n\n'));

// Blocs d'un fichier : { id, gravite, titre, start, end } (end exclu, lignes vides finales exclues).
function blocks(lines) {
  const out = [];
  lines.forEach((line, i) => {
    const m = BLOCK_RE.exec(line);
    if (!m) return;
    let end = i + 1;
    while (end < lines.length && !HEADING_RE.test(lines[end])) end++;
    while (end > i + 1 && lines[end - 1].trim() === '') end--;
    out.push({ id: m[1], gravite: m[2], titre: m[3], start: i, end });
  });
  return out;
}

function statutOf(lines, b) {
  const l = lines.slice(b.start, b.end).find((x) => x.startsWith('- **Statut** :'));
  return l ? l.replace('- **Statut** :', '').trim() : '?';
}

function sectionOf(lines, b) {
  for (let i = b.start; i >= 0; i--) {
    const m = /^### (\d\.\d) /.exec(lines[i]);
    if (m) return m[1];
    if (/^## /.test(lines[i])) return null;
  }
  return null;
}

function load() {
  const main = read(MAIN) ?? fail(`Rapport introuvable : ${MAIN}`);
  const clos = read(CLOS) ?? [...CLOS_HEADER];
  return { main, clos };
}

// Trouve un point par identifiant complet ou par numéro final.
function find(files, query) {
  const hits = [];
  for (const [name, lines] of Object.entries(files)) {
    for (const b of blocks(lines)) {
      if (b.id === query || b.id.endsWith(`-${query.padStart(2, '0')}`)) hits.push({ name, lines, b });
    }
  }
  if (hits.length === 0) fail(`Aucun point ne correspond à « ${query} ».`);
  if (hits.length > 1) fail(`Identifiant ambigu, préciser : ${hits.map((h) => h.b.id).join(', ')}`);
  return hits[0];
}

const fileOf = (name) => (name === 'main' ? MAIN : CLOS);
const key = (b) => `${GRAVITES.indexOf(b.gravite)}|${b.id}`;

function placeIn(lines, blockLines, b, section) {
  const h = lines.findIndex((l) => l.startsWith(`### ${section} `));
  if (h < 0) fail(`Sous-section ${section} introuvable.`);
  let end = h + 1;
  while (end < lines.length && !/^#{2,3} /.test(lines[end])) end++;
  const next = blocks(lines).find((x) => x.start > h && x.start < end && key(x) > key(b));
  let at = next ? next.start : end;
  if (!next) while (at > h + 1 && lines[at - 1].trim() === '') at--;
  lines.splice(at, 0, '', ...blockLines, '');
}

function synthese(lines) {
  // Normalise « Aucun point ouvert. » dans chaque sous-section.
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!/^### \d\.\d /.test(lines[i])) continue;
    let end = i + 1;
    while (end < lines.length && !/^#{2,3} /.test(lines[end])) end++;
    const body = lines.slice(i + 1, end);
    const hasBlock = body.some((l) => BLOCK_RE.test(l));
    const kept = body.filter((l) => l.trim() !== AUCUN);
    const rebuilt = hasBlock ? kept : [...kept.filter((l) => l.trim() !== ''), AUCUN].flatMap((l) => ['', l]);
    lines.splice(i + 1, end - i - 1, ...rebuilt, '');
  }
  const counts = { 1: [0, 0, 0, 0], 2: [0, 0, 0, 0] };
  const anomalies = [];
  for (const b of blocks(lines)) {
    const s = sectionOf(lines, b);
    const g = GRAVITES.indexOf(b.gravite);
    if (!s || g < 0) { anomalies.push(`${b.id} (section ou gravité non reconnue)`); continue; }
    if (statutOf(lines, b) !== 'Ouvert') anomalies.push(`${b.id} (statut « ${statutOf(lines, b)} » dans le rapport principal)`);
    counts[s[0]][g]++;
  }
  const total = GRAVITES.map((_, g) => counts[1][g] + counts[2][g]);
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const row = (label, c, bold) => {
    const f = (v) => (bold ? `**${v}**` : `${v}`);
    return `| ${label} | ${[...c, sum(c)].map(f).join(' | ')} |`;
  };
  const rows = {
    '| 1. Analyse technique |': row('1. Analyse technique', counts[1]),
    '| 2. Analyse fonctionnelle |': row('2. Analyse fonctionnelle', counts[2]),
    '| **Total** |': row('**Total**', total, true),
  };
  for (let i = 0; i < lines.length; i++) {
    for (const [prefix, value] of Object.entries(rows)) if (lines[i].startsWith(prefix)) lines[i] = value;
  }
  const resume = `Synthèse : ${GRAVITES.map((g, i) => `${total[i]} ${g}`).join(', ')} (${sum(total)} ouverts).`;
  return anomalies.length ? `${resume}\nAnomalies : ${anomalies.join(' ; ')}` : resume;
}

const [cmd, arg, ...rest] = process.argv.slice(2);
const { main, clos } = load();

switch (cmd) {
  case 'liste': {
    const sources = arg === 'clos' ? { clos } : arg === 'ouverts' ? { main } : { main, clos };
    for (const lines of Object.values(sources)) {
      for (const b of blocks(lines)) {
        console.log([b.id, b.gravite, sectionOf(lines, b) ?? 'clos', statutOf(lines, b), b.titre].join(' · '));
      }
    }
    break;
  }
  case 'bloc': {
    const { name, lines, b } = find({ main, clos }, arg ?? fail('Identifiant manquant.'));
    console.log(`${fileOf(name)}:${b.start + 1}-${b.end}`);
    console.log(lines.slice(b.start, b.end).join('\n'));
    break;
  }
  case 'statut':
  case 'verif':
  case 'ligne': {
    const { name, lines, b } = find({ main, clos }, arg ?? fail('Identifiant manquant.'));
    const text = rest.join(' ');
    if (cmd !== 'verif' && !text) fail('Texte manquant.');
    if (cmd === 'ligne') {
      lines.splice(b.end, 0, `- ${text.replace(/^- /, '')}`);
    } else {
      const re = cmd === 'statut' ? /^- \*\*Statut\*\* :.*$/ : /\*\*Dernière vérification\*\* : \d{4}-\d{2}-\d{2}/;
      const i = lines.findIndex((l, j) => j >= b.start && j < b.end && re.test(l));
      if (i < 0) fail(`Ligne à modifier introuvable dans ${b.id}.`);
      lines[i] = cmd === 'statut'
        ? `- **Statut** : ${text}`
        : lines[i].replace(re, `**Dernière vérification** : ${today()}`);
    }
    const out = name === 'main' ? synthese(lines) : '';
    write(fileOf(name), lines);
    console.log(`${b.id} mis à jour.`, out);
    break;
  }
  case 'clore': {
    const { name, lines, b } = find({ main, clos }, arg ?? fail('Identifiant manquant.'));
    if (name !== 'main') fail(`${b.id} est déjà dans les points clos.`);
    const block = lines.splice(b.start, b.end - b.start);
    const first = blocks(clos)[0];
    const at = first ? first.start : clos.length;
    clos.splice(at, 0, ...block, '');
    const out = synthese(main);
    write(MAIN, main);
    write(CLOS, clos);
    console.log(`${b.id} déplacé en tête des points clos.`, out);
    break;
  }
  case 'placer': {
    const { name, lines, b } = find({ main, clos }, arg ?? fail('Identifiant manquant.'));
    const section = rest[0] ?? (name === 'main' ? sectionOf(lines, b) : null);
    if (!section) fail('Sous-section à préciser (ex. 2.1) pour un point venant des points clos.');
    const block = lines.splice(b.start, b.end - b.start);
    placeIn(main, block, b, section);
    const out = synthese(main);
    write(MAIN, main);
    if (name === 'clos') write(CLOS, clos);
    console.log(`${b.id} placé dans ${section}.`, out);
    break;
  }
  case 'synthese': {
    const out = synthese(main);
    write(MAIN, main);
    console.log(out);
    break;
  }
  default:
    fail('Commandes : liste [ouverts|clos], bloc, statut, verif, ligne, clore, placer, synthese.');
}
