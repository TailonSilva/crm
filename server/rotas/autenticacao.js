const express = require('express');
const { consultarUm } = require('../configuracoes/banco');
const { obterBaseUrlApi, montarUrlArquivo } = require('../utilitarios/urlApi');

const rota = express.Router();

rota.post('/login', async (requisicao, resposta) => {
  const { usuario, senha } = requisicao.body || {};

  if (!usuario || !senha) {
    resposta.status(400).json({ mensagem: 'Informe usuario e senha.' });
    return;
  }

  try {
    const usuarioEncontrado = await consultarUm(
      'SELECT * FROM usuario WHERE usuario = ?',
      [String(usuario).trim()]
    );

    if (!usuarioEncontrado || usuarioEncontrado.senha !== senha) {
      resposta.status(401).json({ mensagem: 'Usuario ou senha invalidos.' });
      return;
    }

    if (!usuarioEncontrado.ativo) {
      resposta.status(403).json({ mensagem: 'Usuario inativo.' });
      return;
    }

    resposta.json(removerSenhaUsuario(usuarioEncontrado));
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Nao foi possivel autenticar o usuario.' });
  }
});

function removerSenhaUsuario(usuario) {
  const { senha, ...usuarioSemSenha } = usuario;

  return {
    ...usuarioSemSenha,
    imagem: normalizarImagemUsuario(usuarioSemSenha.imagem)
  };
}

function normalizarImagemUsuario(valorImagem) {
  if (typeof valorImagem !== 'string') {
    return '';
  }

  const imagem = valorImagem.trim();

  if (!imagem) {
    return '';
  }

  if (/^https?:\/\//i.test(imagem) || imagem.startsWith('data:image/')) {
    return imagem;
  }

  if (imagem.startsWith('/api/arquivos/')) {
    return `${obterBaseUrlApi()}${imagem}`;
  }

  if (imagem.startsWith('imagens/')) {
    return montarUrlArquivo(imagem);
  }

  return imagem;
}

module.exports = {
  rotaAutenticacao: rota
};
