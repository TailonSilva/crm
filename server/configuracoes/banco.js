const path = require('node:path');
const fs = require('node:fs');
const sqlite3 = require('sqlite3').verbose();

const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;
const ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO = 2;
const ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO = 3;
const ID_ETAPA_ORCAMENTO_RECUSADO = 4;
const ID_ETAPA_PEDIDO_ENTREGUE = 5;
const ID_TIPO_PEDIDO_VENDA = 1;
const ID_TIPO_PEDIDO_DEVOLUCAO = 2;
const ID_STATUS_VISITA_AGENDADO = 1;
const ID_STATUS_VISITA_CONFIRMADO = 2;
const ID_STATUS_VISITA_REALIZADO = 3;
const ID_STATUS_VISITA_CANCELADO = 4;
const ID_STATUS_VISITA_NAO_COMPARECEU = 5;

const diretorioDados = process.env.CRM_DATA_DIR
  ? path.resolve(process.env.CRM_DATA_DIR)
  : path.resolve(__dirname, '..', '..', 'data');

if (!fs.existsSync(diretorioDados)) {
  fs.mkdirSync(diretorioDados, { recursive: true });
}

const caminhoBanco = path.join(diretorioDados, 'crm.sqlite');
const banco = new sqlite3.Database(caminhoBanco);

