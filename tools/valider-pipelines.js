// Validation syntaxique et structurelle des deux pipelines + contrôle d'équivalence :
// les mêmes scripts npm et commandes Docker doivent être exécutés sur GitHub Actions et Azure DevOps.
import { readFileSync } from 'node:fs';
import { load as parseYaml } from 'js-yaml';

const errors = [];
const load = (path) => {
  try {
    return parseYaml(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${path} : YAML invalide (${e.message.split('\n')[0]})`);
    return null;
  }
};

const gh = load('.github/workflows/ci.yml');
const az = load('azure-pipelines.yml');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const commandsOf = (scripts) => {
  const set = new Set();
  for (const s of scripts) {
    for (const m of s.matchAll(/npm run ([\w:-]+)/g)) set.add(`npm run ${m[1]}`);
    for (const m of s.matchAll(/docker compose [^\n]+/g)) set.add(m[0].trim());
  }
  return set;
};

let ghRuns = [];
if (gh) {
  if (!gh.on) errors.push('GitHub : déclencheur « on » absent');
  for (const [id, job] of Object.entries(gh.jobs ?? {})) {
    if (!job['runs-on']) errors.push(`GitHub : job ${id} sans runs-on`);
    if (!Array.isArray(job.steps) || job.steps.length === 0) errors.push(`GitHub : job ${id} sans steps`);
    for (const need of [].concat(job.needs ?? [])) if (!gh.jobs[need]) errors.push(`GitHub : ${id} dépend d'un job inconnu ${need}`);
    for (const step of job.steps ?? []) {
      if (!step.uses && !step.run) errors.push(`GitHub : étape sans uses/run dans ${id}`);
      if (step.run) ghRuns.push(step.run);
    }
  }
}

let azRuns = [];
if (az) {
  if (!az.trigger) errors.push('Azure : trigger absent');
  const stageNames = new Set((az.stages ?? []).map((s) => s.stage));
  for (const stage of az.stages ?? []) {
    if (!stage.stage) errors.push('Azure : stage sans nom');
    for (const dep of [].concat(stage.dependsOn ?? [])) if (!stageNames.has(dep)) errors.push(`Azure : ${stage.stage} dépend d'un stage inconnu ${dep}`);
    for (const job of stage.jobs ?? []) {
      if (!job.job) errors.push(`Azure : job sans nom dans ${stage.stage}`);
      for (const step of job.steps ?? []) {
        if (!step.script && !step.task) errors.push(`Azure : étape sans script/task dans ${stage.stage}`);
        if (step.task && !/^[\w]+@\d+$/.test(step.task)) errors.push(`Azure : nom de tâche invalide ${step.task}`);
        if (step.script) azRuns.push(step.script);
      }
    }
  }
}

const ghCmds = commandsOf(ghRuns);
const azCmds = commandsOf(azRuns);
for (const c of ghCmds) if (!azCmds.has(c)) errors.push(`Équivalence : « ${c} » présent sur GitHub mais pas sur Azure`);
for (const c of azCmds) if (!ghCmds.has(c)) errors.push(`Équivalence : « ${c} » présent sur Azure mais pas sur GitHub`);
for (const c of ghCmds) {
  const name = c.match(/^npm run ([\w:-]+)/)?.[1];
  if (name && !pkg.scripts[name]) errors.push(`Script npm inexistant : ${name}`);
}

if (errors.length) {
  console.error(`Pipelines invalides :\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
console.log(`Pipelines valides et équivalents : ${ghCmds.size} commandes communes (${[...ghCmds].join(', ')}).`);
