const path = require('node:path');
const fs = require('node:fs');
const sqlite3 = require('sqlite3').verbose();

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
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS grupoProduto (
      idGrupo INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150) NOT NULL,
      status BOOLEAN NOT NULL DEFAULT 1
    )
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
      sigla VARCHAR(20) NOT NULL,
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
    CREATE TABLE IF NOT EXISTS prazoPagamento (
      idPrazoPagamento INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao VARCHAR(150),
      idMetodoPagamento INTEGER NOT NULL,
      prazo1 INTEGER NOT NULL,
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
    CREATE TABLE IF NOT EXISTS etapaPedido (
      idEtapa INTEGER PRIMARY KEY AUTOINCREMENT,
      abreviacao VARCHAR(20) NOT NULL,
      descricao VARCHAR(150) NOT NULL,
      cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1',
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
    CREATE TABLE IF NOT EXISTS etapaOrcamento (
      idEtapaOrcamento INTEGER PRIMARY KEY AUTOINCREMENT,
      abreviacao VARCHAR(20) NOT NULL,
      descricao VARCHAR(150) NOT NULL,
      cor VARCHAR(20) NOT NULL DEFAULT '#0B74D1',
      status BOOLEAN NOT NULL DEFAULT 1
    )
  `);

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
      FOREIGN KEY (idRamo) REFERENCES ramoAtividade (idRamo)
    )
  `);

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
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente)
    )
  `);

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
    'SELECT COUNT(*) AS total FROM etapaOrcamento',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      const etapasPadrao = [
        { abreviacao: 'LEA', descricao: 'Lead recebido', cor: '#D9EAF7' },
        { abreviacao: 'CON', descricao: 'Contato inicial', cor: '#CFE5FF' },
        { abreviacao: 'QUA', descricao: 'Qualificacao', cor: '#BFE3D0' },
        { abreviacao: 'APR', descricao: 'Apresentacao da proposta', cor: '#FFE2A8' },
        { abreviacao: 'NEG', descricao: 'Negociacao', cor: '#FFC98F' },
        { abreviacao: 'FEC', descricao: 'Fechamento', cor: '#A7E1B8' }
      ];

      etapasPadrao.forEach((etapa) => {
        banco.run(
          `
            INSERT INTO etapaOrcamento (
              abreviacao,
              descricao,
              cor,
              status
            ) VALUES (?, ?, ?, ?)
          `,
          [etapa.abreviacao, etapa.descricao, etapa.cor, 1]
        );
      });
    }
  );

  banco.get(
    'SELECT COUNT(*) AS total FROM localAgenda',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      ['Escritorio', 'Cliente', 'Online'].forEach((descricao) => {
        banco.run(
          'INSERT INTO localAgenda (descricao, status) VALUES (?, ?)',
          [descricao, 1]
        );
      });
    }
  );

  banco.get(
    'SELECT COUNT(*) AS total FROM tipoRecurso',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      ['Sala', 'Veiculo', 'Equipamento'].forEach((descricao) => {
        banco.run(
          'INSERT INTO tipoRecurso (descricao, status) VALUES (?, ?)',
          [descricao, 1]
        );
      });
    }
  );

  banco.get(
    'SELECT COUNT(*) AS total FROM recurso',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      const recursosPadrao = [
        { sigla: 'SL1', descricao: 'Sala de reuniao 1', idTipoRecurso: 1 },
        { sigla: 'CAR', descricao: 'Carro da empresa', idTipoRecurso: 2 },
        { sigla: 'NOT', descricao: 'Notebook comercial', idTipoRecurso: 3 }
      ];

      recursosPadrao.forEach((recursoPadrao) => {
        banco.run(
          `
            INSERT INTO recurso (
              sigla,
              descricao,
              idTipoRecurso,
              status
            ) VALUES (?, ?, ?, ?)
          `,
          [
            recursoPadrao.sigla,
            recursoPadrao.descricao,
            recursoPadrao.idTipoRecurso,
            1
          ]
        );
      });
    }
  );

  banco.get(
    'SELECT COUNT(*) AS total FROM statusVisita',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      const statusPadrao = [
        { descricao: 'Agendado', icone: '📅' },
        { descricao: 'Confirmado', icone: '✅' },
        { descricao: 'Realizado', icone: '🤝' },
        { descricao: 'Cancelado', icone: '❌' },
        { descricao: 'Nao compareceu', icone: '⚠️' }
      ];

      statusPadrao.forEach((status) => {
        banco.run(
          'INSERT INTO statusVisita (descricao, icone, status) VALUES (?, ?, ?)',
          [status.descricao, status.icone, 1]
        );
      });
    }
  );

  banco.get(
    'SELECT COUNT(*) AS total FROM canalAtendimento',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      ['Telefone', 'WhatsApp', 'E-mail', 'Presencial'].forEach((descricao) => {
        banco.run(
          'INSERT INTO canalAtendimento (descricao, status) VALUES (?, ?)',
          [descricao, 1]
        );
      });
    }
  );

  banco.get(
    'SELECT COUNT(*) AS total FROM origemAtendimento',
    (_erroConsulta, resultado) => {
      if ((resultado?.total || 0) > 0) {
        return;
      }

      ['Cliente', 'Empresa'].forEach((descricao) => {
        banco.run(
          'INSERT INTO origemAtendimento (descricao, status) VALUES (?, ?)',
          [descricao, 1]
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
        { descricao: 'Visita', cor: '#BFE3D0' },
        { descricao: 'Reuniao', cor: '#CFE5FF' },
        { descricao: 'Ligacao', cor: '#FFE2A8' },
        { descricao: 'Apresentacao', cor: '#D9EAF7' }
      ];

      tiposAgendaPadrao.forEach((tipoAgenda) => {
        banco.run(
          'INSERT INTO tipoAgenda (descricao, cor, status) VALUES (?, ?, ?)',
          [tipoAgenda.descricao, tipoAgenda.cor, 1]
        );
      });
    }
  );
});

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
  consultarUm,
  consultarTodos,
  executar
};
