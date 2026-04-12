const { consultarUm } = require('../configuracoes/banco');

const validacoesPorEntidade = {
  usuario: [
    {
      campo: 'idVendedor',
      tabela: 'vendedor',
      chavePrimaria: 'idVendedor',
      colunaAtiva: 'status',
      mensagem: 'Selecione um vendedor ativo.'
    }
  ],
  cliente: [
    {
      campo: 'idVendedor',
      tabela: 'vendedor',
      chavePrimaria: 'idVendedor',
      colunaAtiva: 'status',
      mensagem: 'Selecione um vendedor ativo.'
    },
    {
      campo: 'idRamo',
      tabela: 'ramoAtividade',
      chavePrimaria: 'idRamo',
      colunaAtiva: 'status',
      mensagem: 'Selecione um ramo de atividade ativo.'
    },
    {
      campo: 'idGrupoEmpresa',
      tabela: 'grupoEmpresa',
      chavePrimaria: 'idGrupoEmpresa',
      colunaAtiva: 'status',
      mensagem: 'Selecione um grupo de empresa ativo.'
    }
  ],
  contatoGrupoEmpresa: [
    {
      campo: 'idGrupoEmpresa',
      tabela: 'grupoEmpresa',
      chavePrimaria: 'idGrupoEmpresa',
      colunaAtiva: 'status',
      mensagem: 'Selecione um grupo de empresa ativo.'
    }
  ],
  contato: [
    {
      campo: 'idCliente',
      tabela: 'cliente',
      chavePrimaria: 'idCliente',
      colunaAtiva: 'status',
      mensagem: 'Selecione um cliente ativo.'
    }
  ],
  produto: [
    {
      campo: 'idGrupo',
      tabela: 'grupoProduto',
      chavePrimaria: 'idGrupo',
      colunaAtiva: 'status',
      mensagem: 'Selecione um grupo de produto ativo.'
    },
    {
      campo: 'idMarca',
      tabela: 'marca',
      chavePrimaria: 'idMarca',
      colunaAtiva: 'status',
      mensagem: 'Selecione uma marca ativa.'
    },
    {
      campo: 'idUnidade',
      tabela: 'unidadeMedida',
      chavePrimaria: 'idUnidade',
      colunaAtiva: 'status',
      mensagem: 'Selecione uma unidade ativa.'
    }
  ],
  grupoProdutoTamanho: [
    {
      campo: 'idGrupo',
      tabela: 'grupoProduto',
      chavePrimaria: 'idGrupo',
      colunaAtiva: 'status',
      mensagem: 'Selecione um grupo de produto ativo.'
    },
    {
      campo: 'idTamanho',
      tabela: 'tamanho',
      chavePrimaria: 'idTamanho',
      colunaAtiva: 'status',
      mensagem: 'Selecione um tamanho ativo.'
    }
  ],
  recurso: [
    {
      campo: 'idTipoRecurso',
      tabela: 'tipoRecurso',
      chavePrimaria: 'idTipoRecurso',
      colunaAtiva: 'status',
      mensagem: 'Selecione um tipo de recurso ativo.'
    }
  ],
  prazoPagamento: [
    {
      campo: 'idMetodoPagamento',
      tabela: 'metodoPagamento',
      chavePrimaria: 'idMetodoPagamento',
      colunaAtiva: 'status',
      mensagem: 'Selecione um metodo de pagamento ativo.'
    }
  ],
  atendimento: [
    {
      campo: 'idCliente',
      tabela: 'cliente',
      chavePrimaria: 'idCliente',
      colunaAtiva: 'status',
      mensagem: 'Selecione um cliente ativo.'
    },
    {
      campo: 'idContato',
      tabela: 'contato',
      chavePrimaria: 'idContato',
      colunaAtiva: 'status',
      mensagem: 'Selecione um contato ativo.'
    },
    {
      campo: 'idUsuario',
      tabela: 'usuario',
      chavePrimaria: 'idUsuario',
      colunaAtiva: 'ativo',
      mensagem: 'Selecione um usuario ativo.'
    },
    {
      campo: 'idCanalAtendimento',
      tabela: 'canalAtendimento',
      chavePrimaria: 'idCanalAtendimento',
      colunaAtiva: 'status',
      mensagem: 'Selecione um canal de atendimento ativo.'
    },
    {
      campo: 'idTipoAtendimento',
      tabela: 'tipoAtendimento',
      chavePrimaria: 'idTipoAtendimento',
      colunaAtiva: 'status',
      mensagem: 'Selecione um tipo de atendimento ativo.'
    },
    {
      campo: 'idOrigemAtendimento',
      tabela: 'origemAtendimento',
      chavePrimaria: 'idOrigemAtendimento',
      colunaAtiva: 'status',
      mensagem: 'Selecione uma origem de atendimento ativa.'
    }
  ],
  orcamento: [
    {
      campo: 'idCliente',
      tabela: 'cliente',
      chavePrimaria: 'idCliente',
      colunaAtiva: 'status',
      mensagem: 'Selecione um cliente ativo.'
    },
    {
      campo: 'idContato',
      tabela: 'contato',
      chavePrimaria: 'idContato',
      colunaAtiva: 'status',
      mensagem: 'Selecione um contato ativo.'
    },
    {
      campo: 'idUsuario',
      tabela: 'usuario',
      chavePrimaria: 'idUsuario',
      colunaAtiva: 'ativo',
      mensagem: 'Selecione um usuario ativo.'
    },
    {
      campo: 'idVendedor',
      tabela: 'vendedor',
      chavePrimaria: 'idVendedor',
      colunaAtiva: 'status',
      mensagem: 'Selecione um vendedor ativo.'
    },
    {
      campo: 'idPrazoPagamento',
      tabela: 'prazoPagamento',
      chavePrimaria: 'idPrazoPagamento',
      colunaAtiva: 'status',
      mensagem: 'Selecione um prazo de pagamento ativo.'
    },
    {
      campo: 'idEtapaOrcamento',
      tabela: 'etapaOrcamento',
      chavePrimaria: 'idEtapaOrcamento',
      colunaAtiva: 'status',
      mensagem: 'Selecione uma etapa de orcamento ativa.'
    },
    {
      campo: 'idMotivoPerda',
      tabela: 'motivoPerda',
      chavePrimaria: 'idMotivo',
      colunaAtiva: 'status',
      mensagem: 'Selecione um motivo da perda ativo.'
    }
  ],
  itemOrcamento: [
    {
      campo: 'idProduto',
      tabela: 'produto',
      chavePrimaria: 'idProduto',
      colunaAtiva: 'status',
      mensagem: 'Selecione um produto ativo.'
    }
  ],
  valorCampoOrcamento: [
    {
      campo: 'idCampoOrcamento',
      tabela: 'campoOrcamentoConfiguravel',
      chavePrimaria: 'idCampoOrcamento',
      colunaAtiva: 'status',
      mensagem: 'Selecione um campo do orcamento ativo.'
    }
  ],
  pedido: [
    {
      campo: 'idCliente',
      tabela: 'cliente',
      chavePrimaria: 'idCliente',
      colunaAtiva: 'status',
      mensagem: 'Selecione um cliente ativo.'
    },
    {
      campo: 'idContato',
      tabela: 'contato',
      chavePrimaria: 'idContato',
      colunaAtiva: 'status',
      mensagem: 'Selecione um contato ativo.'
    },
    {
      campo: 'idUsuario',
      tabela: 'usuario',
      chavePrimaria: 'idUsuario',
      colunaAtiva: 'ativo',
      mensagem: 'Selecione um usuario ativo.'
    },
    {
      campo: 'idVendedor',
      tabela: 'vendedor',
      chavePrimaria: 'idVendedor',
      colunaAtiva: 'status',
      mensagem: 'Selecione um vendedor ativo.'
    },
    {
      campo: 'idPrazoPagamento',
      tabela: 'prazoPagamento',
      chavePrimaria: 'idPrazoPagamento',
      colunaAtiva: 'status',
      mensagem: 'Selecione um prazo de pagamento ativo.'
    },
    {
      campo: 'idTipoPedido',
      tabela: 'tipoPedido',
      chavePrimaria: 'idTipoPedido',
      colunaAtiva: 'status',
      mensagem: 'Selecione um tipo de pedido ativo.'
    },
    {
      campo: 'idMotivoDevolucao',
      tabela: 'motivoDevolucao',
      chavePrimaria: 'idMotivoDevolucao',
      colunaAtiva: 'status',
      mensagem: 'Selecione um motivo da devolucao ativo.'
    },
    {
      campo: 'idEtapaPedido',
      tabela: 'etapaPedido',
      chavePrimaria: 'idEtapa',
      colunaAtiva: 'status',
      mensagem: 'Selecione uma etapa de pedido ativa.'
    }
  ],
  itemPedido: [
    {
      campo: 'idProduto',
      tabela: 'produto',
      chavePrimaria: 'idProduto',
      colunaAtiva: 'status',
      mensagem: 'Selecione um produto ativo.'
    }
  ],
  valorCampoPedido: [
    {
      campo: 'idCampoPedido',
      tabela: 'campoPedidoConfiguravel',
      chavePrimaria: 'idCampoPedido',
      colunaAtiva: 'status',
      mensagem: 'Selecione um campo do pedido ativo.'
    },
    {
      campo: 'idCampoOrcamento',
      tabela: 'campoOrcamentoConfiguravel',
      chavePrimaria: 'idCampoOrcamento',
      colunaAtiva: 'status',
      mensagem: 'Selecione um campo do orcamento ativo.'
    }
  ]
};

async function validarReferenciasAtivasDaEntidade(nomeEntidade, payload = {}) {
  const validacoes = validacoesPorEntidade[nomeEntidade] || [];

  for (const validacao of validacoes) {
    const valor = payload[validacao.campo];

    if (valor === undefined || valor === null || valor === '') {
      continue;
    }

    const registro = await consultarUm(
      `SELECT ${validacao.chavePrimaria} AS idRegistro, ${validacao.colunaAtiva} AS ativoRegistro
       FROM ${validacao.tabela}
       WHERE ${validacao.chavePrimaria} = ?`,
      [valor]
    );

    if (!registro || Number(registro.ativoRegistro) !== 1) {
      const erro = new Error(validacao.mensagem);
      erro.statusCode = 400;
      throw erro;
    }
  }
}

module.exports = {
  validarReferenciasAtivasDaEntidade
};
