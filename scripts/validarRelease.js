const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const raizProjeto = path.resolve(__dirname, '..');
const packageJsonPath = path.join(raizProjeto, 'package.json');
const modoRelease = process.argv.includes('--release');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const versao = String(packageJson.version || '').trim();

  if (!/^\d+\.\d+\.\d+$/.test(versao)) {
    falhar(`A versao atual do package.json e invalida: "${versao}".`);
  }

  const branchAtual = executarGit(['branch', '--show-current']);
  const tags = executarGit(['tag', '--list']).split(/\r?\n/).filter(Boolean);
  const tagsAceitas = new Set([versao, `v${versao}`]);
  const tagCompativel = tags.find((tag) => tagsAceitas.has(tag));

  if (!tagCompativel) {
    falhar(`Nao existe tag compativel com a versao ${versao}. Crie e publique a tag "v${versao}" antes do release.`);
  }

  if (modoRelease && !process.env.GH_TOKEN) {
    falhar('GH_TOKEN nao definido. Configure o token do GitHub antes de executar o release.');
  }

  console.log(`Validacao de release OK. Versao: ${versao}. Branch atual: ${branchAtual || 'desconhecida'}. Tag: ${tagCompativel}.`);
  console.log('Observacao: o fluxo de release e guiado por versao + tag, nao pela branch atual.');
} catch (erro) {
  falhar(erro.message || 'Nao foi possivel validar o release.');
}

function executarGit(args) {
  const resultado = spawnSync('git', args, {
    cwd: raizProjeto,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  if (resultado.status !== 0) {
    throw new Error((resultado.stderr || resultado.stdout || 'Falha ao executar git.').trim());
  }

  return String(resultado.stdout || '').trim();
}

function falhar(mensagem) {
  console.error(`Validacao de release falhou: ${mensagem}`);
  process.exit(1);
}