banco.serialize(() => {
  banco.run('PRAGMA foreignKeys = ON');

  banco.run(`
    CREATE TABLE IF NOT EXISTS ramoAtividade (
      idRamo INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS vendedor (
      idVendedor INTEGER PRIMARY KEY AUTOINCREMENT,
      nome VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      comissaoPadrao DECIMAL(7, 2) NOT NULL DEFAULT 0,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    ALTER TABLE vendedor ADD COLUMN comissaoPadrao DECIMAL(7, 2) NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna comissaoPadrao do vendedor.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS grupoProduto (
      idGrupo INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS grupoEmpresa (
      idGrupoEmpresa INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS contatoGrupoEmpresa (
      idContatoGrupoEmpresa INTEGER PRIMARY KEY AUTOINCREMENT,
      idGrupoEmpresa INTEGER NOT NULL,
      nome VARCHAR(150) NOT NULL,
      cargo VARCHAR(100),
      email VARCHAR(150),
      telefone VARCHAR(20),
      whatsapp VARCHAR(20),
      status BOOLEAN NOT NULL DEFAULT 1,
      principal BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (idGrupoEmpresa) REFERENCES grupoEmpresa (idGrupoEmpresa)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS tamanho (
      idTamanho INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(80) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS grupoProdutoTamanho (
      idGrupoProdutoTamanho INTEGER PRIMARY KEY AUTOINCREMENT,
      idGrupo INTEGER NOT NULL,
      idTamanho INTEGER NOT NULL,
      ordem INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (idGrupo) REFERENCES grupoProduto (idGrupo) ON DELETE CASCADE,
      FOREIGN KEY (idTamanho) REFERENCES tamanho (idTamanho)
    )
  `);

  banco.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS indiceGrupoProdutoTamanhoUnico
    ON grupoProdutoTamanho (idGrupo, idTamanho)
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS marca (
      idMarca INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS unidadeMedida (
      idUnidade INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(50) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS localAgenda (
      idLocal INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS tipoRecurso (
      idTipoRecurso INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS recurso (
      idRecurso INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      idTipoRecurso INTEGER NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1,
      FOREIGN KEY (idTipoRecurso) REFERENCES tipoRecurso (idTipoRecurso)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS agendamento (
      idAgendamento INTEGER PRIMARY KEY AUTOINCREMENT,
      data DATE NOT NULL,
      assunto VARCHAR(255),
      horaInicio VARCHAR(5) NOT NULL,
      horaFim VARCHAR(5) NOT NULL,
      idLocal INTEGER,
      idRecurso INTEGER,
      idCliente INTEGER,
      idContato INTEGER,
      idUsuario INTEGER NOT NULL,
      idTipoAgenda INTEGER,
      idStatusVisita INTEGER,
      tipo VARCHAR(100),
      status BOOLEAN NOT NULL DEFAULT 1,
      FOREIGN KEY (idLocal) REFERENCES localAgenda (idLocal),
      FOREIGN KEY (idRecurso) REFERENCES recurso (idRecurso),
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
      FOREIGN KEY (idContato) REFERENCES contato (idContato),
      FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
      FOREIGN KEY (idTipoAgenda) REFERENCES tipoAgenda (idTipoAgenda),
      FOREIGN KEY (idStatusVisita) REFERENCES statusVisita (idStatusVisita)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS agendamentoRecurso (
      idAgendamentoRecurso INTEGER PRIMARY KEY AUTOINCREMENT,
      idAgendamento INTEGER NOT NULL,
      idRecurso INTEGER NOT NULL,
      FOREIGN KEY (idAgendamento) REFERENCES agendamento (idAgendamento) ON DELETE CASCADE,
      FOREIGN KEY (idRecurso) REFERENCES recurso (idRecurso)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS agendamentoUsuario (
      idAgendamentoUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
      idAgendamento INTEGER NOT NULL,
      idUsuario INTEGER NOT NULL,
      FOREIGN KEY (idAgendamento) REFERENCES agendamento (idAgendamento) ON DELETE CASCADE,
      FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS agendamentoStatusUsuario (
      idAgendamentoStatusUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
      idAgendamento INTEGER NOT NULL,
      idUsuario INTEGER NOT NULL,
      idStatusVisita INTEGER NOT NULL,
      FOREIGN KEY (idAgendamento) REFERENCES agendamento (idAgendamento) ON DELETE CASCADE,
      FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
      FOREIGN KEY (idStatusVisita) REFERENCES statusVisita (idStatusVisita)
    )
  `);

  banco.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS indiceAgendamentoStatusUsuarioUnico
    ON agendamentoStatusUsuario (idAgendamento, idUsuario)
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS tipoAgenda (
      idTipoAgenda INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(100) NOT NULL,
      cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1',
      obrigarCliente BOOLEAN NOT NULL DEFAULT 0,
      obrigarLocal BOOLEAN NOT NULL DEFAULT 0,
      obrigarRecurso BOOLEAN NOT NULL DEFAULT 0,
      ordem INTEGER NOT NULL DEFAULT 0,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    ALTER TABLE tipoAgenda ADD COLUMN cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1'
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna cor do tipo de agenda.', erro);
    }
  });

  banco.run(`
    ALTER TABLE tipoAgenda ADD COLUMN obrigarCliente BOOLEAN NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna obrigarCliente do tipo de agenda.', erro);
    }
  });

  banco.run(`
    ALTER TABLE tipoAgenda ADD COLUMN obrigarLocal BOOLEAN NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna obrigarLocal do tipo de agenda.', erro);
    }
  });

  banco.run(`
    ALTER TABLE tipoAgenda ADD COLUMN obrigarRecurso BOOLEAN NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna obrigarRecurso do tipo de agenda.', erro);
    }
  });

  banco.run(`
    ALTER TABLE tipoAgenda ADD COLUMN ordem INTEGER NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna ordem do tipo de agenda.', erro);
    }
  });

  banco.run(`
    UPDATE tipoAgenda
    SET ordem = idTipoAgenda
    WHERE ordem IS NULL OR ordem <= 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('no such column')) {
      console.error('Nao foi possivel atualizar a ordem dos tipos de agenda.', erro);
    }
  });

  banco.run(`
    ALTER TABLE agendamento ADD COLUMN assunto VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna assunto do agendamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE agendamento ADD COLUMN idTipoAgenda INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idTipoAgenda do agendamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE agendamento ADD COLUMN idStatusVisita INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idStatusVisita do agendamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE agendamento ADD COLUMN idContato INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idContato do agendamento.', erro);
    }
  });

  banco.all(
    'PRAGMA table_info(agendamento)',
    (erro, colunasAgendamento) => {
      if (erro || !Array.isArray(colunasAgendamento) || colunasAgendamento.length === 0) {
        if (erro) {
          console.error('Nao foi possivel consultar a estrutura da tabela agendamento.', erro);
        }
        return;
      }

      const colunaLocal = colunasAgendamento.find((coluna) => coluna.name === 'idLocal');
      const colunaRecurso = colunasAgendamento.find((coluna) => coluna.name === 'idRecurso');
      const colunaCliente = colunasAgendamento.find((coluna) => coluna.name === 'idCliente');

      if (!colunaLocal?.notnull && !colunaRecurso?.notnull && !colunaCliente?.notnull) {
        return;
      }

      banco.serialize(() => {
        banco.run('PRAGMA foreign_keys = OFF');
        banco.run('DROP TABLE IF EXISTS agendamento_migracao');
        banco.run(`
          CREATE TABLE agendamento_migracao (
            idAgendamento INTEGER PRIMARY KEY AUTOINCREMENT,
            data DATE NOT NULL,
            assunto VARCHAR(255),
            horaInicio VARCHAR(5) NOT NULL,
            horaFim VARCHAR(5) NOT NULL,
            idLocal INTEGER,
            idRecurso INTEGER,
            idCliente INTEGER,
            idContato INTEGER,
            idUsuario INTEGER NOT NULL,
            idTipoAgenda INTEGER,
            idStatusVisita INTEGER,
            status BOOLEAN NOT NULL DEFAULT 1,
            tipo VARCHAR(100),
            FOREIGN KEY (idLocal) REFERENCES localAgenda (idLocal),
            FOREIGN KEY (idRecurso) REFERENCES recurso (idRecurso),
            FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
            FOREIGN KEY (idContato) REFERENCES contato (idContato),
            FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
            FOREIGN KEY (idTipoAgenda) REFERENCES tipoAgenda (idTipoAgenda),
            FOREIGN KEY (idStatusVisita) REFERENCES statusVisita (idStatusVisita)
          )
        `);
        banco.run(`
          INSERT INTO agendamento_migracao (
            idAgendamento,
            data,
            assunto,
            horaInicio,
            horaFim,
            idLocal,
            idRecurso,
            idCliente,
            idContato,
            idUsuario,
            idTipoAgenda,
            idStatusVisita,
            status,
            tipo
          )
          SELECT
            idAgendamento,
            data,
            assunto,
            horaInicio,
            horaFim,
            idLocal,
            idRecurso,
            idCliente,
            idContato,
            idUsuario,
            idTipoAgenda,
            idStatusVisita,
            status,
            tipo
          FROM agendamento
        `);
        banco.run('DROP TABLE agendamento');
        banco.run('ALTER TABLE agendamento_migracao RENAME TO agendamento');
        banco.run('PRAGMA foreign_keys = ON');
      });
    }
  );

  banco.all(
    'PRAGMA table_info(agendamento)',
    (erro, colunasAgendamento) => {
      if (erro || !Array.isArray(colunasAgendamento) || colunasAgendamento.length === 0) {
        if (erro) {
          console.error('Nao foi possivel consultar a estrutura da tabela agendamento.', erro);
        }
        return;
      }

      const colunaLocal = colunasAgendamento.find((coluna) => coluna.name === 'idLocal');
      const colunaRecurso = colunasAgendamento.find((coluna) => coluna.name === 'idRecurso');
      const colunaCliente = colunasAgendamento.find((coluna) => coluna.name === 'idCliente');
      const precisaMigrar = Boolean(colunaLocal?.notnull || colunaRecurso?.notnull || colunaCliente?.notnull);

      if (!precisaMigrar) {
        return;
      }

      banco.serialize(() => {
        banco.run('PRAGMA foreign_keys = OFF');
        banco.run('DROP TABLE IF EXISTS agendamento_temp');
        banco.run(`
          CREATE TABLE agendamento_temp (
            idAgendamento INTEGER PRIMARY KEY AUTOINCREMENT,
            data DATE NOT NULL,
            assunto VARCHAR(255),
            horaInicio VARCHAR(5) NOT NULL,
            horaFim VARCHAR(5) NOT NULL,
            idLocal INTEGER,
            idRecurso INTEGER,
            idCliente INTEGER,
            idContato INTEGER,
            idUsuario INTEGER NOT NULL,
            idTipoAgenda INTEGER,
            idStatusVisita INTEGER,
            tipo VARCHAR(100),
            status BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (idLocal) REFERENCES localAgenda (idLocal),
            FOREIGN KEY (idRecurso) REFERENCES recurso (idRecurso),
            FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
            FOREIGN KEY (idContato) REFERENCES contato (idContato),
            FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
            FOREIGN KEY (idTipoAgenda) REFERENCES tipoAgenda (idTipoAgenda),
            FOREIGN KEY (idStatusVisita) REFERENCES statusVisita (idStatusVisita)
          )
        `);
        banco.run(`
          INSERT INTO agendamento_temp (
            idAgendamento,
            data,
            assunto,
            horaInicio,
            horaFim,
            idLocal,
            idRecurso,
            idCliente,
            idContato,
            idUsuario,
            idTipoAgenda,
            idStatusVisita,
            tipo,
            status
          )
          SELECT
            idAgendamento,
            data,
            assunto,
            horaInicio,
            horaFim,
            idLocal,
            idRecurso,
            idCliente,
            idContato,
            idUsuario,
            idTipoAgenda,
            idStatusVisita,
            tipo,
            status
          FROM agendamento
        `);
        banco.run('DROP TABLE agendamento');
        banco.run('ALTER TABLE agendamento_temp RENAME TO agendamento');
        banco.run('PRAGMA foreign_keys = ON');
      });
    }
  );

  banco.run(`
    CREATE TABLE IF NOT EXISTS metodoPagamento (
      idMetodoPagamento INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(100) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS tipoPedido (
      idTipoPedido INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS prazoPagamento (
      idPrazoPagamento INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150),
      idMetodoPagamento INTEGER NOT NULL,
      prazo1 INTEGER,
      prazo2 INTEGER,
      prazo3 INTEGER,
      prazo4 INTEGER,
      prazo5 INTEGER,
      prazo6 INTEGER,
      status BOOLEAN NOT NULL DEFAULT 1,
      FOREIGN KEY (idMetodoPagamento) REFERENCES metodoPagamento (idMetodoPagamento)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS statusVisita (
      idStatusVisita INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(100) NOT NULL,
      icone VARCHAR(10),
      ordem INTEGER NOT NULL DEFAULT 0,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS canalAtendimento (
      idCanalAtendimento INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(100) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS origemAtendimento (
      idOrigemAtendimento INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(100) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    ALTER TABLE statusVisita ADD COLUMN icone VARCHAR(10)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna icone do status da visita.', erro);
    }
  });

  banco.run(`
    ALTER TABLE statusVisita ADD COLUMN ordem INTEGER NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna ordem do status da visita.', erro);
    }
  });

  banco.run(`
    UPDATE statusVisita
    SET ordem = idStatusVisita
    WHERE ordem IS NULL OR ordem <= 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('no such column')) {
      console.error('Nao foi possivel atualizar a ordem dos status da agenda.', erro);
    }
  });

  banco.run(`
    ALTER TABLE motivoEncerramento RENAME TO motivoPerda
  `, (erro) => {
    if (
      erro &&
      !String(erro.message || '').includes('no such table') &&
      !String(erro.message || '').includes('another table or index with this name')
    ) {
      console.error('Nao foi possivel renomear a tabela motivoEncerramento para motivoPerda.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS motivoPerda (
      idMotivo INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS motivoDevolucao (
      idMotivoDevolucao INTEGER PRIMARY KEY AUTOINCREMENT,
      abreviacao VARCHAR(30) NOT NULL,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS etapaPedido (
      idEtapa INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1',
      ordem INTEGER NOT NULL DEFAULT 0,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    ALTER TABLE etapaPedido ADD COLUMN cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1'
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna cor da etapa de pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE etapaPedido ADD COLUMN ordem INTEGER NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna ordem da etapa de pedido.', erro);
    }
  });

  banco.run(`
    UPDATE etapaPedido
    SET ordem = idEtapa
    WHERE ordem IS NULL OR ordem <= 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('no such column')) {
      console.error('Nao foi possivel atualizar a ordem das etapas de pedido.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS etapaOrcamento (
      idEtapaOrcamento INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1',
      obrigarMotivoPerda BOOLEAN NOT NULL DEFAULT 0,
      consideraFunilVendas BOOLEAN NOT NULL DEFAULT 1,
      ordem INTEGER NOT NULL DEFAULT 0,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    ALTER TABLE etapaOrcamento ADD COLUMN obrigarMotivoPerda BOOLEAN NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna obrigarMotivoPerda da etapa de orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE etapaOrcamento ADD COLUMN ordem INTEGER NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna ordem da etapa de orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE etapaOrcamento ADD COLUMN consideraFunilVendas BOOLEAN NOT NULL DEFAULT 1
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna consideraFunilVendas da etapa de orcamento.', erro);
    }
  });

  banco.run(`
    UPDATE etapaOrcamento
    SET consideraFunilVendas = 1
    WHERE consideraFunilVendas IS NULL
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('no such column')) {
      console.error('Nao foi possivel atualizar o campo consideraFunilVendas das etapas de orcamento.', erro);
    }
  });

  banco.run(`
    UPDATE etapaOrcamento
    SET ordem = idEtapaOrcamento
    WHERE ordem IS NULL OR ordem <= 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('no such column')) {
      console.error('Nao foi possivel atualizar a ordem das etapas de orcamento.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS campoOrcamentoConfiguravel (
      idCampoOrcamento INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo VARCHAR(150) NOT NULL,
      descricaoPadrao TEXT,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS campoPedidoConfiguravel (
      idCampoPedido INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo VARCHAR(150) NOT NULL,
      descricaoPadrao TEXT,
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    ALTER TABLE campoOrcamentoConfiguravel ADD COLUMN titulo VARCHAR(150)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna titulo do campo de orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE campoOrcamentoConfiguravel ADD COLUMN descricaoPadrao TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna descricaoPadrao do campo de orcamento.', erro);
    }
  });

  banco.run(`
    UPDATE campoOrcamentoConfiguravel
    SET
      titulo = COALESCE(NULLIF(titulo, ''), descricao),
      descricaoPadrao = COALESCE(descricaoPadrao, descricao)
    WHERE descricao IS NOT NULL
  `, (erro) => {
    if (
      erro &&
      !String(erro.message || '').includes('no such column')
    ) {
      console.error('Nao foi possivel migrar os dados legados dos campos de orcamento.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS empresa (
      idEmpresa INTEGER PRIMARY KEY AUTOINCREMENT,
      razaoSocial VARCHAR(255) NOT NULL,
      nomeFantasia VARCHAR(255) NOT NULL,
      slogan VARCHAR(255),
      tipo VARCHAR(20) NOT NULL,
      cnpj VARCHAR(18) NOT NULL,
      inscricaoEstadual VARCHAR(20),
      email VARCHAR(150),
      telefone VARCHAR(20),
      horaInicioManha VARCHAR(5),
      horaFimManha VARCHAR(5),
      horaInicioTarde VARCHAR(5),
      horaFimTarde VARCHAR(5),
      trabalhaSabado BOOLEAN NOT NULL DEFAULT 0,
      horaInicioSabado VARCHAR(5),
      horaFimSabado VARCHAR(5),
      exibirFunilPaginaInicial BOOLEAN NOT NULL DEFAULT 1,
      diasValidadeOrcamento INTEGER NOT NULL DEFAULT 7,
      diasEntregaPedido INTEGER NOT NULL DEFAULT 7,
      codigoPrincipalCliente VARCHAR(30) NOT NULL DEFAULT 'codigo',
      etapasFiltroPadraoOrcamento TEXT,
      colunasGridClientes TEXT,
      colunasGridOrcamentos TEXT,
      colunasGridProdutos TEXT,
      colunasGridPedidos TEXT,
      colunasGridAtendimentos TEXT,
      graficosPaginaInicialOrcamentos TEXT,
      graficosPaginaInicialVendas TEXT,
      cardsPaginaInicial TEXT,
      corPrimariaOrcamento VARCHAR(7) NOT NULL DEFAULT '#111827',
      corSecundariaOrcamento VARCHAR(7) NOT NULL DEFAULT '#ef4444',
      corDestaqueOrcamento VARCHAR(7) NOT NULL DEFAULT '#f59e0b',
      destaqueItemOrcamentoPdf VARCHAR(20) NOT NULL DEFAULT 'descricao',
      logradouro VARCHAR(255),
      numero VARCHAR(10),
      complemento VARCHAR(100),
      bairro VARCHAR(100),
      cidade VARCHAR(100),
      estado CHAR(2),
      cep VARCHAR(10),
      imagem VARCHAR(255),
      dataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS configuracaoAtualizacaoSistema (
      idConfiguracaoAtualizacao INTEGER PRIMARY KEY CHECK (idConfiguracaoAtualizacao = 1),
      urlRepositorio VARCHAR(255) NOT NULL,
      dataAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  banco.run(`
    ALTER TABLE empresa ADD COLUMN slogan VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna slogan da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN horaInicioManha VARCHAR(5)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna horaInicioManha da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN horaFimManha VARCHAR(5)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna horaFimManha da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN horaInicioTarde VARCHAR(5)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna horaInicioTarde da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN horaFimTarde VARCHAR(5)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna horaFimTarde da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN trabalhaSabado BOOLEAN NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna trabalhaSabado da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN horaInicioSabado VARCHAR(5)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna horaInicioSabado da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN horaFimSabado VARCHAR(5)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna horaFimSabado da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN exibirFunilPaginaInicial BOOLEAN NOT NULL DEFAULT 1
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna exibirFunilPaginaInicial da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN diasValidadeOrcamento INTEGER NOT NULL DEFAULT 7
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna diasValidadeOrcamento da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN diasEntregaPedido INTEGER NOT NULL DEFAULT 7
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna diasEntregaPedido da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN codigoPrincipalCliente VARCHAR(30) NOT NULL DEFAULT 'codigo'
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna codigoPrincipalCliente da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN etapasFiltroPadraoOrcamento TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna etapasFiltroPadraoOrcamento da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN colunasGridClientes TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna colunasGridClientes da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN colunasGridOrcamentos TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna colunasGridOrcamentos da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN colunasGridProdutos TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna colunasGridProdutos da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN colunasGridPedidos TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna colunasGridPedidos da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN colunasGridAtendimentos TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna colunasGridAtendimentos da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN graficosPaginaInicialOrcamentos TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna graficosPaginaInicialOrcamentos da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN graficosPaginaInicialVendas TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna graficosPaginaInicialVendas da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN cardsPaginaInicial TEXT
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna cardsPaginaInicial da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN corPrimariaOrcamento VARCHAR(7) NOT NULL DEFAULT '#111827'
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna corPrimariaOrcamento da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN corSecundariaOrcamento VARCHAR(7) NOT NULL DEFAULT '#ef4444'
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna corSecundariaOrcamento da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN corDestaqueOrcamento VARCHAR(7) NOT NULL DEFAULT '#f59e0b'
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna corDestaqueOrcamento da empresa.', erro);
    }
  });

  banco.run(`
    ALTER TABLE empresa ADD COLUMN destaqueItemOrcamentoPdf VARCHAR(20) NOT NULL DEFAULT 'descricao'
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna destaqueItemOrcamentoPdf da empresa.', erro);
    }
  });

  banco.run(`
    UPDATE empresa
    SET codigoPrincipalCliente = 'codigo'
    WHERE codigoPrincipalCliente IS NULL OR TRIM(codigoPrincipalCliente) = ''
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('no such column')) {
      console.error('Nao foi possivel normalizar o codigoPrincipalCliente da empresa.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS usuario (
      idUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
      nome VARCHAR(150) NOT NULL,
      usuario VARCHAR(80) NOT NULL UNIQUE,
      senha VARCHAR(120) NOT NULL,
      tipo VARCHAR(30) NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT 1,
      imagem VARCHAR(255),
      idVendedor INTEGER,
      FOREIGN KEY (idVendedor) REFERENCES vendedor (idVendedor)
    )
  `);

  banco.run(`
    ALTER TABLE usuario ADD COLUMN imagem VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna imagem do usuario.', erro);
    }
  });

  banco.run(`
    ALTER TABLE usuario ADD COLUMN idVendedor INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idVendedor do usuario.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS cliente (
      idCliente INTEGER PRIMARY KEY AUTOINCREMENT,
      idVendedor INTEGER NOT NULL,
      idRamo INTEGER NOT NULL,
      idGrupoEmpresa INTEGER,
      codigoAlternativo INTEGER,
      razaoSocial VARCHAR(255) NOT NULL,
      nomeFantasia VARCHAR(255) NOT NULL,
      tipo VARCHAR(20) NOT NULL,
      cnpj VARCHAR(18) NOT NULL,
      inscricaoEstadual VARCHAR(20),
      status BOOLEAN NOT NULL DEFAULT 1,
      email VARCHAR(150),
      telefone VARCHAR(20),
      logradouro VARCHAR(255),
      numero VARCHAR(10),
      complemento VARCHAR(100),
      bairro VARCHAR(100),
      cidade VARCHAR(100),
      estado CHAR(2),
      cep VARCHAR(10),
      observacao TEXT,
      imagem VARCHAR(255),
      dataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idVendedor) REFERENCES vendedor (idVendedor),
      FOREIGN KEY (idRamo) REFERENCES ramoAtividade (idRamo),
      FOREIGN KEY (idGrupoEmpresa) REFERENCES grupoEmpresa (idGrupoEmpresa)
    )
  `);

  banco.run(`
    ALTER TABLE cliente ADD COLUMN idGrupoEmpresa INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idGrupoEmpresa do cliente.', erro);
    }
  });

  banco.run(`
    ALTER TABLE cliente ADD COLUMN codigoAlternativo INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna codigoAlternativo do cliente.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS contato (
      idContato INTEGER PRIMARY KEY AUTOINCREMENT,
      idCliente INTEGER NOT NULL,
      nome VARCHAR(150) NOT NULL,
      cargo VARCHAR(100),
      email VARCHAR(150),
      telefone VARCHAR(20),
      whatsapp VARCHAR(20),
      status BOOLEAN NOT NULL DEFAULT 1,
      principal BOOLEAN NOT NULL DEFAULT 0,
      contatoVinculadoGrupo BOOLEAN NOT NULL DEFAULT 0,
      idContatoGrupoEmpresaOrigem INTEGER,
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente)
    )
  `);

  banco.run(`
    ALTER TABLE contato ADD COLUMN contatoVinculadoGrupo BOOLEAN NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna contatoVinculadoGrupo do contato.', erro);
    }
  });

  banco.run(`
    ALTER TABLE contato ADD COLUMN idContatoGrupoEmpresaOrigem INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idContatoGrupoEmpresaOrigem do contato.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS atendimento (
      idAtendimento INTEGER PRIMARY KEY AUTOINCREMENT,
      idAgendamento INTEGER,
      idCliente INTEGER NOT NULL,
      idContato INTEGER,
      idUsuario INTEGER NOT NULL,
      assunto VARCHAR(150) NOT NULL,
      descricao TEXT,
      data DATETIME NOT NULL,
      horaInicio VARCHAR(5) NOT NULL,
      horaFim VARCHAR(5) NOT NULL,
      idCanalAtendimento INTEGER,
      idOrigemAtendimento INTEGER,
      status BOOLEAN NOT NULL DEFAULT 1,
      dataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idAgendamento) REFERENCES agendamento (idAgendamento),
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
      FOREIGN KEY (idContato) REFERENCES contato (idContato),
      FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
      FOREIGN KEY (idCanalAtendimento) REFERENCES canalAtendimento (idCanalAtendimento),
      FOREIGN KEY (idOrigemAtendimento) REFERENCES origemAtendimento (idOrigemAtendimento)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS orcamento (
      idOrcamento INTEGER PRIMARY KEY AUTOINCREMENT,
      idCliente INTEGER NOT NULL,
      idContato INTEGER,
      idUsuario INTEGER,
      idPedidoVinculado INTEGER,
      idVendedor INTEGER,
      comissao DECIMAL(7, 2) NOT NULL DEFAULT 0,
      idPrazoPagamento INTEGER,
      idEtapaOrcamento INTEGER,
      idMotivoPerda INTEGER,
      dataInclusao DATE,
      dataValidade DATE,
      dataFechamento DATE,
      observacao TEXT,
      dataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
      FOREIGN KEY (idContato) REFERENCES contato (idContato),
      FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
      FOREIGN KEY (idPedidoVinculado) REFERENCES pedido (idPedido),
      FOREIGN KEY (idVendedor) REFERENCES vendedor (idVendedor),
      FOREIGN KEY (idPrazoPagamento) REFERENCES prazoPagamento (idPrazoPagamento),
      FOREIGN KEY (idEtapaOrcamento) REFERENCES etapaOrcamento (idEtapaOrcamento),
      FOREIGN KEY (idMotivoPerda) REFERENCES motivoPerda (idMotivo)
    )
  `);

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN idUsuario INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idUsuario do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN idVendedor INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idVendedor do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN idPedidoVinculado INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idPedidoVinculado do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN comissao DECIMAL(7, 2) NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna comissao do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN idMotivoPerda INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idMotivoPerda do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN idEtapaOrcamento INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idEtapaOrcamento do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN dataInclusao DATE
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna dataInclusao do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN dataValidade DATE
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna dataValidade do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE orcamento ADD COLUMN dataFechamento DATE
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna dataFechamento do orcamento.', erro);
    }
  });

  banco.run(`
    UPDATE orcamento
    SET dataInclusao = COALESCE(dataInclusao, date(dataCriacao))
    WHERE dataInclusao IS NULL
  `, (erro) => {
    if (erro) {
      console.error('Nao foi possivel migrar a data de inclusao dos orcamentos.', erro);
    }
  });

  banco.run(`
    UPDATE orcamento
    SET dataFechamento = date('now')
    WHERE idEtapaOrcamento IN (${ID_ETAPA_ORCAMENTO_FECHAMENTO}, ${ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO}, ${ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO})
      AND (dataFechamento IS NULL OR TRIM(dataFechamento) = '')
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('no such column')) {
      console.error('Nao foi possivel migrar a data de fechamento dos orcamentos.', erro);
    }
  });

  banco.run(`
    UPDATE orcamento
    SET
      idVendedor = COALESCE(
        idVendedor,
        (
          SELECT cliente.idVendedor
          FROM cliente
          WHERE cliente.idCliente = orcamento.idCliente
        )
      ),
      comissao = COALESCE(
        NULLIF(comissao, ''),
        (
          SELECT vendedor.comissaoPadrao
          FROM vendedor
          INNER JOIN cliente ON cliente.idVendedor = vendedor.idVendedor
          WHERE cliente.idCliente = orcamento.idCliente
        ),
        0
      )
    WHERE idCliente IS NOT NULL
  `, (erro) => {
    if (erro) {
      console.error('Nao foi possivel migrar vendedor e comissao dos orcamentos.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS itemOrcamento (
      idItemOrcamento INTEGER PRIMARY KEY AUTOINCREMENT,
      idOrcamento INTEGER NOT NULL,
      idProduto INTEGER NOT NULL,
      quantidade DECIMAL(12, 3) NOT NULL,
      valorUnitario DECIMAL(12, 2) NOT NULL,
      valorTotal DECIMAL(12, 2) NOT NULL,
      imagem VARCHAR(255),
      observacao TEXT,
      referenciaProdutoSnapshot VARCHAR(120),
      descricaoProdutoSnapshot VARCHAR(255),
      unidadeProdutoSnapshot VARCHAR(60),
      FOREIGN KEY (idOrcamento) REFERENCES orcamento (idOrcamento) ON DELETE CASCADE,
      FOREIGN KEY (idProduto) REFERENCES produto (idProduto)
    )
  `);

  banco.run(`
    ALTER TABLE itemOrcamento ADD COLUMN imagem VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna imagem do item do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE itemOrcamento ADD COLUMN referenciaProdutoSnapshot VARCHAR(120)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna referenciaProdutoSnapshot do item do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE itemOrcamento ADD COLUMN descricaoProdutoSnapshot VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna descricaoProdutoSnapshot do item do orcamento.', erro);
    }
  });

  banco.run(`
    ALTER TABLE itemOrcamento ADD COLUMN unidadeProdutoSnapshot VARCHAR(60)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna unidadeProdutoSnapshot do item do orcamento.', erro);
    }
  });

  banco.run(`
    CREATE TABLE IF NOT EXISTS valorCampoOrcamento (
      idValorCampoOrcamento INTEGER PRIMARY KEY AUTOINCREMENT,
      idOrcamento INTEGER NOT NULL,
      idCampoOrcamento INTEGER NOT NULL,
      valor TEXT,
      FOREIGN KEY (idOrcamento) REFERENCES orcamento (idOrcamento) ON DELETE CASCADE,
      FOREIGN KEY (idCampoOrcamento) REFERENCES campoOrcamentoConfiguravel (idCampoOrcamento)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS pedido (
      idPedido INTEGER PRIMARY KEY AUTOINCREMENT,
      idOrcamento INTEGER,
      idCliente INTEGER NOT NULL,
      idContato INTEGER,
      idUsuario INTEGER NOT NULL,
      idVendedor INTEGER NOT NULL,
      comissao DECIMAL(7, 2) NOT NULL DEFAULT 0,
      valorComissao DECIMAL(12, 2) NOT NULL DEFAULT 0,
      idPrazoPagamento INTEGER,
      idTipoPedido INTEGER,
      idEtapaPedido INTEGER,
      idMotivoDevolucao INTEGER,
      dataInclusao DATE,
      dataEntrega DATE,
      dataValidade DATE,
      observacao TEXT,
      codigoOrcamentoOrigem INTEGER,
      nomeClienteSnapshot VARCHAR(255),
      nomeContatoSnapshot VARCHAR(255),
      nomeUsuarioSnapshot VARCHAR(150),
      nomeVendedorSnapshot VARCHAR(150),
      nomeMetodoPagamentoSnapshot VARCHAR(150),
      nomePrazoPagamentoSnapshot VARCHAR(255),
      nomeTipoPedidoSnapshot VARCHAR(150),
      nomeEtapaPedidoSnapshot VARCHAR(150),
      dataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idOrcamento) REFERENCES orcamento (idOrcamento),
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
      FOREIGN KEY (idContato) REFERENCES contato (idContato),
      FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
      FOREIGN KEY (idVendedor) REFERENCES vendedor (idVendedor),
      FOREIGN KEY (idPrazoPagamento) REFERENCES prazoPagamento (idPrazoPagamento),
      FOREIGN KEY (idTipoPedido) REFERENCES tipoPedido (idTipoPedido),
      FOREIGN KEY (idEtapaPedido) REFERENCES etapaPedido (idEtapaPedido),
      FOREIGN KEY (idMotivoDevolucao) REFERENCES motivoDevolucao (idMotivoDevolucao)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS itemPedido (
      idItemPedido INTEGER PRIMARY KEY AUTOINCREMENT,
      idPedido INTEGER NOT NULL,
      idProduto INTEGER,
      quantidade DECIMAL(12, 3) NOT NULL,
      valorUnitario DECIMAL(12, 2) NOT NULL,
      valorTotal DECIMAL(12, 2) NOT NULL,
      imagem VARCHAR(255),
      observacao TEXT,
      referenciaProdutoSnapshot VARCHAR(120),
      descricaoProdutoSnapshot VARCHAR(255),
      unidadeProdutoSnapshot VARCHAR(60),
      FOREIGN KEY (idPedido) REFERENCES pedido (idPedido) ON DELETE CASCADE,
      FOREIGN KEY (idProduto) REFERENCES produto (idProduto)
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS valorCampoPedido (
      idValorCampoPedido INTEGER PRIMARY KEY AUTOINCREMENT,
      idPedido INTEGER NOT NULL,
      idCampoOrcamento INTEGER,
      tituloSnapshot VARCHAR(150),
      valor TEXT,
      FOREIGN KEY (idPedido) REFERENCES pedido (idPedido) ON DELETE CASCADE,
      FOREIGN KEY (idCampoOrcamento) REFERENCES campoOrcamentoConfiguravel (idCampoOrcamento)
    )
  `);

  banco.run(`
    ALTER TABLE itemPedido ADD COLUMN imagem VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna imagem do item do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN dataEntrega DATE
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna dataEntrega do pedido.', erro);
    }
  });

  banco.run(`
    UPDATE pedido
    SET dataEntrega = COALESCE(dataEntrega, dataValidade)
    WHERE dataEntrega IS NULL
  `, (erro) => {
    if (erro) {
      console.error('Nao foi possivel migrar a data de entrega dos pedidos.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN idOrcamento INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idOrcamento do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN codigoOrcamentoOrigem INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna codigoOrcamentoOrigem do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomeClienteSnapshot VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomeClienteSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomeContatoSnapshot VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomeContatoSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomeUsuarioSnapshot VARCHAR(150)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomeUsuarioSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomeVendedorSnapshot VARCHAR(150)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomeVendedorSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomeMetodoPagamentoSnapshot VARCHAR(150)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomeMetodoPagamentoSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomePrazoPagamentoSnapshot VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomePrazoPagamentoSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN idTipoPedido INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idTipoPedido do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomeTipoPedidoSnapshot VARCHAR(150)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomeTipoPedidoSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN nomeEtapaPedidoSnapshot VARCHAR(150)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna nomeEtapaPedidoSnapshot do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN idMotivoDevolucao INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idMotivoDevolucao do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE pedido ADD COLUMN valorComissao DECIMAL(12, 2) NOT NULL DEFAULT 0
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna valorComissao do pedido.', erro);
    }
  });

  banco.run(`
    UPDATE pedido
    SET valorComissao = COALESCE(
      (
        SELECT ROUND(
          COALESCE(SUM(COALESCE(itemPedido.valorTotal, 0)), 0) * COALESCE(pedido.comissao, 0) / 100,
          2
        )
        FROM itemPedido
        WHERE itemPedido.idPedido = pedido.idPedido
      ),
      0
    )
  `, (erro) => {
    if (erro) {
      console.error('Nao foi possivel recalcular a coluna valorComissao dos pedidos.', erro);
    }
  });

  banco.run(`
    ALTER TABLE itemPedido ADD COLUMN referenciaProdutoSnapshot VARCHAR(120)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna referenciaProdutoSnapshot do item do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE itemPedido ADD COLUMN descricaoProdutoSnapshot VARCHAR(255)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna descricaoProdutoSnapshot do item do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE itemPedido ADD COLUMN unidadeProdutoSnapshot VARCHAR(60)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna unidadeProdutoSnapshot do item do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE valorCampoPedido ADD COLUMN tituloSnapshot VARCHAR(150)
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna tituloSnapshot do valor de campo do pedido.', erro);
    }
  });

  banco.run(`
    ALTER TABLE valorCampoPedido ADD COLUMN idCampoPedido INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idCampoPedido do valor de campo do pedido.', erro);
    }
  });

  banco.all(
    'PRAGMA table_info(atendimento)',
    (erro, colunasAtendimento) => {
      if (erro || !Array.isArray(colunasAtendimento) || colunasAtendimento.length === 0) {
        if (erro) {
          console.error('Nao foi possivel consultar a estrutura da tabela atendimento.', erro);
        }
        return;
      }

      const possuiIdUsuario = colunasAtendimento.some((coluna) => coluna.name === 'idUsuario');
      const possuiIdVendedor = colunasAtendimento.some((coluna) => coluna.name === 'idVendedor');

      if (possuiIdUsuario && !possuiIdVendedor) {
        return;
      }

      const expressaoIdUsuario = possuiIdUsuario
        ? `COALESCE(
            atendimento.idUsuario,
            (
              SELECT usuario.idUsuario
              FROM usuario
              WHERE usuario.idVendedor = atendimento.idVendedor
              ORDER BY usuario.idUsuario
              LIMIT 1
            ),
            1
          )`
        : `COALESCE(
            (
              SELECT usuario.idUsuario
              FROM usuario
              WHERE usuario.idVendedor = atendimento.idVendedor
              ORDER BY usuario.idUsuario
              LIMIT 1
            ),
            1
          )`;

      banco.serialize(() => {
        banco.run('PRAGMA foreign_keys = OFF');
        banco.run('DROP TABLE IF EXISTS atendimento_temp');
        banco.run(`
          CREATE TABLE atendimento_temp (
            idAtendimento INTEGER PRIMARY KEY AUTOINCREMENT,
            idAgendamento INTEGER,
            idCliente INTEGER NOT NULL,
            idContato INTEGER,
            idUsuario INTEGER NOT NULL,
            assunto VARCHAR(150) NOT NULL,
            descricao TEXT,
            data DATETIME NOT NULL,
            horaInicio VARCHAR(5) NOT NULL,
            horaFim VARCHAR(5) NOT NULL,
            idCanalAtendimento INTEGER,
            idOrigemAtendimento INTEGER,
            status BOOLEAN NOT NULL DEFAULT 1,
            dataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (idAgendamento) REFERENCES agendamento (idAgendamento),
            FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
            FOREIGN KEY (idContato) REFERENCES contato (idContato),
            FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario),
            FOREIGN KEY (idCanalAtendimento) REFERENCES canalAtendimento (idCanalAtendimento),
            FOREIGN KEY (idOrigemAtendimento) REFERENCES origemAtendimento (idOrigemAtendimento)
          )
        `);
        banco.run(`
          INSERT INTO atendimento_temp (
            idAtendimento,
            idAgendamento,
            idCliente,
            idContato,
            idUsuario,
            assunto,
            descricao,
            data,
            horaInicio,
            horaFim,
            idCanalAtendimento,
            idOrigemAtendimento,
            status,
            dataCriacao
          )
          SELECT
            atendimento.idAtendimento,
            NULL,
            atendimento.idCliente,
            atendimento.idContato,
            ${expressaoIdUsuario},
            atendimento.assunto,
            atendimento.descricao,
            atendimento.data,
            atendimento.horaInicio,
            atendimento.horaFim,
            atendimento.idCanalAtendimento,
            atendimento.idOrigemAtendimento,
            atendimento.status,
            atendimento.dataCriacao
          FROM atendimento
        `);
        banco.run('DROP TABLE atendimento');
        banco.run('ALTER TABLE atendimento_temp RENAME TO atendimento');
        banco.run('PRAGMA foreign_keys = ON');
      });
    }
  );

  banco.run(`
    ALTER TABLE atendimento ADD COLUMN idAgendamento INTEGER
  `, (erro) => {
    if (erro && !String(erro.message || '').includes('duplicate column name')) {
      console.error('Nao foi possivel garantir a coluna idAgendamento do atendimento.', erro);
    }
  });

  banco.run(`
    INSERT OR IGNORE INTO agendamentoStatusUsuario (idAgendamento, idUsuario, idStatusVisita)
    SELECT
      agendamentoUsuario.idAgendamento,
      agendamentoUsuario.idUsuario,
      COALESCE(agendamento.idStatusVisita, 1)
    FROM agendamentoUsuario
    INNER JOIN agendamento
      ON agendamento.idAgendamento = agendamentoUsuario.idAgendamento
    WHERE agendamentoUsuario.idUsuario IS NOT NULL
      AND COALESCE(agendamento.idStatusVisita, 0) > 0
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS produto (
      idProduto INTEGER PRIMARY KEY AUTOINCREMENT,
      referencia VARCHAR(100) NOT NULL,
      descricao VARCHAR(255) NOT NULL,
      idGrupo INTEGER NOT NULL,
      idMarca INTEGER NOT NULL,
      idUnidade INTEGER NOT NULL,
      preco DECIMAL(10,2) NOT NULL DEFAULT 0,
      imagem VARCHAR(255),
      status BOOLEAN NOT NULL DEFAULT 1,
      dataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idGrupo) REFERENCES grupoProduto (idGrupo),
      FOREIGN KEY (idMarca) REFERENCES marca (idMarca),
      FOREIGN KEY (idUnidade) REFERENCES unidadeMedida (idUnidade)
    )
  `);

  banco.get(
    'SELECT COUNT(*) AS total FROM statusVisita',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      const statusPadrao = [
        { idStatusVisita: ID_STATUS_VISITA_AGENDADO, descricao: 'Agendado', icone: '📅', ordem: 1 },
        { idStatusVisita: ID_STATUS_VISITA_CONFIRMADO, descricao: 'Confirmado', icone: '✅', ordem: 2 },
        { idStatusVisita: ID_STATUS_VISITA_REALIZADO, descricao: 'Realizado', icone: '🤝', ordem: 3 },
        { idStatusVisita: ID_STATUS_VISITA_CANCELADO, descricao: 'Cancelado', icone: '❌', ordem: 4 },
        { idStatusVisita: ID_STATUS_VISITA_NAO_COMPARECEU, descricao: 'Nao compareceu', icone: '⚠️', ordem: 5 }
      ];

      statusPadrao.forEach((status) => {
        banco.run(
          'INSERT INTO statusVisita (idStatusVisita, descricao, icone, ordem, status) VALUES (?, ?, ?, ?, ?)',
          [status.idStatusVisita, status.descricao, status.icone, status.ordem, 1]
        );
      });
    }
  );

  banco.get(
    'SELECT COUNT(*) AS total FROM tipoAgenda',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      const tiposAgendaPadrao = [
        { descricao: 'Visita', cor: '#BFE3D0', ordem: 1 },
        { descricao: 'Reuniao', cor: '#CFE5FF', ordem: 2 },
        { descricao: 'Ligacao', cor: '#FFE2A8', ordem: 3 },
        { descricao: 'Apresentacao', cor: '#D9EAF7', ordem: 4 }
      ];

      tiposAgendaPadrao.forEach((tipoAgenda) => {
        banco.run(
          'INSERT INTO tipoAgenda (descricao, cor, ordem, status) VALUES (?, ?, ?, ?)',
          [tipoAgenda.descricao, tipoAgenda.cor, tipoAgenda.ordem, 1]
        );
      });
    }
  );

  garantirRegistrosObrigatorios().catch((erro) => {
    console.error('Nao foi possivel garantir os registros obrigatorios de configuracao.', erro);
  });
});

async function garantirRegistrosObrigatorios() {
  await garantirConfiguracaoAtualizacaoSistemaPadrao();
  await removerColunaAbreviacaoDasEtapas();
  await removerColunaSiglaDosRecursos();
  await garantirPrazosPagamentoComDiasOpcionais();
  await garantirUsuarioAdministradorPadrao();
  await garantirTiposPedidoObrigatorios();
  await garantirEtapasPedidoObrigatorias();
  await garantirEtapasOrcamentoObrigatorias();
  await garantirStatusAgendaObrigatorios();
  await garantirTiposAgendaObrigatorios();
}

async function garantirConfiguracaoAtualizacaoSistemaPadrao() {
  const urlRepositorioPadrao = 'https://github.com/TailonSilva/connecta-crm';
  const existente = await consultarUm(
    'SELECT idConfiguracaoAtualizacao FROM configuracaoAtualizacaoSistema WHERE idConfiguracaoAtualizacao = 1'
  );

  if (!existente) {
    await executar(
      `
        INSERT INTO configuracaoAtualizacaoSistema (
          idConfiguracaoAtualizacao,
          urlRepositorio
        ) VALUES (?, ?)
      `,
      [1, urlRepositorioPadrao]
    );
    return;
  }

  await executar(
    `
      UPDATE configuracaoAtualizacaoSistema
      SET urlRepositorio = COALESCE(NULLIF(urlRepositorio, ''), ?)
      WHERE idConfiguracaoAtualizacao = 1
    `,
    [urlRepositorioPadrao]
  );
}

async function garantirUsuarioAdministradorPadrao() {
  const usuarioAdministrador = {
    nome: 'Administrador',
    usuario: 'admin',
    senha: 'admin@123',
    tipo: 'Administrador',
    ativo: 1
  };

  const existente = await consultarUm(
    'SELECT idUsuario FROM usuario WHERE LOWER(TRIM(usuario)) = LOWER(TRIM(?))',
    [usuarioAdministrador.usuario]
  );

  if (!existente) {
    await executar(
      'INSERT INTO usuario (nome, usuario, senha, tipo, ativo) VALUES (?, ?, ?, ?, ?)',
      [
        usuarioAdministrador.nome,
        usuarioAdministrador.usuario,
        usuarioAdministrador.senha,
        usuarioAdministrador.tipo,
        usuarioAdministrador.ativo
      ]
    );
    return;
  }

  await executar(
    'UPDATE usuario SET nome = ?, senha = ?, tipo = ?, ativo = 1 WHERE idUsuario = ?',
    [
      usuarioAdministrador.nome,
      usuarioAdministrador.senha,
      usuarioAdministrador.tipo,
      existente.idUsuario
    ]
  );
}

async function garantirEtapasOrcamentoObrigatorias() {
  const etapasObrigatorias = [
    { idEtapaOrcamento: ID_ETAPA_ORCAMENTO_FECHAMENTO, descricao: 'Fechado', cor: '#A7E1B8', obrigarMotivoPerda: 0, consideraFunilVendas: 1, ordem: 1, status: 1 },
    { idEtapaOrcamento: ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO, descricao: 'Fechado sem pedido', cor: '#FDE68A', obrigarMotivoPerda: 0, consideraFunilVendas: 1, ordem: 2, status: 1 },
    { idEtapaOrcamento: ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO, descricao: 'Pedido Excluido', cor: '#E5E7EB', obrigarMotivoPerda: 0, consideraFunilVendas: 0, ordem: 3, status: 1 },
    { idEtapaOrcamento: ID_ETAPA_ORCAMENTO_RECUSADO, descricao: 'Recusado', cor: '#E5E7EB', obrigarMotivoPerda: 1, consideraFunilVendas: 0, ordem: 4, status: 1 }
  ];

  await executar(
    `UPDATE etapaOrcamento
    SET descricao = 'Pedido Excluido', cor = '#E5E7EB', obrigarMotivoPerda = 0, consideraFunilVendas = 0, ordem = 3, status = 1
    WHERE idEtapaOrcamento = ?`,
    [ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO]
  );

  const etapaRecusadoPorDescricao = await consultarUm(
    `SELECT idEtapaOrcamento
    FROM etapaOrcamento
    WHERE LOWER(TRIM(descricao)) = 'recusado'
    ORDER BY CASE WHEN idEtapaOrcamento = ? THEN 0 ELSE 1 END, idEtapaOrcamento
    LIMIT 1`,
    [ID_ETAPA_ORCAMENTO_RECUSADO]
  );

  if (etapaRecusadoPorDescricao && Number(etapaRecusadoPorDescricao.idEtapaOrcamento) !== ID_ETAPA_ORCAMENTO_RECUSADO) {
    await executar(
      'UPDATE orcamento SET idEtapaOrcamento = ? WHERE idEtapaOrcamento = ?',
      [ID_ETAPA_ORCAMENTO_RECUSADO, Number(etapaRecusadoPorDescricao.idEtapaOrcamento)]
    );

    await executar(
      `UPDATE etapaOrcamento
      SET descricao = 'Recusado (legado)', status = 0, obrigarMotivoPerda = 0, consideraFunilVendas = 0
      WHERE idEtapaOrcamento = ?`,
      [Number(etapaRecusadoPorDescricao.idEtapaOrcamento)]
    );
  }

  for (const etapa of etapasObrigatorias) {
    const existente = await consultarUm(
      'SELECT idEtapaOrcamento FROM etapaOrcamento WHERE idEtapaOrcamento = ?',
      [etapa.idEtapaOrcamento]
    );

    if (!existente) {
      await executar(
        'INSERT INTO etapaOrcamento (idEtapaOrcamento, descricao, cor, obrigarMotivoPerda, consideraFunilVendas, ordem, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [etapa.idEtapaOrcamento, etapa.descricao, etapa.cor, etapa.obrigarMotivoPerda, etapa.consideraFunilVendas, etapa.ordem, etapa.status]
      );
      continue;
    }

    await executar(
      'UPDATE etapaOrcamento SET descricao = ?, cor = ?, status = ?, obrigarMotivoPerda = ?, consideraFunilVendas = ?, ordem = ? WHERE idEtapaOrcamento = ?',
      [etapa.descricao, etapa.cor, etapa.status, etapa.obrigarMotivoPerda, etapa.consideraFunilVendas, etapa.ordem, etapa.idEtapaOrcamento]
    );
  }

  const etapasCancelamentoLegadas = await consultarTodos(
    `SELECT idEtapaOrcamento
    FROM etapaOrcamento
    WHERE idEtapaOrcamento NOT IN (?, ?)
      AND LOWER(TRIM(descricao)) IN ('recusado', 'pedido excluido')`,
    [ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO, ID_ETAPA_ORCAMENTO_RECUSADO]
  );

  const idsEtapasLegadas = etapasCancelamentoLegadas
    .map((etapa) => Number(etapa.idEtapaOrcamento || 0))
    .filter((idEtapa) => Number.isFinite(idEtapa) && idEtapa > 0);

  if (idsEtapasLegadas.length > 0) {
    const marcadores = idsEtapasLegadas.map(() => '?').join(', ');

    await executar(
      `UPDATE orcamento
      SET idEtapaOrcamento = ?
      WHERE idEtapaOrcamento IN (${marcadores})`,
      [ID_ETAPA_ORCAMENTO_RECUSADO, ...idsEtapasLegadas]
    );

    await executar(
      `UPDATE etapaOrcamento
      SET descricao = 'Etapa de cancelamento legada', status = 0, obrigarMotivoPerda = 0, consideraFunilVendas = 0
      WHERE idEtapaOrcamento IN (${marcadores})`,
      idsEtapasLegadas
    );
  }

  await executar(
    'UPDATE orcamento SET idEtapaOrcamento = ? WHERE idPedidoVinculado IS NULL AND idEtapaOrcamento = ?',
    [ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO, ID_ETAPA_ORCAMENTO_FECHAMENTO]
  );
}

async function garantirEtapasPedidoObrigatorias() {
  const etapaObrigatoria = {
    idEtapa: ID_ETAPA_PEDIDO_ENTREGUE,
    descricao: 'Entregue',
    cor: '#A7E1B8',
    ordem: 5,
    status: 1
  };

  const existente = await consultarUm(
    'SELECT idEtapa FROM etapaPedido WHERE idEtapa = ?',
    [etapaObrigatoria.idEtapa]
  );

  if (!existente) {
    await executar(
      'INSERT INTO etapaPedido (idEtapa, descricao, cor, ordem, status) VALUES (?, ?, ?, ?, ?)',
      [
        etapaObrigatoria.idEtapa,
        etapaObrigatoria.descricao,
        etapaObrigatoria.cor,
        etapaObrigatoria.ordem,
        etapaObrigatoria.status
      ]
    );
    return;
  }

  await executar(
    'UPDATE etapaPedido SET status = 1, cor = COALESCE(cor, ?), ordem = CASE WHEN ordem IS NULL OR ordem <= 0 THEN ? ELSE ordem END WHERE idEtapa = ?',
    [etapaObrigatoria.cor, etapaObrigatoria.ordem, etapaObrigatoria.idEtapa]
  );
}

async function garantirTiposPedidoObrigatorios() {
  const tiposObrigatorios = [
    { idTipoPedido: ID_TIPO_PEDIDO_VENDA, descricao: 'Venda', status: 1 },
    { idTipoPedido: ID_TIPO_PEDIDO_DEVOLUCAO, descricao: 'Devolucao', status: 1 }
  ];

  for (const tipoPedido of tiposObrigatorios) {
    const existente = await consultarUm(
      'SELECT idTipoPedido FROM tipoPedido WHERE idTipoPedido = ?',
      [tipoPedido.idTipoPedido]
    );

    if (!existente) {
      await executar(
        'INSERT INTO tipoPedido (idTipoPedido, descricao, status) VALUES (?, ?, ?)',
        [tipoPedido.idTipoPedido, tipoPedido.descricao, tipoPedido.status]
      );
      continue;
    }

    await executar(
      'UPDATE tipoPedido SET descricao = ?, status = ? WHERE idTipoPedido = ?',
      [tipoPedido.descricao, tipoPedido.status, tipoPedido.idTipoPedido]
    );
  }
}

async function removerColunaAbreviacaoDasEtapas() {
  await migrarTabelaSemAbreviacao(
    'etapaPedido',
    'idEtapa',
    [
      'idEtapa INTEGER PRIMARY KEY AUTOINCREMENT',
      'descricao VARCHAR(150) NOT NULL',
      "cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1'",
      'ordem INTEGER NOT NULL DEFAULT 0',
      'status BOOLEAN NOT NULL DEFAULT 1'
    ],
    ['idEtapa', 'descricao', 'cor', 'ordem', 'status'],
    'idEtapa, descricao, COALESCE(cor, "#0B74D1") AS cor, COALESCE(ordem, idEtapa) AS ordem, COALESCE(status, 1) AS status'
  );

  await migrarTabelaSemAbreviacao(
    'etapaOrcamento',
    'idEtapaOrcamento',
    [
      'idEtapaOrcamento INTEGER PRIMARY KEY AUTOINCREMENT',
      'descricao VARCHAR(150) NOT NULL',
      "cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1'",
      'obrigarMotivoPerda BOOLEAN NOT NULL DEFAULT 0',
      'consideraFunilVendas BOOLEAN NOT NULL DEFAULT 1',
      'ordem INTEGER NOT NULL DEFAULT 0',
      'status BOOLEAN NOT NULL DEFAULT 1'
    ],
    ['idEtapaOrcamento', 'descricao', 'cor', 'obrigarMotivoPerda', 'consideraFunilVendas', 'ordem', 'status'],
    'idEtapaOrcamento, descricao, COALESCE(cor, "#0B74D1") AS cor, COALESCE(obrigarMotivoPerda, 0) AS obrigarMotivoPerda, COALESCE(consideraFunilVendas, 1) AS consideraFunilVendas, COALESCE(ordem, idEtapaOrcamento) AS ordem, COALESCE(status, 1) AS status'
  );
}

async function migrarTabelaSemAbreviacao(nomeTabela, chavePrimaria, declaracoesColunas, colunasDestino, selecaoColunas) {
  const colunas = await consultarTodos(`PRAGMA table_info(${nomeTabela})`);
  const possuiAbreviacao = colunas.some((coluna) => coluna.name === 'abreviacao');

  if (!possuiAbreviacao) {
    return;
  }

  const nomeTabelaNova = `${nomeTabela}_semAbreviacao`;

  await executar('PRAGMA foreign_keys = OFF');

  try {
    await executar('BEGIN TRANSACTION');
    await executar(`CREATE TABLE ${nomeTabelaNova} (${declaracoesColunas.join(', ')})`);
    await executar(
      `INSERT INTO ${nomeTabelaNova} (${colunasDestino.join(', ')}) SELECT ${selecaoColunas} FROM ${nomeTabela}`
    );
    await executar(`DROP TABLE ${nomeTabela}`);
    await executar(`ALTER TABLE ${nomeTabelaNova} RENAME TO ${nomeTabela}`);
    await executar('COMMIT');
  } catch (erro) {
    await executar('ROLLBACK');
    throw erro;
  } finally {
    await executar('PRAGMA foreign_keys = ON');
  }

  await executar(
    `UPDATE ${nomeTabela} SET ordem = ${chavePrimaria} WHERE ordem IS NULL OR ordem <= 0`
  );
}

async function garantirPrazosPagamentoComDiasOpcionais() {
  const colunas = await consultarTodos('PRAGMA table_info(prazoPagamento)');
  const colunaPrazo1 = colunas.find((coluna) => coluna.name === 'prazo1');

  if (!colunaPrazo1 || Number(colunaPrazo1.notnull) === 0) {
    return;
  }

  await executar('PRAGMA foreign_keys = OFF');

  try {
    await executar('BEGIN TRANSACTION');
    await executar(`
      CREATE TABLE prazoPagamento_diasOpcionais (
        idPrazoPagamento INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao VARCHAR(150),
        idMetodoPagamento INTEGER NOT NULL,
        prazo1 INTEGER,
        prazo2 INTEGER,
        prazo3 INTEGER,
        prazo4 INTEGER,
        prazo5 INTEGER,
        prazo6 INTEGER,
        status BOOLEAN NOT NULL DEFAULT 1,
        FOREIGN KEY (idMetodoPagamento) REFERENCES metodoPagamento (idMetodoPagamento)
      )
    `);
    await executar(`
      INSERT INTO prazoPagamento_diasOpcionais (
        idPrazoPagamento,
        descricao,
        idMetodoPagamento,
        prazo1,
        prazo2,
        prazo3,
        prazo4,
        prazo5,
        prazo6,
        status
      )
      SELECT
        idPrazoPagamento,
        descricao,
        idMetodoPagamento,
        prazo1,
        prazo2,
        prazo3,
        prazo4,
        prazo5,
        prazo6,
        COALESCE(status, 1)
      FROM prazoPagamento
    `);
    await executar('DROP TABLE prazoPagamento');
    await executar('ALTER TABLE prazoPagamento_diasOpcionais RENAME TO prazoPagamento');
    await executar('COMMIT');
  } catch (erro) {
    await executar('ROLLBACK');
    throw erro;
  } finally {
    await executar('PRAGMA foreign_keys = ON');
  }
}

async function removerColunaSiglaDosRecursos() {
  const colunas = await consultarTodos('PRAGMA table_info(recurso)');
  const possuiSigla = colunas.some((coluna) => coluna.name === 'sigla');

  if (!possuiSigla) {
    return;
  }

  const nomeTabelaNova = 'recurso_semSigla';

  await executar('PRAGMA foreign_keys = OFF');

  try {
    await executar('BEGIN TRANSACTION');
    await executar(`
      CREATE TABLE ${nomeTabelaNova} (
        idRecurso INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao VARCHAR(150) NOT NULL,
        idTipoRecurso INTEGER NOT NULL,
        status BOOLEAN NOT NULL DEFAULT 1,
        FOREIGN KEY (idTipoRecurso) REFERENCES tipoRecurso (idTipoRecurso)
      )
    `);
    await executar(`
      INSERT INTO ${nomeTabelaNova} (idRecurso, descricao, idTipoRecurso, status)
      SELECT idRecurso, descricao, idTipoRecurso, COALESCE(status, 1)
      FROM recurso
    `);
    await executar('DROP TABLE recurso');
    await executar(`ALTER TABLE ${nomeTabelaNova} RENAME TO recurso`);
    await executar('COMMIT');
  } catch (erro) {
    await executar('ROLLBACK');
    throw erro;
  } finally {
    await executar('PRAGMA foreign_keys = ON');
  }
}

async function garantirStatusAgendaObrigatorios() {
  const statusObrigatorios = [
    { idStatusVisita: ID_STATUS_VISITA_AGENDADO, descricao: 'Agendado', icone: '📅', ordem: 1, status: 1 },
    { idStatusVisita: ID_STATUS_VISITA_CONFIRMADO, descricao: 'Confirmado', icone: '✅', ordem: 2, status: 1 },
    { idStatusVisita: ID_STATUS_VISITA_REALIZADO, descricao: 'Realizado', icone: '🤝', ordem: 3, status: 1 },
    { idStatusVisita: ID_STATUS_VISITA_CANCELADO, descricao: 'Cancelado', icone: '❌', ordem: 4, status: 1 },
    { idStatusVisita: ID_STATUS_VISITA_NAO_COMPARECEU, descricao: 'Nao compareceu', icone: '⚠️', ordem: 5, status: 1 }
  ];

  for (const statusVisita of statusObrigatorios) {
    const existente = await consultarUm(
      'SELECT idStatusVisita FROM statusVisita WHERE idStatusVisita = ?',
      [statusVisita.idStatusVisita]
    );

    if (!existente) {
      await executar(
        'INSERT INTO statusVisita (idStatusVisita, descricao, icone, ordem, status) VALUES (?, ?, ?, ?, ?)',
        [statusVisita.idStatusVisita, statusVisita.descricao, statusVisita.icone, statusVisita.ordem, statusVisita.status]
      );
      continue;
    }

    await executar(
      'UPDATE statusVisita SET descricao = ?, icone = ?, ordem = COALESCE(ordem, ?), status = ? WHERE idStatusVisita = ?',
      [statusVisita.descricao, statusVisita.icone, statusVisita.ordem, statusVisita.status, statusVisita.idStatusVisita]
    );
  }
}

async function garantirLocaisAgendaObrigatorios() {
  const locais = ['Escritorio', 'Cliente', 'Online'];

  for (const descricao of locais) {
    const existente = await consultarUm(
      'SELECT idLocal FROM localAgenda WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
      [descricao]
    );

    if (!existente) {
      await executar(
        'INSERT INTO localAgenda (descricao, status) VALUES (?, ?)',
        [descricao, 1]
      );
      continue;
    }

    await executar('UPDATE localAgenda SET status = 1 WHERE idLocal = ?', [existente.idLocal]);
  }
}

async function garantirTiposRecursoObrigatorios() {
  const tipos = ['Sala', 'Veiculo', 'Equipamento'];

  for (const descricao of tipos) {
    const existente = await consultarUm(
      'SELECT idTipoRecurso FROM tipoRecurso WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
      [descricao]
    );

    if (!existente) {
      await executar(
        'INSERT INTO tipoRecurso (descricao, status) VALUES (?, ?)',
        [descricao, 1]
      );
      continue;
    }

    await executar('UPDATE tipoRecurso SET status = 1 WHERE idTipoRecurso = ?', [existente.idTipoRecurso]);
  }
}

async function garantirRecursosObrigatorios() {
  const tipoSala = await consultarUm(
    'SELECT idTipoRecurso FROM tipoRecurso WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
    ['Sala']
  );
  const tipoVeiculo = await consultarUm(
    'SELECT idTipoRecurso FROM tipoRecurso WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
    ['Veiculo']
  );
  const tipoEquipamento = await consultarUm(
    'SELECT idTipoRecurso FROM tipoRecurso WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
    ['Equipamento']
  );

  const recursos = [
    { descricao: 'Sala de reuniao 1', idTipoRecurso: tipoSala?.idTipoRecurso },
    { descricao: 'Carro da empresa', idTipoRecurso: tipoVeiculo?.idTipoRecurso },
    { descricao: 'Notebook comercial', idTipoRecurso: tipoEquipamento?.idTipoRecurso }
  ].filter((recurso) => recurso.idTipoRecurso);

  for (const recurso of recursos) {
    const existente = await consultarUm(
      'SELECT idRecurso FROM recurso WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?)) AND idTipoRecurso = ?',
      [recurso.descricao, recurso.idTipoRecurso]
    );

    if (!existente) {
      await executar(
        'INSERT INTO recurso (descricao, idTipoRecurso, status) VALUES (?, ?, ?)',
        [recurso.descricao, recurso.idTipoRecurso, 1]
      );
      continue;
    }

    await executar(
      'UPDATE recurso SET descricao = ?, idTipoRecurso = ?, status = 1 WHERE idRecurso = ?',
      [recurso.descricao, recurso.idTipoRecurso, existente.idRecurso]
    );
  }
}

async function garantirTiposAgendaObrigatorios() {
  const tipos = [
    { descricao: 'Visita', cor: '#BFE3D0', ordem: 1, status: 1 },
    { descricao: 'Reuniao', cor: '#CFE5FF', ordem: 2, status: 1 },
    { descricao: 'Ligacao', cor: '#FFE2A8', ordem: 3, status: 1 },
    { descricao: 'Apresentacao', cor: '#D9EAF7', ordem: 4, status: 1 }
  ];

  for (const tipo of tipos) {
    const existente = await consultarUm(
      'SELECT idTipoAgenda FROM tipoAgenda WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
      [tipo.descricao]
    );

    if (!existente) {
      await executar(
        'INSERT INTO tipoAgenda (descricao, cor, ordem, status) VALUES (?, ?, ?, ?)',
        [tipo.descricao, tipo.cor, tipo.ordem, tipo.status]
      );
      continue;
    }

    await executar(
      'UPDATE tipoAgenda SET cor = ?, ordem = COALESCE(ordem, ?), status = ? WHERE idTipoAgenda = ?',
      [tipo.cor, tipo.ordem, tipo.status, existente.idTipoAgenda]
    );
  }
}

async function garantirCanaisAtendimentoObrigatorios() {
  const canais = ['Telefone', 'WhatsApp', 'E-mail', 'Presencial'];

  for (const descricao of canais) {
    const existente = await consultarUm(
      'SELECT idCanalAtendimento FROM canalAtendimento WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
      [descricao]
    );

    if (!existente) {
      await executar(
        'INSERT INTO canalAtendimento (descricao, status) VALUES (?, ?)',
        [descricao, 1]
      );
      continue;
    }

    await executar('UPDATE canalAtendimento SET status = 1 WHERE idCanalAtendimento = ?', [existente.idCanalAtendimento]);
  }
}

async function garantirOrigensAtendimentoObrigatorias() {
  const origens = ['Cliente', 'Empresa'];

  for (const descricao of origens) {
    const existente = await consultarUm(
      'SELECT idOrigemAtendimento FROM origemAtendimento WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
      [descricao]
    );

    if (!existente) {
      await executar(
        'INSERT INTO origemAtendimento (descricao, status) VALUES (?, ?)',
        [descricao, 1]
      );
      continue;
    }

    await executar('UPDATE origemAtendimento SET status = 1 WHERE idOrigemAtendimento = ?', [existente.idOrigemAtendimento]);
  }
}

async function garantirMetodosPagamentoObrigatorios() {
  const metodos = ['Pix', 'Boleto', 'Dinheiro', 'Cartao de credito'];

  for (const descricao of metodos) {
    const existente = await consultarUm(
      'SELECT idMetodoPagamento FROM metodoPagamento WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
      [descricao]
    );

    if (!existente) {
      await executar(
        'INSERT INTO metodoPagamento (descricao, status) VALUES (?, ?)',
        [descricao, 1]
      );
      continue;
    }

    await executar('UPDATE metodoPagamento SET status = 1 WHERE idMetodoPagamento = ?', [existente.idMetodoPagamento]);
  }
}

async function garantirPrazosPagamentoObrigatorios() {
  const metodoPix = await consultarUm(
    'SELECT idMetodoPagamento FROM metodoPagamento WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
    ['Pix']
  );
  const metodoBoleto = await consultarUm(
    'SELECT idMetodoPagamento FROM metodoPagamento WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))',
    ['Boleto']
  );

  const prazos = [
    {
      descricao: 'Pix - 0 dias',
      idMetodoPagamento: metodoPix?.idMetodoPagamento,
      prazo1: 0, prazo2: null, prazo3: null, prazo4: null, prazo5: null, prazo6: null
    },
    {
      descricao: 'Boleto - 28 dias',
      idMetodoPagamento: metodoBoleto?.idMetodoPagamento,
      prazo1: 28, prazo2: null, prazo3: null, prazo4: null, prazo5: null, prazo6: null
    },
    {
      descricao: 'Boleto - 28/56 dias',
      idMetodoPagamento: metodoBoleto?.idMetodoPagamento,
      prazo1: 28, prazo2: 56, prazo3: null, prazo4: null, prazo5: null, prazo6: null
    }
  ].filter((prazo) => prazo.idMetodoPagamento);

  for (const prazo of prazos) {
    const existente = await consultarUm(
      'SELECT idPrazoPagamento FROM prazoPagamento WHERE idMetodoPagamento = ? AND COALESCE(prazo1, -1) = ? AND COALESCE(prazo2, -1) = ? AND COALESCE(prazo3, -1) = ? AND COALESCE(prazo4, -1) = ? AND COALESCE(prazo5, -1) = ? AND COALESCE(prazo6, -1) = ?',
      [
        prazo.idMetodoPagamento,
        prazo.prazo1 ?? -1,
        prazo.prazo2 ?? -1,
        prazo.prazo3 ?? -1,
        prazo.prazo4 ?? -1,
        prazo.prazo5 ?? -1,
        prazo.prazo6 ?? -1
      ]
    );

    if (!existente) {
      await executar(
        'INSERT INTO prazoPagamento (descricao, idMetodoPagamento, prazo1, prazo2, prazo3, prazo4, prazo5, prazo6, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          prazo.descricao,
          prazo.idMetodoPagamento,
          prazo.prazo1,
          prazo.prazo2,
          prazo.prazo3,
          prazo.prazo4,
          prazo.prazo5,
          prazo.prazo6,
          1
        ]
      );
      continue;
    }

    await executar('UPDATE prazoPagamento SET status = 1, descricao = ? WHERE idPrazoPagamento = ?', [prazo.descricao, existente.idPrazoPagamento]);
  }
}

async function garantirCamposPedidoObrigatorios() {
  const campos = [
    {
      titulo: 'Pagamento',
      descricaoPadrao: 'Descreva aqui as condicoes de pagamento padrao do pedido.'
    },
    {
      titulo: 'Entrega',
      descricaoPadrao: 'Descreva aqui as condicoes de entrega, conferencia e recebimento do pedido.'
    }
  ];

  for (const campo of campos) {
    const existente = await consultarUm(
      'SELECT idCampoPedido FROM campoPedidoConfiguravel WHERE LOWER(TRIM(titulo)) = LOWER(TRIM(?))',
      [campo.titulo]
    );

    if (!existente) {
      await executar(
        'INSERT INTO campoPedidoConfiguravel (titulo, descricaoPadrao, status) VALUES (?, ?, ?)',
        [campo.titulo, campo.descricaoPadrao, 1]
      );
      continue;
    }

    await executar(
      'UPDATE campoPedidoConfiguravel SET descricaoPadrao = COALESCE(NULLIF(descricaoPadrao, \'\'), ?), status = 1 WHERE idCampoPedido = ?',
      [campo.descricaoPadrao, existente.idCampoPedido]
    );
  }
}

function consultarTodos(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    banco.all(sql, parametros, (erro, linhas) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(linhas);
    });
  });
}

function consultarUm(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    banco.get(sql, parametros, (erro, linha) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(linha || null);
    });
  });
}

function executar(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    banco.run(sql, parametros, function aoExecutar(erro) {
      if (erro) {
        reject(erro);
        return;
      }

      resolve({ id: this.lastID, alteracoes: this.changes });
    });
  });
}

module.exports = {
  banco,
  caminhoBanco,
  ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO,
  ID_ETAPA_ORCAMENTO_RECUSADO,
  ID_ETAPA_PEDIDO_ENTREGUE,
  ID_TIPO_PEDIDO_VENDA,
  ID_TIPO_PEDIDO_DEVOLUCAO,
  consultarUm,
  consultarTodos,
  executar
};
