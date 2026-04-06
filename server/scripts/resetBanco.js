const { banco, executar, consultarTodos, caminhoBanco } = require('../configuracoes/banco');

const IDS_ETAPAS_ORCAMENTO_OBRIGATORIAS = [1, 2, 3, 4];
const ID_ETAPA_PEDIDO_ENTREGUE = 5;
const STATUS_VISITA_OBRIGATORIOS = ['agendado', 'confirmado', 'realizado', 'cancelado', 'nao compareceu'];
const TIPOS_AGENDA_OBRIGATORIOS = ['visita', 'reuniao', 'ligacao', 'apresentacao'];

const estrategiasPreservacao = {
  usuario: async () => {
    await executar("DELETE FROM usuario WHERE LOWER(TRIM(usuario)) <> 'admin'");
  },
  configuracaoAtualizacaoSistema: async () => {
    await executar('DELETE FROM configuracaoAtualizacaoSistema WHERE idConfiguracaoAtualizacao <> 1');
  },
  statusVisita: async () => {
    const marcadores = STATUS_VISITA_OBRIGATORIOS.map(() => '?').join(', ');
    await executar(
      `DELETE FROM statusVisita
      WHERE LOWER(TRIM(descricao)) NOT IN (${marcadores})`,
      STATUS_VISITA_OBRIGATORIOS
    );
  },
  tipoAgenda: async () => {
    const marcadores = TIPOS_AGENDA_OBRIGATORIOS.map(() => '?').join(', ');
    await executar(
      `DELETE FROM tipoAgenda
      WHERE LOWER(TRIM(descricao)) NOT IN (${marcadores})`,
      TIPOS_AGENDA_OBRIGATORIOS
    );
  },
  etapaPedido: async () => {
    await executar('DELETE FROM etapaPedido WHERE idEtapa <> ?', [ID_ETAPA_PEDIDO_ENTREGUE]);
  },
  etapaOrcamento: async () => {
    const marcadores = IDS_ETAPAS_ORCAMENTO_OBRIGATORIAS.map(() => '?').join(', ');
    await executar(
      `DELETE FROM etapaOrcamento
      WHERE idEtapaOrcamento NOT IN (${marcadores})`,
      IDS_ETAPAS_ORCAMENTO_OBRIGATORIAS
    );
  }
};

async function listarTabelasUsuario() {
  const tabelas = await consultarTodos(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `);

  return tabelas
    .map((item) => String(item.name || '').trim())
    .filter(Boolean);
}

async function resetarBancoParaBaseMinima() {
  await executar('PRAGMA foreign_keys = OFF');

  const tabelas = await listarTabelasUsuario();

  for (const tabela of tabelas) {
    const estrategia = estrategiasPreservacao[tabela];

    if (estrategia) {
      await estrategia();
      continue;
    }

    await executar(`DELETE FROM ${tabela}`);
  }

  await executar('DELETE FROM sqlite_sequence');
  await executar('PRAGMA foreign_keys = ON');
}

async function exibirResumo() {
  const resumo = await consultarTodos(`
    SELECT 'usuario' AS tabela, COUNT(*) AS total FROM usuario
    UNION ALL
    SELECT 'configuracaoAtualizacaoSistema' AS tabela, COUNT(*) AS total FROM configuracaoAtualizacaoSistema
    UNION ALL
    SELECT 'statusVisita' AS tabela, COUNT(*) AS total FROM statusVisita
    UNION ALL
    SELECT 'tipoAgenda' AS tabela, COUNT(*) AS total FROM tipoAgenda
    UNION ALL
    SELECT 'etapaPedido' AS tabela, COUNT(*) AS total FROM etapaPedido
    UNION ALL
    SELECT 'etapaOrcamento' AS tabela, COUNT(*) AS total FROM etapaOrcamento
    UNION ALL
    SELECT 'empresa' AS tabela, COUNT(*) AS total FROM empresa
    UNION ALL
    SELECT 'cliente' AS tabela, COUNT(*) AS total FROM cliente
    UNION ALL
    SELECT 'produto' AS tabela, COUNT(*) AS total FROM produto
    UNION ALL
    SELECT 'orcamento' AS tabela, COUNT(*) AS total FROM orcamento
    UNION ALL
    SELECT 'pedido' AS tabela, COUNT(*) AS total FROM pedido
    UNION ALL
    SELECT 'atendimento' AS tabela, COUNT(*) AS total FROM atendimento
    UNION ALL
    SELECT 'agendamento' AS tabela, COUNT(*) AS total FROM agendamento
  `);

  console.log(`Banco resetado para a base minima em ${caminhoBanco}`);
  resumo.forEach((item) => {
    console.log(`${item.tabela}: ${item.total} registros`);
  });
}

async function popularBanco() {
  await resetarBancoParaBaseMinima();
  await exibirResumo();
}

popularBanco()
  .catch((erro) => {
    console.error('Falha ao resetar o banco de dados para a base minima.');
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => {
    banco.close();
  });
