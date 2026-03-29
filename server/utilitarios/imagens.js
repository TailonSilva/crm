const fs = require('node:fs');
const path = require('node:path');
const { caminhoBanco } = require('../configuracoes/banco');

const diretorioDados = path.dirname(caminhoBanco);
const diretorioImagens = path.join(diretorioDados, 'imagens');

function garantirDiretorioImagens() {
  if (!fs.existsSync(diretorioImagens)) {
    fs.mkdirSync(diretorioImagens, { recursive: true });
  }
}

function ehDataUrlImagem(valor) {
  return typeof valor === 'string' && valor.startsWith('data:image/');
}

function ehCaminhoImagemLocal(valor) {
  return typeof valor === 'string' && valor.startsWith('imagens/');
}

function obterCaminhoArquivoImagem(caminhoRelativo) {
  return path.join(diretorioDados, caminhoRelativo);
}

function removerArquivoImagem(caminhoRelativo) {
  if (!ehCaminhoImagemLocal(caminhoRelativo)) {
    return;
  }

  const caminhoArquivo = obterCaminhoArquivoImagem(caminhoRelativo);

  if (fs.existsSync(caminhoArquivo)) {
    fs.unlinkSync(caminhoArquivo);
  }
}

function salvarImagemBase64({ nomeEntidade, idRegistro, valorImagem }) {
  if (!ehDataUrlImagem(valorImagem)) {
    return valorImagem;
  }

  garantirDiretorioImagens();

  const correspondencia = String(valorImagem).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!correspondencia) {
    return valorImagem;
  }

  const [, mimeType, conteudoBase64] = correspondencia;
  const extensao = mimeType.includes('png') ? 'png' : 'jpg';
  const nomeDiretorioEntidade = normalizarNomeDiretorio(nomeEntidade);
  const diretorioEntidade = path.join(diretorioImagens, nomeDiretorioEntidade);

  if (!fs.existsSync(diretorioEntidade)) {
    fs.mkdirSync(diretorioEntidade, { recursive: true });
  }

  const nomeArquivo = `${nomeDiretorioEntidade}-${idRegistro}.${extensao}`;
  const caminhoRelativo = path.posix.join('imagens', nomeDiretorioEntidade, nomeArquivo);
  const caminhoArquivo = path.join(diretorioEntidade, nomeArquivo);

  fs.writeFileSync(caminhoArquivo, Buffer.from(conteudoBase64, 'base64'));

  return caminhoRelativo;
}

function normalizarNomeDiretorio(nomeEntidade) {
  const mapaDiretorios = {
    cliente: 'clientes',
    produto: 'produtos',
    usuario: 'usuarios',
    empresa: 'empresa'
  };

  return mapaDiretorios[nomeEntidade] || `${nomeEntidade}s`;
}

module.exports = {
  diretorioImagens,
  ehCaminhoImagemLocal,
  ehDataUrlImagem,
  removerArquivoImagem,
  salvarImagemBase64
};
