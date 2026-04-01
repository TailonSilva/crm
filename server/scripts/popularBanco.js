const { banco, executar, consultarTodos, caminhoBanco } = require('../configuracoes/banco');

function formatarIndice(valor) {
  return String(valor).padStart(2, '0');
}

function gerarCnpj(indice) {
  const base = `${formatarIndice(indice)}123450001`;
  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/${base.slice(8, 12)}-${formatarIndice(indice)}`;
}

function gerarImagemCliente(indice) {
  const nomeCliente = encodeURIComponent(`Cliente ${formatarIndice(indice)}`);
  return `https://ui-avatars.com/api/?name=${nomeCliente}&background=1791E2&color=FFFFFF&size=128&bold=true&rounded=true`;
}

function gerarImagemProduto(indice) {
  return `https://picsum.photos/seed/produto-${formatarIndice(indice)}/320/320`;
}

const enderecosClientes = [
  { cidade: 'Sao Paulo', estado: 'SP', cep: '01001-000' },
  { cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20040-020' },
  { cidade: 'Belo Horizonte', estado: 'MG', cep: '30130-110' },
  { cidade: 'Curitiba', estado: 'PR', cep: '80010-000' },
  { cidade: 'Porto Alegre', estado: 'RS', cep: '90010-150' },
  { cidade: 'Salvador', estado: 'BA', cep: '40020-000' },
  { cidade: 'Recife', estado: 'PE', cep: '50030-230' },
  { cidade: 'Fortaleza', estado: 'CE', cep: '60060-080' },
  { cidade: 'Goiania', estado: 'GO', cep: '74003-010' },
  { cidade: 'Belem', estado: 'PA', cep: '66017-000' }
];

async function limparBanco() {
  await executar('PRAGMA foreign_keys = OFF');

  const tabelas = [
    'contato',
    'cliente',
    'produto',
    'etapaOrcamento',
    'vendedor',
    'ramoAtividade',
    'grupoProduto',
    'marca',
    'unidadeMedida'
  ];

  for (const tabela of tabelas) {
    await executar(`DELETE FROM ${tabela}`);
  }

  await executar("DELETE FROM sqlite_sequence WHERE name IN ('contato', 'cliente', 'produto', 'etapaOrcamento', 'vendedor', 'ramoAtividade', 'grupoProduto', 'marca', 'unidadeMedida')");
  await executar('PRAGMA foreign_keys = ON');
}

async function popularCadastrosBase() {
  const ramos = [
    'Industria alimenticia',
    'Distribuicao hospitalar',
    'Atacado de bebidas',
    'E-commerce de utilidades',
    'Comercio varejista',
    'Tecnologia industrial',
    'Logistica regional',
    'Saude e bem-estar',
    'Materiais de construcao',
    'Agronegocio'
  ];

  const grupos = [
    'Bebidas',
    'Descartaveis',
    'Limpeza',
    'Equipamentos',
    'Tecnologia',
    'Embalagens',
    'Acessorios',
    'Higiene',
    'Reposicao',
    'Escritorio'
  ];

  const marcas = [
    'Atlas',
    'VitaMax',
    'BlueTech',
    'Sigma',
    'Nobre',
    'Aurora',
    'Prime',
    'Central',
    'NovaEra',
    'Alvo'
  ];

  const unidades = [
    'UN',
    'CX',
    'PC',
    'KG',
    'LT',
    'MT',
    'FD',
    'SC',
    'RL',
    'BT'
  ];

  for (let indice = 0; indice < 10; indice += 1) {
    await executar(
      'INSERT INTO ramoAtividade (descricao, status) VALUES (?, ?)',
      [ramos[indice], indice % 4 === 0 ? 0 : 1]
    );

    await executar(
      'INSERT INTO vendedor (nome, email, status) VALUES (?, ?, ?)',
      [
        `Vendedor ${formatarIndice(indice + 1)}`,
        `vendedor${indice + 1}@crmteste.com.br`,
        indice % 5 === 0 ? 0 : 1
      ]
    );

    await executar(
      'INSERT INTO grupoProduto (descricao, status) VALUES (?, ?)',
      [grupos[indice], 1]
    );

    await executar(
      'INSERT INTO marca (descricao, status) VALUES (?, ?)',
      [marcas[indice], indice % 3 === 0 ? 0 : 1]
    );

    await executar(
      'INSERT INTO unidadeMedida (descricao, status) VALUES (?, ?)',
      [unidades[indice], 1]
    );
  }

  const etapasOrcamento = [
    { descricao: 'Lead recebido', cor: '#D9EAF7', ordem: 1 },
    { descricao: 'Contato inicial', cor: '#CFE5FF', ordem: 2 },
    { descricao: 'Qualificacao', cor: '#BFE3D0', ordem: 3 },
    { descricao: 'Apresentacao da proposta', cor: '#FFE2A8', ordem: 4 },
    { descricao: 'Negociacao', cor: '#FFC98F', ordem: 5 },
    { descricao: 'Fechado', cor: '#A7E1B8', ordem: 6 }
  ];

  for (const etapa of etapasOrcamento) {
    await executar(
      'INSERT INTO etapaOrcamento (descricao, cor, ordem, status) VALUES (?, ?, ?, ?)',
      [etapa.descricao, etapa.cor, etapa.ordem, 1]
    );
  }
}

async function popularClientes() {
  for (let indice = 1; indice <= 10; indice += 1) {
    const endereco = enderecosClientes[indice - 1];

    await executar(
      `
        INSERT INTO cliente (
          idVendedor,
          idRamo,
          razaoSocial,
          nomeFantasia,
          tipo,
          cnpj,
          inscricaoEstadual,
          status,
          email,
          telefone,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cep,
          observacao,
          imagem
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        indice,
        indice,
        `Empresa de Teste ${formatarIndice(indice)} LTDA`,
        `Cliente ${formatarIndice(indice)}`,
        indice % 2 === 0 ? 'Juridico' : 'Fisico',
        gerarCnpj(indice),
        `IE${1000 + indice}`,
        indice % 6 === 0 ? 0 : 1,
        `cliente${indice}@crmteste.com.br`,
        `(11) 9000${formatarIndice(indice)}-${1000 + indice}`,
        `Rua Principal ${indice}`,
        `${indice * 10}`,
        indice % 2 === 0 ? `Sala ${indice}` : 'Bloco A',
        `Bairro ${formatarIndice(indice)}`,
        endereco.cidade,
        endereco.estado,
        endereco.cep,
        `Observacao de teste para o cliente ${formatarIndice(indice)}.`,
        gerarImagemCliente(indice)
      ]
    );
  }
}

async function popularContatos() {
  for (let indice = 1; indice <= 10; indice += 1) {
    await executar(
      `
        INSERT INTO contato (
          idCliente,
          nome,
          cargo,
          email,
          telefone,
          whatsapp,
          status,
          principal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        indice,
        `Contato ${formatarIndice(indice)}`,
        indice % 2 === 0 ? 'Comprador' : 'Gerente',
        `contato${indice}@crmteste.com.br`,
        `(11) 4000${formatarIndice(indice)}-${2000 + indice}`,
        `(11) 9500${formatarIndice(indice)}-${3000 + indice}`,
        1,
        indice % 3 === 0 ? 0 : 1
      ]
    );
  }
}

async function popularProdutos() {
  for (let indice = 1; indice <= 10; indice += 1) {
    await executar(
      `
        INSERT INTO produto (
          referencia,
          descricao,
          idGrupo,
          idMarca,
          idUnidade,
          preco,
          imagem,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        `REF-${formatarIndice(indice)}`,
        `Produto de teste ${formatarIndice(indice)}`,
        indice,
        indice,
        indice,
        (indice * 12.75).toFixed(2),
        gerarImagemProduto(indice),
        indice % 4 === 0 ? 0 : 1
      ]
    );
  }
}

async function exibirResumo() {
  const resumo = await consultarTodos(`
    SELECT 'ramoAtividade' AS tabela, COUNT(*) AS total FROM ramoAtividade
    UNION ALL
    SELECT 'vendedor' AS tabela, COUNT(*) AS total FROM vendedor
    UNION ALL
    SELECT 'grupoProduto' AS tabela, COUNT(*) AS total FROM grupoProduto
    UNION ALL
    SELECT 'marca' AS tabela, COUNT(*) AS total FROM marca
    UNION ALL
    SELECT 'unidadeMedida' AS tabela, COUNT(*) AS total FROM unidadeMedida
    UNION ALL
    SELECT 'cliente' AS tabela, COUNT(*) AS total FROM cliente
    UNION ALL
    SELECT 'contato' AS tabela, COUNT(*) AS total FROM contato
    UNION ALL
    SELECT 'produto' AS tabela, COUNT(*) AS total FROM produto
    UNION ALL
    SELECT 'etapaOrcamento' AS tabela, COUNT(*) AS total FROM etapaOrcamento
  `);

  console.log(`Banco populado com sucesso em ${caminhoBanco}`);
  resumo.forEach((item) => {
    console.log(`${item.tabela}: ${item.total} registros`);
  });
}

async function popularBanco() {
  await limparBanco();
  await popularCadastrosBase();
  await popularClientes();
  await popularContatos();
  await popularProdutos();
  await exibirResumo();
}

popularBanco()
  .catch((erro) => {
    console.error('Falha ao popular o banco de dados.');
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => {
    banco.close();
  });
