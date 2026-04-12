const express = require('express');
const { consultarTodos } = require('../configuracoes/banco');
const { ehCaminhoImagemLocal } = require('../utilitarios/imagens');
const { montarUrlArquivo } = require('../utilitarios/urlApi');
const {
  adicionarFiltroBusca,
  adicionarFiltroIgual,
  adicionarFiltroLista,
  adicionarFiltroPeriodo,
  montarWhere
} = require('../utilitarios/filtrosSql');

const rotaListagens = express.Router();

rotaListagens.get('/clientes', async (requisicao, resposta) => {
  try {
    const clausulas = [];
    const parametros = [];
    const { query } = requisicao;

    adicionarFiltroBusca(clausulas, parametros, query.search, [
      'CAST(cliente.idCliente AS TEXT)',
      'CAST(cliente.codigoAlternativo AS TEXT)',
      'cliente.nomeFantasia',
      'cliente.razaoSocial',
      'cliente.cnpj',
      'cliente.cidade',
      'cliente.estado',
      'cliente.email',
      'grupoEmpresa.descricao',
      'contatoPrincipal.nome',
      'contatoPrincipal.email',
      'vendedor.nome'
    ]);
    adicionarFiltroLista(clausulas, parametros, 'cliente.estado', query.estado);
    adicionarFiltroIgual(clausulas, parametros, 'cliente.cidade', query.cidade);
    adicionarFiltroIgual(clausulas, parametros, 'cliente.idGrupoEmpresa', query.idGrupoEmpresa, Number);
    adicionarFiltroLista(clausulas, parametros, 'cliente.idRamo', query.idRamo, Number);
    adicionarFiltroLista(clausulas, parametros, 'cliente.idVendedor', query.idVendedor, Number);
    adicionarFiltroLista(clausulas, parametros, 'cliente.tipo', query.tipo);
    adicionarFiltroLista(clausulas, parametros, 'cliente.status', query.status, Number);

    const registros = await consultarTodos(`
      SELECT
        cliente.*,
        COALESCE(grupoEmpresa.descricao, '') AS nomeGrupoEmpresa,
        COALESCE(ramoAtividade.descricao, '') AS nomeRamo,
        COALESCE(vendedor.nome, '') AS nomeVendedor,
        COALESCE(contatoPrincipal.nome, '') AS nomeContatoPrincipal,
        COALESCE(contatoPrincipal.email, '') AS emailContatoPrincipal
      FROM cliente
      LEFT JOIN grupoEmpresa ON grupoEmpresa.idGrupoEmpresa = cliente.idGrupoEmpresa
      LEFT JOIN ramoAtividade ON ramoAtividade.idRamo = cliente.idRamo
      LEFT JOIN vendedor ON vendedor.idVendedor = cliente.idVendedor
      LEFT JOIN contato AS contatoPrincipal
        ON contatoPrincipal.idCliente = cliente.idCliente
       AND contatoPrincipal.principal = 1
      ${montarWhere(clausulas)}
      ORDER BY cliente.idCliente DESC
    `, parametros);

    resposta.json(registros.map(normalizarRegistroImagemListagem));
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

rotaListagens.get('/produtos', async (requisicao, resposta) => {
  try {
    const clausulas = [];
    const parametros = [];
    const { query } = requisicao;

    adicionarFiltroBusca(clausulas, parametros, query.search, [
      'CAST(produto.idProduto AS TEXT)',
      'produto.referencia',
      'produto.descricao',
      'CAST(produto.preco AS TEXT)',
      'grupoProduto.descricao',
      'marca.descricao',
      'unidadeMedida.descricao'
    ]);
    adicionarFiltroLista(clausulas, parametros, 'produto.idGrupo', query.idGrupo, Number);
    adicionarFiltroLista(clausulas, parametros, 'produto.idMarca', query.idMarca, Number);
    adicionarFiltroLista(clausulas, parametros, 'produto.idUnidade', query.idUnidade, Number);
    adicionarFiltroLista(clausulas, parametros, 'produto.status', query.status, Number);

    const registros = await consultarTodos(`
      SELECT
        produto.*,
        COALESCE(grupoProduto.descricao, '') AS nomeGrupo,
        COALESCE(marca.descricao, '') AS nomeMarca,
        COALESCE(unidadeMedida.descricao, '') AS nomeUnidade
      FROM produto
      LEFT JOIN grupoProduto ON grupoProduto.idGrupo = produto.idGrupo
      LEFT JOIN marca ON marca.idMarca = produto.idMarca
      LEFT JOIN unidadeMedida ON unidadeMedida.idUnidade = produto.idUnidade
      ${montarWhere(clausulas)}
      ORDER BY produto.idProduto DESC
    `, parametros);

    resposta.json(registros.map(normalizarRegistroImagemListagem));
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

rotaListagens.get('/atendimentos', async (requisicao, resposta) => {
  try {
    const clausulas = [];
    const parametros = [];
    const { query } = requisicao;

    adicionarFiltroBusca(clausulas, parametros, query.search, [
      'atendimento.assunto',
      'atendimento.descricao',
      'cliente.nomeFantasia',
      'cliente.razaoSocial',
      'contato.nome',
      'tipoAtendimento.descricao',
      'canalAtendimento.descricao',
      'origemAtendimento.descricao',
      'usuario.nome',
      'vendedor.nome'
    ]);
    adicionarFiltroIgual(clausulas, parametros, 'atendimento.idCliente', query.idCliente, Number);
    adicionarFiltroLista(clausulas, parametros, 'atendimento.idUsuario', query.idUsuario, Number);
    adicionarFiltroLista(clausulas, parametros, 'cliente.idVendedor', query.idVendedorCliente, Number);
    adicionarFiltroLista(clausulas, parametros, 'atendimento.idTipoAtendimento', query.idTipoAtendimento, Number);
    adicionarFiltroLista(clausulas, parametros, 'atendimento.idCanalAtendimento', query.idCanalAtendimento, Number);
    adicionarFiltroLista(clausulas, parametros, 'atendimento.idOrigemAtendimento', query.idOrigemAtendimento, Number);
    adicionarFiltroPeriodo(clausulas, parametros, 'atendimento.data', query.dataInicio, query.dataFim);
    adicionarFiltroPeriodo(clausulas, parametros, 'atendimento.horaInicio', query.horaInicioFiltro, query.horaFimFiltro);

    if (query.escopoIdVendedor && query.escopoIdUsuario) {
      clausulas.push('(cliente.idVendedor = ? OR atendimento.idUsuario = ?)');
      parametros.push(Number(query.escopoIdVendedor), Number(query.escopoIdUsuario));
    }

    const registros = await consultarTodos(`
      SELECT
        atendimento.*,
        COALESCE(cliente.nomeFantasia, cliente.razaoSocial, '') AS nomeCliente,
        COALESCE(contato.nome, '') AS nomeContato,
        COALESCE(usuario.nome, '') AS nomeUsuario,
        cliente.idVendedor AS idVendedorCliente,
        COALESCE(vendedor.nome, '') AS nomeVendedorCliente,
        COALESCE(tipoAtendimento.descricao, '') AS nomeTipoAtendimento,
        COALESCE(canalAtendimento.descricao, '') AS nomeCanalAtendimento,
        COALESCE(origemAtendimento.descricao, '') AS nomeOrigemAtendimento
      FROM atendimento
      LEFT JOIN cliente ON cliente.idCliente = atendimento.idCliente
      LEFT JOIN contato ON contato.idContato = atendimento.idContato
      LEFT JOIN usuario ON usuario.idUsuario = atendimento.idUsuario
      LEFT JOIN vendedor ON vendedor.idVendedor = cliente.idVendedor
      LEFT JOIN tipoAtendimento ON tipoAtendimento.idTipoAtendimento = atendimento.idTipoAtendimento
      LEFT JOIN canalAtendimento ON canalAtendimento.idCanalAtendimento = atendimento.idCanalAtendimento
      LEFT JOIN origemAtendimento ON origemAtendimento.idOrigemAtendimento = atendimento.idOrigemAtendimento
      ${montarWhere(clausulas)}
      ORDER BY atendimento.idAtendimento DESC
    `, parametros);

    resposta.json(registros);
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

module.exports = {
  rotaListagens
};

function normalizarRegistroImagemListagem(registro) {
  if (!registro) {
    return null;
  }

  return {
    ...registro,
    imagem: normalizarCaminhoImagemListagem(registro.imagem)
  };
}

function normalizarCaminhoImagemListagem(valorImagem) {
  if (!ehCaminhoImagemLocal(valorImagem)) {
    return valorImagem || '';
  }

  return montarUrlArquivo(valorImagem);
}
