const express = require('express');
const cors = require('cors');
const { entidades } = require('./configuracoes/entidades');
const { rotaAutenticacao } = require('./rotas/autenticacao');
const { rotaAgendamentos } = require('./rotas/agendamentos');
const { criarRotaCrud } = require('./rotas/crud');
const { diretorioImagens } = require('./utilitarios/imagens');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/api/arquivos/imagens', express.static(diretorioImagens));
app.use('/api/auth', rotaAutenticacao);
app.use('/api/agendamentos', rotaAgendamentos);

entidades.forEach((entidade) => {
  app.use(entidade.rota, criarRotaCrud(entidade));
});

module.exports = app;
