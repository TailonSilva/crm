const express = require('express');
const cors = require('cors');
const { entidades } = require('./configuracoes/entidades');
const { rotaAutenticacao } = require('./rotas/autenticacao');
const { rotaAgendamentos } = require('./rotas/agendamentos');
const { rotaAtualizacaoSistema } = require('./rotas/atualizacaoSistema');
const { rotaImportacaoCadastros } = require('./rotas/importacaoCadastros');
const { rotaListagens } = require('./rotas/listagens');
const { rotaOrcamentos } = require('./rotas/orcamentos');
const { rotaPedidos } = require('./rotas/pedidos');
const { criarRotaCrud } = require('./rotas/crud');
const { diretorioImagens } = require('./utilitarios/imagens');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/api/arquivos/imagens', express.static(diretorioImagens));
app.use('/api/auth', rotaAutenticacao);
app.use('/api/agendamentos', rotaAgendamentos);
app.use('/api/atualizacaoSistema', rotaAtualizacaoSistema);
app.use('/api/importacao', rotaImportacaoCadastros);
app.use('/api/listagens', rotaListagens);
app.use('/api/orcamentos', rotaOrcamentos);
app.use('/api/pedidos', rotaPedidos);

entidades.forEach((entidade) => {
  app.use(entidade.rota, criarRotaCrud(entidade));
});

module.exports = app;
