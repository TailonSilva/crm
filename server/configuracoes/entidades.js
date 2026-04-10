const entidades = [
  {
    nome: 'ramoAtividade',
    rota: '/api/ramosAtividade',
    chavePrimaria: 'idRamo',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'vendedor',
    rota: '/api/vendedores',
    chavePrimaria: 'idVendedor',
    camposObrigatorios: ['nome', 'email'],
    camposPermitidos: ['nome', 'email', 'comissaoPadrao', 'status']
  },
  {
    nome: 'grupoProduto',
    rota: '/api/gruposProduto',
    chavePrimaria: 'idGrupo',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'grupoEmpresa',
    rota: '/api/gruposEmpresa',
    chavePrimaria: 'idGrupoEmpresa',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'contatoGrupoEmpresa',
    rota: '/api/contatosGruposEmpresa',
    chavePrimaria: 'idContatoGrupoEmpresa',
    camposObrigatorios: ['idGrupoEmpresa', 'nome'],
    camposPermitidos: [
      'idGrupoEmpresa',
      'nome',
      'cargo',
      'email',
      'telefone',
      'whatsapp',
      'status',
      'principal'
    ]
  },
  {
    nome: 'tamanho',
    rota: '/api/tamanhos',
    chavePrimaria: 'idTamanho',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'grupoProdutoTamanho',
    rota: '/api/gruposProdutoTamanhos',
    chavePrimaria: 'idGrupoProdutoTamanho',
    camposObrigatorios: ['idGrupo', 'idTamanho', 'ordem'],
    camposPermitidos: ['idGrupo', 'idTamanho', 'ordem']
  },
  {
    nome: 'marca',
    rota: '/api/marcas',
    chavePrimaria: 'idMarca',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'unidadeMedida',
    rota: '/api/unidadesMedida',
    chavePrimaria: 'idUnidade',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'localAgenda',
    rota: '/api/locaisAgenda',
    chavePrimaria: 'idLocal',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'tipoRecurso',
    rota: '/api/tiposRecurso',
    chavePrimaria: 'idTipoRecurso',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'recurso',
    rota: '/api/recursos',
    chavePrimaria: 'idRecurso',
    camposObrigatorios: ['descricao', 'idTipoRecurso'],
    camposPermitidos: ['descricao', 'idTipoRecurso', 'status']
  },
  {
    nome: 'agendamento',
    rota: '/api/agendamentos',
    chavePrimaria: 'idAgendamento',
    camposObrigatorios: [
      'data',
      'assunto',
      'horaInicio',
      'horaFim',
      'idUsuario',
      'idTipoAgenda',
      'idStatusVisita'
    ],
    camposPermitidos: [
      'data',
      'assunto',
      'horaInicio',
      'horaFim',
      'idLocal',
      'idRecurso',
      'idCliente',
      'idContato',
      'idUsuario',
      'tipo',
      'idTipoAgenda',
      'idStatusVisita',
      'status'
    ]
  },
  {
    nome: 'tipoAgenda',
    rota: '/api/tiposAgenda',
    chavePrimaria: 'idTipoAgenda',
    camposObrigatorios: ['descricao', 'cor'],
    camposPermitidos: [
      'descricao',
      'cor',
      'obrigarCliente',
      'obrigarLocal',
      'obrigarRecurso',
      'ordem',
      'status'
    ]
  },
  {
    nome: 'statusVisita',
    rota: '/api/statusVisita',
    chavePrimaria: 'idStatusVisita',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'icone', 'ordem', 'status']
  },
  {
    nome: 'canalAtendimento',
    rota: '/api/canaisAtendimento',
    chavePrimaria: 'idCanalAtendimento',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'origemAtendimento',
    rota: '/api/origensAtendimento',
    chavePrimaria: 'idOrigemAtendimento',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'metodoPagamento',
    rota: '/api/metodosPagamento',
    chavePrimaria: 'idMetodoPagamento',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'tipoPedido',
    rota: '/api/tiposPedido',
    chavePrimaria: 'idTipoPedido',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'prazoPagamento',
    rota: '/api/prazosPagamento',
    chavePrimaria: 'idPrazoPagamento',
    camposObrigatorios: ['idMetodoPagamento'],
    camposPermitidos: [
      'descricao',
      'idMetodoPagamento',
      'prazo1',
      'prazo2',
      'prazo3',
      'prazo4',
      'prazo5',
      'prazo6',
      'status'
    ]
  },
  {
    nome: 'motivoPerda',
    rota: '/api/motivosPerda',
    chavePrimaria: 'idMotivo',
    camposObrigatorios: ['descricao'],
    camposPermitidos: ['descricao', 'status']
  },
  {
    nome: 'motivoDevolucao',
    rota: '/api/motivosDevolucao',
    chavePrimaria: 'idMotivoDevolucao',
    camposObrigatorios: ['abreviacao', 'descricao'],
    camposPermitidos: ['abreviacao', 'descricao', 'status']
  },
  {
    nome: 'etapaPedido',
    rota: '/api/etapasPedido',
    chavePrimaria: 'idEtapa',
    camposObrigatorios: ['descricao', 'cor'],
    camposPermitidos: ['descricao', 'cor', 'ordem', 'status']
  },
  {
    nome: 'etapaOrcamento',
    rota: '/api/etapasOrcamento',
    chavePrimaria: 'idEtapaOrcamento',
    camposObrigatorios: ['descricao', 'cor'],
    camposPermitidos: ['descricao', 'cor', 'ordem', 'obrigarMotivoPerda', 'consideraFunilVendas', 'status']
  },
  {
    nome: 'campoOrcamentoConfiguravel',
    rota: '/api/camposOrcamento',
    chavePrimaria: 'idCampoOrcamento',
    camposObrigatorios: ['titulo'],
    camposPermitidos: ['titulo', 'descricao', 'descricaoPadrao', 'status']
  },
  {
    nome: 'campoPedidoConfiguravel',
    rota: '/api/camposPedido',
    chavePrimaria: 'idCampoPedido',
    camposObrigatorios: ['titulo'],
    camposPermitidos: ['titulo', 'descricaoPadrao', 'status']
  },
  {
    nome: 'empresa',
    rota: '/api/empresas',
    chavePrimaria: 'idEmpresa',
    camposObrigatorios: ['razaoSocial', 'nomeFantasia', 'tipo', 'cnpj'],
    camposPermitidos: [
      'razaoSocial',
      'nomeFantasia',
      'slogan',
      'tipo',
      'cnpj',
      'inscricaoEstadual',
      'email',
      'telefone',
      'horaInicioManha',
      'horaFimManha',
      'horaInicioTarde',
      'horaFimTarde',
      'trabalhaSabado',
      'horaInicioSabado',
      'horaFimSabado',
      'exibirFunilPaginaInicial',
      'diasValidadeOrcamento',
      'diasEntregaPedido',
      'codigoPrincipalCliente',
      'etapasFiltroPadraoOrcamento',
      'colunasGridClientes',
      'colunasGridOrcamentos',
      'colunasGridProdutos',
      'colunasGridPedidos',
      'colunasGridAtendimentos',
      'graficosPaginaInicialOrcamentos',
      'graficosPaginaInicialVendas',
      'cardsPaginaInicial',
      'corPrimariaOrcamento',
      'corSecundariaOrcamento',
      'corDestaqueOrcamento',
      'destaqueItemOrcamentoPdf',
      'logradouro',
      'numero',
      'complemento',
      'bairro',
      'cidade',
      'estado',
      'cep',
      'imagem'
    ]
  },
  {
    nome: 'usuario',
    rota: '/api/usuarios',
    chavePrimaria: 'idUsuario',
    camposObrigatorios: ['nome', 'usuario', 'senha', 'tipo'],
    camposPermitidos: ['nome', 'usuario', 'senha', 'tipo', 'ativo', 'imagem', 'idVendedor']
  },
  {
    nome: 'cliente',
    rota: '/api/clientes',
    chavePrimaria: 'idCliente',
    camposObrigatorios: [
      'idVendedor',
      'idRamo',
      'razaoSocial',
      'nomeFantasia',
      'tipo',
      'cnpj'
    ],
    camposPermitidos: [
      'idCliente',
      'idVendedor',
      'idGrupoEmpresa',
      'codigoAlternativo',
      'idRamo',
      'razaoSocial',
      'nomeFantasia',
      'tipo',
      'cnpj',
      'inscricaoEstadual',
      'status',
      'email',
      'telefone',
      'logradouro',
      'numero',
      'complemento',
      'bairro',
      'cidade',
      'estado',
      'cep',
      'observacao',
      'imagem'
    ]
  },
  {
    nome: 'contato',
    rota: '/api/contatos',
    chavePrimaria: 'idContato',
    camposObrigatorios: ['idCliente', 'nome'],
    camposPermitidos: [
      'idCliente',
      'nome',
      'cargo',
      'email',
      'telefone',
      'whatsapp',
      'status',
      'principal'
    ]
  },
  {
    nome: 'produto',
    rota: '/api/produtos',
    chavePrimaria: 'idProduto',
    camposObrigatorios: [
      'referencia',
      'descricao',
      'idGrupo',
      'idMarca',
      'idUnidade',
      'preco'
    ],
    camposPermitidos: [
      'idProduto',
      'referencia',
      'descricao',
      'idGrupo',
      'idMarca',
      'idUnidade',
      'preco',
      'imagem',
      'status'
    ]
  },
  {
    nome: 'atendimento',
    rota: '/api/atendimentos',
    chavePrimaria: 'idAtendimento',
    camposObrigatorios: [
      'idCliente',
      'idUsuario',
      'assunto',
      'data',
      'horaInicio',
      'horaFim'
      ],
      camposPermitidos: [
        'idAgendamento',
        'idCliente',
        'idContato',
        'idUsuario',
        'assunto',
      'descricao',
      'data',
      'horaInicio',
      'horaFim',
      'idCanalAtendimento',
      'idOrigemAtendimento'
    ]
  },
  {
    nome: 'orcamento',
    rota: '/api/orcamentos',
    chavePrimaria: 'idOrcamento',
    camposObrigatorios: ['idCliente'],
    camposPermitidos: [
      'idCliente',
      'idContato',
      'idUsuario',
      'idPedidoVinculado',
      'idVendedor',
      'comissao',
      'idPrazoPagamento',
      'idEtapaOrcamento',
      'idMotivoPerda',
      'observacao'
    ]
  },
  {
    nome: 'itemOrcamento',
    rota: '/api/itensOrcamento',
    chavePrimaria: 'idItemOrcamento',
    camposObrigatorios: ['idOrcamento', 'idProduto', 'quantidade', 'valorUnitario', 'valorTotal'],
    camposPermitidos: [
      'idOrcamento',
      'idProduto',
      'quantidade',
      'valorUnitario',
      'valorTotal',
      'imagem',
      'observacao',
      'referenciaProdutoSnapshot',
      'descricaoProdutoSnapshot',
      'unidadeProdutoSnapshot'
    ]
  },
  {
    nome: 'valorCampoOrcamento',
    rota: '/api/valoresCamposOrcamento',
    chavePrimaria: 'idValorCampoOrcamento',
    camposObrigatorios: ['idOrcamento', 'idCampoOrcamento'],
    camposPermitidos: ['idOrcamento', 'idCampoOrcamento', 'valor']
  },
  {
    nome: 'pedido',
    rota: '/api/pedidos',
    chavePrimaria: 'idPedido',
    camposObrigatorios: ['idCliente', 'idUsuario', 'idVendedor'],
    camposPermitidos: [
      'idOrcamento',
      'idCliente',
      'idContato',
      'idUsuario',
      'idVendedor',
      'comissao',
      'valorComissao',
      'idPrazoPagamento',
      'idTipoPedido',
      'idEtapaPedido',
      'idMotivoDevolucao',
      'dataInclusao',
      'dataEntrega',
      'dataValidade',
      'observacao',
      'codigoOrcamentoOrigem',
      'nomeClienteSnapshot',
      'nomeContatoSnapshot',
      'nomeUsuarioSnapshot',
      'nomeVendedorSnapshot',
      'nomeMetodoPagamentoSnapshot',
      'nomePrazoPagamentoSnapshot',
      'nomeTipoPedidoSnapshot',
      'nomeEtapaPedidoSnapshot'
    ]
  },
  {
    nome: 'itemPedido',
    rota: '/api/itensPedido',
    chavePrimaria: 'idItemPedido',
    camposObrigatorios: ['idPedido', 'quantidade', 'valorUnitario', 'valorTotal'],
    camposPermitidos: [
      'idPedido',
      'idProduto',
      'quantidade',
      'valorUnitario',
      'valorTotal',
      'imagem',
      'observacao',
      'referenciaProdutoSnapshot',
      'descricaoProdutoSnapshot',
      'unidadeProdutoSnapshot'
    ]
  },
  {
    nome: 'valorCampoPedido',
    rota: '/api/valoresCamposPedido',
    chavePrimaria: 'idValorCampoPedido',
    camposObrigatorios: ['idPedido'],
    camposPermitidos: ['idPedido', 'idCampoPedido', 'idCampoOrcamento', 'tituloSnapshot', 'valor']
  }
];

module.exports = {
  entidades
};
