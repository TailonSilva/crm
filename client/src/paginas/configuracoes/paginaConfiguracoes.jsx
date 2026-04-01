import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import { Icone } from '../../componentes/comuns/icone';
import { useEffect, useState } from 'react';
import {
  atualizarEtapaPedido,
  atualizarEtapaOrcamento,
  atualizarGrupoProduto,
  atualizarCanalAtendimento,
  atualizarCampoOrcamento,
  atualizarCampoPedido,
  atualizarLocalAgenda,
  atualizarMarca,
  atualizarMetodoPagamento,
  atualizarMotivoPerda,
  atualizarOrigemAtendimento,
  atualizarPrazoPagamento,
  atualizarRecurso,
  atualizarRamoAtividade,
  atualizarStatusVisita,
  atualizarTipoAgenda,
  atualizarTipoRecurso,
  atualizarUnidadeMedida,
  atualizarVendedor,
  incluirEtapaPedido,
  incluirEtapaOrcamento,
  incluirGrupoProduto,
  incluirCanalAtendimento,
  incluirCampoOrcamento,
  incluirCampoPedido,
  incluirLocalAgenda,
  incluirMarca,
  incluirMetodoPagamento,
  incluirMotivoPerda,
  incluirOrigemAtendimento,
  incluirPrazoPagamento,
  incluirRecurso,
  incluirRamoAtividade,
  incluirStatusVisita,
  incluirTipoAgenda,
  incluirTipoRecurso,
  incluirUnidadeMedida,
  incluirVendedor,
  listarEtapasPedidoConfiguracao,
  listarEtapasOrcamentoConfiguracao,
  listarGruposProdutoConfiguracao,
  listarCanaisAtendimentoConfiguracao,
  listarCamposOrcamentoConfiguracao,
  listarCamposPedidoConfiguracao,
  listarLocaisAgendaConfiguracao,
  listarMarcasConfiguracao,
  listarMetodosPagamentoConfiguracao,
  listarMotivosPerdaConfiguracao,
  obterConfiguracaoAtualizacaoSistema,
  listarOrigensAtendimentoConfiguracao,
  listarPrazosPagamentoConfiguracao,
  listarRecursosConfiguracao,
  listarRamosAtividadeConfiguracao,
  listarStatusVisitaConfiguracao,
  listarTamanhosConfiguracao,
  listarTiposAgendaConfiguracao,
  listarTiposRecursoConfiguracao,
  listarUnidadesMedidaConfiguracao,
  listarVendedoresConfiguracao,
  salvarConfiguracaoAtualizacaoSistema,
  atualizarTamanho,
  incluirTamanho
} from '../../servicos/configuracoes';
import { atualizarEmpresa, incluirEmpresa, listarEmpresas } from '../../servicos/empresa';
import { atualizarUsuario, incluirUsuario, listarUsuarios } from '../../servicos/usuarios';
import { normalizarTelefone } from '../../utilitarios/normalizarTelefone';
import { ModalAtualizacaoSistema } from './modalAtualizacaoSistema';
import { ModalCadastroConfiguracao } from './modalCadastroConfiguracao';
import { ModalEmpresa } from './modalEmpresa';
import { ModalGruposProduto } from './modalGruposProduto';
import { ModalMarcas } from './modalMarcas';
import { ModalPrazosPagamento } from './modalPrazosPagamento';
import { ModalRamosAtividade } from './modalRamosAtividade';
import { ModalUnidadesMedida } from './modalUnidadesMedida';
import { ModalUsuarios } from './modalUsuarios';

const atalhosConfiguracao = [
  {
    id: 'empresa',
    titulo: 'Empresa',
    icone: 'empresa'
  },
  {
    id: 'ramosAtividade',
    titulo: 'Ramos de atividade',
    icone: 'cadastro'
  },
  {
    id: 'vendedores',
    titulo: 'Vendedores',
    icone: 'usuarios'
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    icone: 'contato'
  },
  {
    id: 'gruposProduto',
    titulo: 'Grupos de produto',
    icone: 'caixa'
  },
  {
    id: 'marcas',
    titulo: 'Marcas',
    icone: 'selo'
  },
  {
    id: 'metodosPagamento',
    titulo: 'Metodos de pagamento',
    icone: 'pagamento'
  },
  {
    id: 'prazosPagamento',
    titulo: 'Prazos de pagamento',
    icone: 'pagamento'
  },
  {
    id: 'locaisAgenda',
    titulo: 'Locais da agenda',
    icone: 'empresa'
  },
  {
    id: 'tiposRecurso',
    titulo: 'Tipos de recurso',
    icone: 'cadastro'
  },
  {
    id: 'recursos',
    titulo: 'Recursos',
    icone: 'caixa'
  },
  {
    id: 'tiposAgenda',
    titulo: 'Tipos de agenda',
    icone: 'orcamento'
  },
  {
    id: 'canaisAtendimento',
    titulo: 'Canais de atendimento',
    icone: 'mensagem'
  },
  {
    id: 'origensAtendimento',
    titulo: 'Origens de atendimento',
    icone: 'empresa'
  },
  {
    id: 'statusVisita',
    titulo: 'Status da agenda',
    icone: 'cadastro'
  },
  {
    id: 'motivosPerda',
    titulo: 'Motivos da perda',
    icone: 'cadastro'
  },
  {
    id: 'orcamentos',
    titulo: 'Campos do orcamento',
    icone: 'orcamento'
  },
  {
    id: 'pedidos',
    titulo: 'Campos do pedido',
    icone: 'pedido'
  },
  {
    id: 'etapasPedido',
    titulo: 'Etapas do pedido',
    icone: 'orcamento'
  },
  {
    id: 'etapasOrcamento',
    titulo: 'Etapas do orcamento',
    icone: 'orcamento'
  },
  {
    id: 'tamanhos',
    titulo: 'Tamanhos',
    icone: 'tamanho'
  },
  {
    id: 'unidadesMedida',
    titulo: 'Unidades',
    icone: 'medida'
  },
  {
    id: 'atualizacaoSistema',
    titulo: 'Atualizacao do sistema',
    icone: 'importar'
  }
];

const secoesConfiguracao = [
  {
    id: 'gerais',
    titulo: 'Gerais',
    atalhos: ['empresa', 'usuarios', 'vendedores', 'atualizacaoSistema']
  },
  {
    id: 'paginaInicial',
    titulo: 'Pagina inicial',
    atalhos: []
  },
  {
    id: 'agenda',
    titulo: 'Agenda',
    atalhos: ['locaisAgenda', 'tiposRecurso', 'recursos', 'tiposAgenda', 'statusVisita']
  },
  {
    id: 'atendimentos',
    titulo: 'Atendimentos',
    atalhos: ['canaisAtendimento', 'origensAtendimento']
  },
  {
    id: 'cadastros',
    titulo: 'Cadastros',
    atalhos: [
      'ramosAtividade',
      'gruposProduto',
      'marcas',
      'unidadesMedida',
      'tamanhos'
    ]
  },
  {
    id: 'orcamentosPedidos',
    titulo: 'Orcamentos/Pedidos',
    atalhos: atalhosConfiguracao
      .map((atalho) => atalho.id)
      .filter((id) => ![
        'empresa',
        'usuarios',
        'vendedores',
        'locaisAgenda',
        'tiposRecurso',
        'recursos',
        'tiposAgenda',
        'statusVisita',
        'canaisAtendimento',
        'origensAtendimento',
        'ramosAtividade',
        'gruposProduto',
        'marcas',
        'atualizacaoSistema',
        'unidadesMedida',
        'tamanhos'
      ].includes(id))
  }
];
const IDS_STATUS_VISITA_CRITICOS = new Set([1, 2, 3, 4, 5]);
const IDS_ETAPAS_ORCAMENTO_OBRIGATORIAS = new Set([1, 2, 3]);

function statusVisitaEhCritico(registro) {
  const idStatusVisita = Number(registro?.idStatusVisita);
  return Number.isFinite(idStatusVisita) && IDS_STATUS_VISITA_CRITICOS.has(idStatusVisita);
}

function etapaOrcamentoEhObrigatoria(registro) {
  const idEtapaOrcamento = Number(registro?.idEtapaOrcamento);
  return Number.isFinite(idEtapaOrcamento) && IDS_ETAPAS_ORCAMENTO_OBRIGATORIAS.has(idEtapaOrcamento);
}

export function PaginaConfiguracoes({ usuarioLogado }) {
  const [empresa, definirEmpresa] = useState(null);
  const [usuarios, definirUsuarios] = useState([]);
  const [gruposProduto, definirGruposProduto] = useState([]);
  const [marcas, definirMarcas] = useState([]);
  const [ramosAtividade, definirRamosAtividade] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [unidadesMedida, definirUnidadesMedida] = useState([]);
  const [metodosPagamento, definirMetodosPagamento] = useState([]);
  const [prazosPagamento, definirPrazosPagamento] = useState([]);
  const [locaisAgenda, definirLocaisAgenda] = useState([]);
  const [tiposRecurso, definirTiposRecurso] = useState([]);
  const [recursos, definirRecursos] = useState([]);
  const [tiposAgenda, definirTiposAgenda] = useState([]);
  const [canaisAtendimento, definirCanaisAtendimento] = useState([]);
  const [origensAtendimento, definirOrigensAtendimento] = useState([]);
  const [statusVisita, definirStatusVisita] = useState([]);
  const [motivosPerda, definirMotivosPerda] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [etapasOrcamento, definirEtapasOrcamento] = useState([]);
  const [camposOrcamento, definirCamposOrcamento] = useState([]);
  const [camposPedido, definirCamposPedido] = useState([]);
  const [tamanhos, definirTamanhos] = useState([]);
  const [configuracaoAtualizacaoSistema, definirConfiguracaoAtualizacaoSistema] = useState(null);
  const [modalEmpresaAberto, definirModalEmpresaAberto] = useState(false);
  const [modalUsuariosAberto, definirModalUsuariosAberto] = useState(false);
  const [modalAtualizacaoSistemaAberto, definirModalAtualizacaoSistemaAberto] = useState(false);
  const [cadastroConfiguracaoAberto, definirCadastroConfiguracaoAberto] = useState(null);
  const [modoModalEmpresa, definirModoModalEmpresa] = useState('edicao');
  const usuarioSomenteConsulta = usuarioLogado?.tipo === 'Usuario padrao';
  const usuarioAdministrador = usuarioLogado?.tipo === 'Administrador';

  useEffect(() => {
    carregarEmpresa();
    carregarCadastrosConfiguracao();
    carregarConfiguracaoAtualizacaoSistema();
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [vendedores]);

  async function carregarEmpresa() {
    const empresas = await listarEmpresas();
    definirEmpresa(empresas[0] || null);
  }

  async function salvarEmpresa(dadosEmpresa) {
    const payload = normalizarPayloadEmpresa(dadosEmpresa);

    if (empresa?.idEmpresa) {
      await atualizarEmpresa(empresa.idEmpresa, payload);
    } else {
      await incluirEmpresa(payload);
    }

    await carregarEmpresa();
    window.dispatchEvent(new CustomEvent('empresa-atualizada'));
    definirModalEmpresaAberto(false);
    definirModoModalEmpresa('edicao');
  }

  async function carregarUsuarios() {
    const usuariosCarregados = await listarUsuarios();
    const vendedoresPorId = new Map(
      vendedores.map((vendedor) => [vendedor.idVendedor, vendedor.nome])
    );

    definirUsuarios(
      usuariosCarregados.map((usuario) => ({
        ...usuario,
        nomeVendedor: vendedoresPorId.get(usuario.idVendedor) || ''
      }))
    );
  }

  async function carregarConfiguracaoAtualizacaoSistema() {
    try {
      const configuracao = await obterConfiguracaoAtualizacaoSistema();
      definirConfiguracaoAtualizacaoSistema(configuracao);
    } catch (_erro) {
      definirConfiguracaoAtualizacaoSistema(null);
    }
  }

  async function carregarCadastrosConfiguracao() {
    const resultados = await Promise.allSettled([
      listarGruposProdutoConfiguracao(),
      listarMarcasConfiguracao(),
      listarRamosAtividadeConfiguracao(),
      listarVendedoresConfiguracao(),
      listarUnidadesMedidaConfiguracao(),
      listarMetodosPagamentoConfiguracao(),
      listarPrazosPagamentoConfiguracao(),
      listarLocaisAgendaConfiguracao(),
      listarTiposRecursoConfiguracao(),
      listarRecursosConfiguracao(),
      listarTiposAgendaConfiguracao(),
      listarCanaisAtendimentoConfiguracao(),
      listarOrigensAtendimentoConfiguracao(),
        listarStatusVisitaConfiguracao(),
        listarMotivosPerdaConfiguracao(),
        listarEtapasPedidoConfiguracao(),
        listarEtapasOrcamentoConfiguracao(),
        listarCamposOrcamentoConfiguracao(),
        listarCamposPedidoConfiguracao(),
        listarTamanhosConfiguracao()
      ]);

    definirGruposProduto(obterResultadoLista(resultados[0]));
    definirMarcas(obterResultadoLista(resultados[1]));
    definirRamosAtividade(obterResultadoLista(resultados[2]));
    definirVendedores(obterResultadoLista(resultados[3]));
    definirUnidadesMedida(obterResultadoLista(resultados[4]));
    definirMetodosPagamento(obterResultadoLista(resultados[5]));
    definirPrazosPagamento(obterResultadoLista(resultados[6]));
    definirLocaisAgenda(obterResultadoLista(resultados[7]));
    definirTiposRecurso(obterResultadoLista(resultados[8]));
    definirRecursos(obterResultadoLista(resultados[9]));
    definirTiposAgenda(ordenarRegistrosPorOrdem(obterResultadoLista(resultados[10]), 'idTipoAgenda'));
    definirCanaisAtendimento(obterResultadoLista(resultados[11]));
    definirOrigensAtendimento(obterResultadoLista(resultados[12]));
    definirStatusVisita(ordenarRegistrosPorOrdem(obterResultadoLista(resultados[13]), 'idStatusVisita'));
    definirMotivosPerda(obterResultadoLista(resultados[14]));
    definirEtapasPedido(ordenarRegistrosPorOrdem(obterResultadoLista(resultados[15]), 'idEtapa'));
    definirEtapasOrcamento(ordenarRegistrosPorOrdem(obterResultadoLista(resultados[16]), 'idEtapaOrcamento'));
    definirCamposOrcamento(obterResultadoLista(resultados[17]));
    definirCamposPedido(obterResultadoLista(resultados[18]));
    definirTamanhos(obterResultadoLista(resultados[19]));
  }

  async function salvarUsuario(dadosUsuario) {
    if (dadosUsuario.tipo === 'Usuario padrao' && dadosUsuario.idVendedor) {
      const vendedorAtivo = vendedores.find(
        (vendedor) => String(vendedor.idVendedor) === String(dadosUsuario.idVendedor) && vendedor.status
      );

      if (!vendedorAtivo) {
        throw new Error('Selecione um vendedor ativo para vincular ao usuario.');
      }
    }

    const payload = normalizarPayloadUsuario(dadosUsuario);

    if (dadosUsuario.idUsuario) {
      await atualizarUsuario(dadosUsuario.idUsuario, payload);
    } else {
      await incluirUsuario(payload);
    }

    await carregarUsuarios();
  }

  async function inativarUsuario(usuario) {
    await atualizarUsuario(usuario.idUsuario, { ativo: 0 });
    await carregarUsuarios();
  }

  async function salvarGrupoProduto(dadosGrupo) {
    const payload = {
      descricao: dadosGrupo.descricao.trim(),
      status: dadosGrupo.status ? 1 : 0
    };

    let grupoSalvo = null;

    if (dadosGrupo.idGrupo) {
      grupoSalvo = await atualizarGrupoProduto(dadosGrupo.idGrupo, payload);
    } else {
      grupoSalvo = await incluirGrupoProduto(payload);
    }

    await carregarCadastrosConfiguracao();
    return grupoSalvo;
  }

  async function salvarTamanho(dadosTamanho) {
    const payload = {
      descricao: dadosTamanho.descricao.trim(),
      status: dadosTamanho.status ? 1 : 0
    };

    if (dadosTamanho.idTamanho) {
      await atualizarTamanho(dadosTamanho.idTamanho, payload);
    } else {
      await incluirTamanho(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function inativarTamanho(registro) {
    await atualizarTamanho(registro.idTamanho, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function salvarMarca(dadosMarca) {
    const payload = {
      descricao: dadosMarca.descricao.trim(),
      status: dadosMarca.status ? 1 : 0
    };

    if (dadosMarca.idMarca) {
      await atualizarMarca(dadosMarca.idMarca, payload);
    } else {
      await incluirMarca(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarRamoAtividade(dadosRamo) {
    const payload = {
      descricao: dadosRamo.descricao.trim(),
      status: dadosRamo.status ? 1 : 0
    };

    if (dadosRamo.idRamo) {
      await atualizarRamoAtividade(dadosRamo.idRamo, payload);
    } else {
      await incluirRamoAtividade(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarVendedor(dadosVendedor) {
    const payload = {
      nome: dadosVendedor.nome.trim(),
      email: dadosVendedor.email.trim(),
      comissaoPadrao: normalizarNumeroDecimal(dadosVendedor.comissaoPadrao),
      status: dadosVendedor.status ? 1 : 0
    };

    if (dadosVendedor.idVendedor) {
      await atualizarVendedor(dadosVendedor.idVendedor, payload);
    } else {
      await incluirVendedor(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarUnidadeMedida(dadosUnidade) {
    const payload = {
      descricao: dadosUnidade.descricao.trim(),
      status: dadosUnidade.status ? 1 : 0
    };

    if (dadosUnidade.idUnidade) {
      await atualizarUnidadeMedida(dadosUnidade.idUnidade, payload);
    } else {
      await incluirUnidadeMedida(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarMetodoPagamento(dadosMetodo) {
    const payload = {
      descricao: dadosMetodo.descricao.trim(),
      status: dadosMetodo.status ? 1 : 0
    };

    if (dadosMetodo.idMetodoPagamento) {
      await atualizarMetodoPagamento(dadosMetodo.idMetodoPagamento, payload);
    } else {
      await incluirMetodoPagamento(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarPrazoPagamento(dadosPrazo) {
    const payload = normalizarPayloadPrazoPagamento(dadosPrazo);

    if (dadosPrazo.idPrazoPagamento) {
      await atualizarPrazoPagamento(dadosPrazo.idPrazoPagamento, payload);
    } else {
      await incluirPrazoPagamento(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarMotivoPerda(dadosMotivo) {
    const payload = {
      descricao: dadosMotivo.descricao.trim(),
      status: dadosMotivo.status ? 1 : 0
    };

    if (dadosMotivo.idMotivo) {
      await atualizarMotivoPerda(dadosMotivo.idMotivo, payload);
    } else {
      await incluirMotivoPerda(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarLocalAgenda(dadosLocal) {
    const payload = {
      descricao: dadosLocal.descricao.trim(),
      status: dadosLocal.status ? 1 : 0
    };

    if (dadosLocal.idLocal) {
      await atualizarLocalAgenda(dadosLocal.idLocal, payload);
    } else {
      await incluirLocalAgenda(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarTipoRecurso(dadosTipoRecurso) {
    const payload = {
      descricao: dadosTipoRecurso.descricao.trim(),
      status: dadosTipoRecurso.status ? 1 : 0
    };

    if (dadosTipoRecurso.idTipoRecurso) {
      await atualizarTipoRecurso(dadosTipoRecurso.idTipoRecurso, payload);
    } else {
      await incluirTipoRecurso(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarRecurso(dadosRecurso) {
    const payload = {
      descricao: dadosRecurso.descricao.trim(),
      idTipoRecurso: Number(dadosRecurso.idTipoRecurso),
      status: dadosRecurso.status ? 1 : 0
    };

    if (dadosRecurso.idRecurso) {
      await atualizarRecurso(dadosRecurso.idRecurso, payload);
    } else {
      await incluirRecurso(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarTipoAgenda(dadosTipoAgenda) {
    const payload = {
      descricao: dadosTipoAgenda.descricao.trim(),
      cor: dadosTipoAgenda.cor.trim(),
      ordem: normalizarOrdemCadastro(dadosTipoAgenda.ordem),
      obrigarCliente: dadosTipoAgenda.obrigarCliente ? 1 : 0,
      obrigarLocal: dadosTipoAgenda.obrigarLocal ? 1 : 0,
      obrigarRecurso: dadosTipoAgenda.obrigarRecurso ? 1 : 0,
      status: dadosTipoAgenda.status ? 1 : 0
    };

    if (dadosTipoAgenda.idTipoAgenda) {
      await atualizarTipoAgenda(dadosTipoAgenda.idTipoAgenda, payload);
    } else {
      await incluirTipoAgenda(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarStatusVisita(dadosStatusVisita) {
    const payload = {
      descricao: dadosStatusVisita.descricao.trim(),
      icone: limparTextoOpcional(dadosStatusVisita.icone),
      ordem: normalizarOrdemCadastro(dadosStatusVisita.ordem),
      status: dadosStatusVisita.status ? 1 : 0
    };

    if (dadosStatusVisita.idStatusVisita) {
      await atualizarStatusVisita(dadosStatusVisita.idStatusVisita, payload);
    } else {
      await incluirStatusVisita(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarCanalAtendimento(dadosCanalAtendimento) {
    const payload = {
      descricao: dadosCanalAtendimento.descricao.trim(),
      status: dadosCanalAtendimento.status ? 1 : 0
    };

    if (dadosCanalAtendimento.idCanalAtendimento) {
      await atualizarCanalAtendimento(dadosCanalAtendimento.idCanalAtendimento, payload);
    } else {
      await incluirCanalAtendimento(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarOrigemAtendimento(dadosOrigemAtendimento) {
    const payload = {
      descricao: dadosOrigemAtendimento.descricao.trim(),
      status: dadosOrigemAtendimento.status ? 1 : 0
    };

    if (dadosOrigemAtendimento.idOrigemAtendimento) {
      await atualizarOrigemAtendimento(dadosOrigemAtendimento.idOrigemAtendimento, payload);
    } else {
      await incluirOrigemAtendimento(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarEtapaPedido(dadosEtapa) {
    const payload = {
      descricao: dadosEtapa.descricao.trim(),
      cor: dadosEtapa.cor.trim(),
      ordem: normalizarOrdemCadastro(dadosEtapa.ordem),
      status: dadosEtapa.status ? 1 : 0
    };

    if (dadosEtapa.idEtapa) {
      await atualizarEtapaPedido(dadosEtapa.idEtapa, payload);
    } else {
      await incluirEtapaPedido(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarEtapaOrcamento(dadosEtapa) {
    const payload = {
      descricao: dadosEtapa.descricao.trim(),
      cor: dadosEtapa.cor.trim(),
      ordem: normalizarOrdemCadastro(dadosEtapa.ordem),
      obrigarMotivoPerda: dadosEtapa.obrigarMotivoPerda ? 1 : 0,
      consideraFunilVendas: dadosEtapa.consideraFunilVendas ? 1 : 0,
      status: dadosEtapa.status ? 1 : 0
    };

    if (dadosEtapa.idEtapaOrcamento) {
      await atualizarEtapaOrcamento(dadosEtapa.idEtapaOrcamento, payload);
    } else {
      await incluirEtapaOrcamento(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarCampoOrcamento(dadosCampo) {
    const payload = {
      titulo: dadosCampo.titulo.trim(),
      descricaoPadrao: limparTextoOpcional(dadosCampo.descricaoPadrao),
      status: dadosCampo.status ? 1 : 0
    };

    if (dadosCampo.idCampoOrcamento) {
      await atualizarCampoOrcamento(dadosCampo.idCampoOrcamento, payload);
    } else {
      await incluirCampoOrcamento(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function salvarCampoPedido(dadosCampo) {
    const payload = {
      titulo: dadosCampo.titulo.trim(),
      descricaoPadrao: limparTextoOpcional(dadosCampo.descricaoPadrao),
      status: dadosCampo.status ? 1 : 0
    };

    if (dadosCampo.idCampoPedido) {
      await atualizarCampoPedido(dadosCampo.idCampoPedido, payload);
    } else {
      await incluirCampoPedido(payload);
    }

    await carregarCadastrosConfiguracao();
  }

  async function inativarGrupoProduto(registro) {
    await atualizarGrupoProduto(registro.idGrupo, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarMarca(registro) {
    await atualizarMarca(registro.idMarca, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarRamoAtividade(registro) {
    await atualizarRamoAtividade(registro.idRamo, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarVendedor(registro) {
    await atualizarVendedor(registro.idVendedor, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarUnidadeMedida(registro) {
    await atualizarUnidadeMedida(registro.idUnidade, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarMetodoPagamento(registro) {
    await atualizarMetodoPagamento(registro.idMetodoPagamento, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarPrazoPagamento(registro) {
    await atualizarPrazoPagamento(registro.idPrazoPagamento, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarMotivoPerda(registro) {
    await atualizarMotivoPerda(registro.idMotivo, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarLocalAgenda(registro) {
    await atualizarLocalAgenda(registro.idLocal, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarTipoRecurso(registro) {
    await atualizarTipoRecurso(registro.idTipoRecurso, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarRecurso(registro) {
    await atualizarRecurso(registro.idRecurso, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarTipoAgenda(registro) {
    await atualizarTipoAgenda(registro.idTipoAgenda, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarStatusVisita(registro) {
    await atualizarStatusVisita(registro.idStatusVisita, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarCanalAtendimento(registro) {
    await atualizarCanalAtendimento(registro.idCanalAtendimento, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarOrigemAtendimento(registro) {
    await atualizarOrigemAtendimento(registro.idOrigemAtendimento, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarEtapaPedido(registro) {
    await atualizarEtapaPedido(registro.idEtapa, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarEtapaOrcamento(registro) {
    await atualizarEtapaOrcamento(registro.idEtapaOrcamento, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function inativarCampoOrcamento(registro) {
    await atualizarCampoOrcamento(registro.idCampoOrcamento, { status: 0 });
    await carregarCadastrosConfiguracao();
  }

  async function salvarAtualizacaoSistema(dadosAtualizacao) {
    const configuracaoSalva = await salvarConfiguracaoAtualizacaoSistema({
      urlRepositorio: String(dadosAtualizacao.urlRepositorio || '').trim()
    });

    definirConfiguracaoAtualizacaoSistema(configuracaoSalva);
  }

  function abrirConfiguracao(atalho) {
    if (usuarioSomenteConsulta && ['empresa', 'usuarios'].includes(atalho.id)) {
      return;
    }

    if (atalho.id === 'empresa') {
      definirModoModalEmpresa(usuarioSomenteConsulta ? 'consulta' : 'edicao');
      definirModalEmpresaAberto(true);
      return;
    }

    if (atalho.id === 'usuarios') {
      definirModalUsuariosAberto(true);
      return;
    }

    if (atalho.id === 'atualizacaoSistema') {
      if (!usuarioAdministrador) {
        return;
      }

      definirModalAtualizacaoSistemaAberto(true);
      return;
    }

    if ([
      'gruposProduto',
      'etapasPedido',
      'etapasOrcamento',
      'marcas',
      'metodosPagamento',
      'motivosPerda',
      'locaisAgenda',
      'orcamentos',
      'pedidos',
      'prazosPagamento',
      'recursos',
      'ramosAtividade',
      'canaisAtendimento',
      'origensAtendimento',
      'statusVisita',
      'tiposAgenda',
      'tiposRecurso',
      'vendedores',
      'unidadesMedida',
      'tamanhos'
    ].includes(atalho.id)) {
      definirCadastroConfiguracaoAberto(atalho.id);
    }
  }

  function fecharModalEmpresa() {
    definirModalEmpresaAberto(false);
    definirModoModalEmpresa('edicao');
  }

  function fecharModalUsuarios() {
    definirModalUsuariosAberto(false);
  }

  function fecharModalAtualizacaoSistema() {
    definirModalAtualizacaoSistemaAberto(false);
  }

  function fecharCadastroConfiguracao() {
    definirCadastroConfiguracaoAberto(null);
  }

  function obterAtalhosSecao(secao) {
    return secao.atalhos
      .map((idAtalho) => atalhosConfiguracao.find((item) => item.id === idAtalho))
      .filter(Boolean)
      .filter((atalho) => atalho.id !== 'atualizacaoSistema' || usuarioAdministrador);
  }

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Configuracoes</h1>
          <p>Cadastros base e parametros para manter o CRM organizado.</p>
        </div>
      </header>

      <CorpoPagina>
        <div className="secoesConfiguracao">
          {secoesConfiguracao.map((secao) => {
            const atalhosSecao = obterAtalhosSecao(secao);

            return (
              <section key={secao.id} className="secaoConfiguracao" aria-label={secao.titulo}>
                <header className="cabecalhoSecaoConfiguracao">
                  <h2>{secao.titulo}</h2>
                </header>

                {atalhosSecao.length > 0 ? (
                  <div className="gradeConfiguracoes">
                    {atalhosSecao.map((atalho) => (
                      <button
                        key={atalho.id}
                        type="button"
                        className="cartaoConfiguracao"
                        title={atalho.titulo}
                        disabled={usuarioSomenteConsulta && ['empresa', 'usuarios'].includes(atalho.id)}
                        onClick={() => abrirConfiguracao(atalho)}
                      >
                        <span className="iconeCartaoConfiguracao" aria-hidden="true">
                          <span className="circuloIconeConfiguracao">
                            <Icone nome={atalho.icone} />
                          </span>
                        </span>

                        <span className="conteudoCartaoConfiguracao">
                          <strong>{atalho.titulo}</strong>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="secaoConfiguracaoVazia">
                    Nenhum item configurado nesta secao por enquanto.
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </CorpoPagina>

      <ModalEmpresa
        aberto={modalEmpresaAberto}
        empresa={empresa}
        etapasOrcamento={etapasOrcamento}
        modo={modoModalEmpresa}
        aoFechar={fecharModalEmpresa}
        aoSalvar={salvarEmpresa}
      />
      <ModalUsuarios
        aberto={modalUsuariosAberto}
        usuarios={usuarios}
        vendedores={vendedores}
        somenteConsulta={usuarioSomenteConsulta}
        aoFechar={fecharModalUsuarios}
        aoSalvar={salvarUsuario}
        aoInativar={inativarUsuario}
      />
      <ModalAtualizacaoSistema
        aberto={modalAtualizacaoSistemaAberto}
        configuracao={configuracaoAtualizacaoSistema}
        aoFechar={fecharModalAtualizacaoSistema}
        aoSalvar={salvarAtualizacaoSistema}
      />
        <ModalGruposProduto
          aberto={cadastroConfiguracaoAberto === 'gruposProduto'}
          registros={gruposProduto}
          somenteConsulta={usuarioSomenteConsulta}
          aoFechar={fecharCadastroConfiguracao}
          aoSalvar={salvarGrupoProduto}
          aoInativar={inativarGrupoProduto}
        />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'tamanhos'}
        titulo="Tamanhos"
        rotuloIncluir="Incluir tamanho"
        registros={tamanhos}
        chavePrimaria="idTamanho"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Tamanho' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Tamanho', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarTamanho}
        aoInativar={inativarTamanho}
      />
      <ModalMarcas
        aberto={cadastroConfiguracaoAberto === 'marcas'}
        registros={marcas}
        somenteConsulta={usuarioSomenteConsulta}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarMarca}
        aoInativar={inativarMarca}
      />
      <ModalRamosAtividade
        aberto={cadastroConfiguracaoAberto === 'ramosAtividade'}
        registros={ramosAtividade}
        somenteConsulta={usuarioSomenteConsulta}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarRamoAtividade}
        aoInativar={inativarRamoAtividade}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'vendedores'}
        titulo="Vendedores"
        rotuloIncluir="Incluir vendedor"
        registros={vendedores}
        chavePrimaria="idVendedor"
        exibirConsulta={false}
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'nome', label: 'Nome' },
          { key: 'email', label: 'E-mail' },
          { key: 'comissaoPadrao', label: 'Comissao', render: (registro) => formatarPercentual(registro.comissaoPadrao) }
        ]}
        camposFormulario={[
          { name: 'nome', label: 'Nome', required: true },
          { name: 'email', label: 'E-mail', type: 'email', required: true },
          { name: 'comissaoPadrao', label: 'Comissao padrao (%)', type: 'number', defaultValue: '0' },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarVendedor}
        aoInativar={inativarVendedor}
      />
      <ModalUnidadesMedida
        aberto={cadastroConfiguracaoAberto === 'unidadesMedida'}
        registros={unidadesMedida}
        somenteConsulta={usuarioSomenteConsulta}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarUnidadeMedida}
        aoInativar={inativarUnidadeMedida}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'metodosPagamento'}
        titulo="Metodos de pagamento"
        rotuloIncluir="Incluir metodo"
        registros={metodosPagamento}
        chavePrimaria="idMetodoPagamento"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarMetodoPagamento}
        aoInativar={inativarMetodoPagamento}
      />
      <ModalPrazosPagamento
        aberto={cadastroConfiguracaoAberto === 'prazosPagamento'}
        prazosPagamento={enriquecerPrazosPagamento(prazosPagamento, metodosPagamento)}
        metodosPagamento={metodosPagamento}
        somenteConsulta={usuarioSomenteConsulta}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarPrazoPagamento}
        aoInativar={inativarPrazoPagamento}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'locaisAgenda'}
        titulo="Locais da agenda"
        rotuloIncluir="Incluir local"
        registros={locaisAgenda}
        chavePrimaria="idLocal"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarLocalAgenda}
        aoInativar={inativarLocalAgenda}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'tiposRecurso'}
        titulo="Tipos de recurso"
        rotuloIncluir="Incluir tipo"
        registros={tiposRecurso}
        chavePrimaria="idTipoRecurso"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarTipoRecurso}
        aoInativar={inativarTipoRecurso}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'recursos'}
        titulo="Recursos"
        rotuloIncluir="Incluir recurso"
        registros={enriquecerRecursos(recursos, tiposRecurso)}
        chavePrimaria="idRecurso"
        classeTabela="tabelaRecursosConfiguracao"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' },
          { key: 'nomeTipoRecurso', label: 'Tipo' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          {
            name: 'idTipoRecurso',
            label: 'Tipo de recurso',
            type: 'select',
            required: true,
            options: tiposRecurso.map((tipoRecurso) => ({
              valor: tipoRecurso.idTipoRecurso,
              label: tipoRecurso.descricao
            }))
          },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarRecurso}
        aoInativar={inativarRecurso}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'tiposAgenda'}
        titulo="Tipos de agenda"
        rotuloIncluir="Incluir tipo"
        registros={tiposAgenda}
        chavePrimaria="idTipoAgenda"
        classeTabela="tabelaEtapasPedido"
        classeFormulario="gradeFormularioTiposAgenda"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'ordem', label: 'Ordem' },
          { key: 'descricao', label: 'Descricao' },
          { key: 'cor', label: 'Cor', render: renderizarCorConfiguracao },
          { key: 'obrigatorios', label: 'Obrigatorios', render: renderizarObrigatoriosTipoAgenda }
        ]}
        camposFormulario={[
          { name: 'ordem', label: 'Ordem', type: 'number', required: true, defaultValue: 1, min: 1, max: 999, step: 1, inputMode: 'numeric' },
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'cor', label: 'Cor', type: 'color', required: true, defaultValue: '#0B74D1' },
          { name: 'obrigarCliente', label: 'Exigir cliente', type: 'checkbox', defaultValue: false },
          { name: 'obrigarLocal', label: 'Exigir local', type: 'checkbox', defaultValue: false },
          { name: 'obrigarRecurso', label: 'Exigir recurso', type: 'checkbox', defaultValue: false },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarTipoAgenda}
        aoInativar={inativarTipoAgenda}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'canaisAtendimento'}
        titulo="Canais de atendimento"
        rotuloIncluir="Incluir canal"
        registros={canaisAtendimento}
        chavePrimaria="idCanalAtendimento"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarCanalAtendimento}
        aoInativar={inativarCanalAtendimento}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'origensAtendimento'}
        titulo="Origens de atendimento"
        rotuloIncluir="Incluir origem"
        registros={origensAtendimento}
        chavePrimaria="idOrigemAtendimento"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarOrigemAtendimento}
        aoInativar={inativarOrigemAtendimento}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'statusVisita'}
        titulo="Status da visita"
        rotuloIncluir="Incluir status"
        registros={statusVisita}
        chavePrimaria="idStatusVisita"
        classeTabela="tabelaStatusVisitaConfiguracao"
        classeFormulario="gradeFormularioStatusVisita"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'ordem', label: 'Ordem' },
          { key: 'icone', label: 'Icone' },
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'ordem', label: 'Ordem', type: 'number', required: true, defaultValue: 1, min: 1, max: 999, step: 1, inputMode: 'numeric' },
          { name: 'icone', label: 'Icone', required: false },
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarStatusVisita}
        aoInativar={inativarStatusVisita}
        podeInativarRegistro={(registro) => !statusVisitaEhCritico(registro)}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'motivosPerda'}
        titulo="Motivos da perda"
        rotuloIncluir="Incluir motivo"
        registros={motivosPerda}
        chavePrimaria="idMotivo"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarMotivoPerda}
        aoInativar={inativarMotivoPerda}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'etapasPedido'}
        titulo="Etapas do pedido"
        rotuloIncluir="Incluir etapa"
        registros={etapasPedido}
        chavePrimaria="idEtapa"
        classeTabela="tabelaEtapasPedido"
        classeFormulario="gradeFormularioEtapasPedidoLinha"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'ordem', label: 'Ordem' },
          { key: 'descricao', label: 'Descricao' },
          { key: 'cor', label: 'Cor', render: renderizarCorConfiguracao }
        ]}
        camposFormulario={[
          { name: 'ordem', label: 'Ordem', type: 'number', required: true, defaultValue: 1, min: 1, max: 999, step: 1, inputMode: 'numeric' },
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'cor', label: 'Cor', type: 'color', required: true, defaultValue: '#0B74D1' },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarEtapaPedido}
        aoInativar={inativarEtapaPedido}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'etapasOrcamento'}
        titulo="Etapas do orcamento"
        rotuloIncluir="Incluir etapa"
        registros={etapasOrcamento}
        chavePrimaria="idEtapaOrcamento"
        classeModal="modalClienteEtapasOrcamentoAmplo"
        classeTabela="tabelaEtapasOrcamentoConfiguracao"
        classeFormulario="gradeFormularioEtapasOrcamentoLinha"
        classeModalFormulario="modalContatoEtapasOrcamentoLinha"
        agruparCheckboxes
        classeGrupoCheckboxes="grupoCheckboxesEtapasOrcamento"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'ordem', label: 'Ordem' },
          { key: 'descricao', label: 'Descricao' },
          { key: 'cor', label: 'Cor', render: renderizarCorConfiguracao },
          {
            key: 'obrigarMotivoPerda',
            label: 'Motivo da perda',
            render: (registro) => registro.obrigarMotivoPerda ? 'Obrigatorio' : 'Opcional'
          },
          {
            key: 'consideraFunilVendas',
            label: 'Funil de vendas',
            render: (registro) => registro.consideraFunilVendas ? 'Considera' : 'Nao considera'
          }
        ]}
        camposFormulario={[
          { name: 'ordem', label: 'Ordem', type: 'number', required: true, defaultValue: 1, min: 1, max: 999, step: 1, inputMode: 'numeric' },
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'cor', label: 'Cor', type: 'color', required: true, defaultValue: '#0B74D1' },
          { name: 'obrigarMotivoPerda', label: 'Exigir motivo da perda', type: 'checkbox', defaultValue: false },
          { name: 'consideraFunilVendas', label: 'Considera no Funil de Vendas', type: 'checkbox', defaultValue: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarEtapaOrcamento}
        aoInativar={inativarEtapaOrcamento}
        podeInativarRegistro={(registro) => !etapaOrcamentoEhObrigatoria(registro)}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'orcamentos'}
        titulo="Campos do orcamento"
        rotuloIncluir="Incluir campo"
        registros={camposOrcamento}
        chavePrimaria="idCampoOrcamento"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'titulo', label: 'Titulo' }
        ]}
        camposFormulario={[
          { name: 'titulo', label: 'Titulo', required: true },
          { name: 'descricaoPadrao', label: 'Descricao padrao', type: 'textarea', required: false },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarCampoOrcamento}
        aoInativar={inativarCampoOrcamento}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'pedidos'}
        titulo="Campos do pedido"
        rotuloIncluir="Incluir campo"
        registros={camposPedido}
        chavePrimaria="idCampoPedido"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'titulo', label: 'Titulo' }
        ]}
        camposFormulario={[
          { name: 'titulo', label: 'Titulo', required: true },
          { name: 'descricaoPadrao', label: 'Descricao padrao', type: 'textarea', required: false },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarCampoPedido}
        aoInativar={async (registro) => {
          await atualizarCampoPedido(registro.idCampoPedido, { status: 0 });
          await carregarCadastrosConfiguracao();
        }}
      />
    </>
  );
}

function normalizarPayloadEmpresa(dadosEmpresa) {
  return {
    razaoSocial: dadosEmpresa.razaoSocial.trim(),
    nomeFantasia: dadosEmpresa.nomeFantasia.trim(),
    slogan: limparTextoOpcional(dadosEmpresa.slogan),
    tipo: dadosEmpresa.tipo.trim(),
    cnpj: dadosEmpresa.cnpj.trim(),
    inscricaoEstadual: limparTextoOpcional(dadosEmpresa.inscricaoEstadual),
    email: limparTextoOpcional(dadosEmpresa.email),
    telefone: limparTextoOpcional(normalizarTelefone(dadosEmpresa.telefone)),
    horaInicioManha: limparTextoOpcional(dadosEmpresa.horaInicioManha),
    horaFimManha: limparTextoOpcional(dadosEmpresa.horaFimManha),
    horaInicioTarde: limparTextoOpcional(dadosEmpresa.horaInicioTarde),
    horaFimTarde: limparTextoOpcional(dadosEmpresa.horaFimTarde),
    trabalhaSabado: dadosEmpresa.trabalhaSabado ? 1 : 0,
    horaInicioSabado: dadosEmpresa.trabalhaSabado ? limparTextoOpcional(dadosEmpresa.horaInicioSabado) : null,
    horaFimSabado: dadosEmpresa.trabalhaSabado ? limparTextoOpcional(dadosEmpresa.horaFimSabado) : null,
    diasValidadeOrcamento: normalizarNumeroInteiro(dadosEmpresa.diasValidadeOrcamento, 7),
    diasEntregaPedido: normalizarNumeroInteiro(dadosEmpresa.diasEntregaPedido, 7),
    etapasFiltroPadraoOrcamento: JSON.stringify(
      Array.isArray(dadosEmpresa.etapasFiltroPadraoOrcamento)
        ? dadosEmpresa.etapasFiltroPadraoOrcamento.map(String)
        : []
    ),
    logradouro: limparTextoOpcional(dadosEmpresa.logradouro),
    numero: limparTextoOpcional(dadosEmpresa.numero),
    complemento: limparTextoOpcional(dadosEmpresa.complemento),
    bairro: limparTextoOpcional(dadosEmpresa.bairro),
    cidade: limparTextoOpcional(dadosEmpresa.cidade),
    estado: limparTextoOpcional(dadosEmpresa.estado)?.toUpperCase(),
    cep: limparTextoOpcional(dadosEmpresa.cep),
    imagem: limparTextoOpcional(dadosEmpresa.imagem)
  };
}

function limparTextoOpcional(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
}

function normalizarNumeroInteiro(valor, valorPadrao = 0) {
  const numero = Number(String(valor ?? '').trim());
  return Number.isNaN(numero) ? valorPadrao : numero;
}

function normalizarOrdemCadastro(valor) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10);

  if (Number.isNaN(numero) || numero < 1) {
    return 1;
  }

  return numero;
}

function normalizarPayloadUsuario(dadosUsuario) {
  return {
    nome: dadosUsuario.nome.trim(),
    usuario: dadosUsuario.usuario.trim(),
    senha: dadosUsuario.senha,
    tipo: dadosUsuario.tipo.trim(),
    ativo: dadosUsuario.ativo ? 1 : 0,
    imagem: limparTextoOpcional(dadosUsuario.imagem),
    idVendedor: dadosUsuario.tipo === 'Usuario padrao' && dadosUsuario.idVendedor
      ? Number(dadosUsuario.idVendedor)
      : null
  };
}

function obterResultadoLista(resultado) {
  return resultado.status === 'fulfilled' ? resultado.value : [];
}

function ordenarRegistrosPorOrdem(registros, chavePrimaria) {
  if (!Array.isArray(registros)) {
    return [];
  }

  return [...registros].sort((registroA, registroB) => {
    const ordemA = normalizarOrdemOrdenacao(registroA?.ordem, registroA?.[chavePrimaria]);
    const ordemB = normalizarOrdemOrdenacao(registroB?.ordem, registroB?.[chavePrimaria]);

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    const idA = Number(registroA?.[chavePrimaria] || 0);
    const idB = Number(registroB?.[chavePrimaria] || 0);
    return idA - idB;
  });
}

function normalizarOrdemOrdenacao(ordem, fallback) {
  const ordemNumerica = Number(ordem);

  if (Number.isFinite(ordemNumerica) && ordemNumerica > 0) {
    return ordemNumerica;
  }

  const fallbackNumerico = Number(fallback);
  if (Number.isFinite(fallbackNumerico) && fallbackNumerico > 0) {
    return fallbackNumerico;
  }

  return Number.MAX_SAFE_INTEGER;
}

function normalizarPayloadPrazoPagamento(dadosPrazo) {
  const payload = {
    descricao: limparTextoOpcional(dadosPrazo.descricao),
    idMetodoPagamento: Number(dadosPrazo.idMetodoPagamento),
    status: dadosPrazo.status ? 1 : 0
  };

  ['prazo1', 'prazo2', 'prazo3', 'prazo4', 'prazo5', 'prazo6'].forEach((chave) => {
    const valor = String(dadosPrazo[chave] || '').trim();
    payload[chave] = valor ? Number(valor) : null;
  });

  return payload;
}

function normalizarNumeroDecimal(valor) {
  const texto = String(valor ?? '').trim().replace(',', '.');

  if (!texto) {
    return 0;
  }

  const numero = Number(texto);
  return Number.isNaN(numero) ? 0 : numero;
}

function formatarPercentual(valor) {
  const numero = normalizarNumeroDecimal(valor);
  return `${numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function enriquecerPrazosPagamento(prazosPagamento, metodosPagamento) {
  const metodosPorId = new Map(
    metodosPagamento.map((metodo) => [metodo.idMetodoPagamento, metodo.descricao])
  );

  return prazosPagamento.map((prazo) => ({
    ...prazo,
    nomeMetodoPagamento: metodosPorId.get(prazo.idMetodoPagamento) || ''
  }));
}

function enriquecerRecursos(recursos, tiposRecurso) {
  const tiposPorId = new Map(
    tiposRecurso.map((tipoRecurso) => [tipoRecurso.idTipoRecurso, tipoRecurso.descricao])
  );

  return recursos.map((recurso) => ({
    ...recurso,
    nomeTipoRecurso: tiposPorId.get(recurso.idTipoRecurso) || ''
  }));
}

function renderizarCorConfiguracao(registro) {
  return (
    <span className="visualizacaoCorConfiguracao">
      <span
        className="amostraCorConfiguracao"
        aria-hidden="true"
        style={{ backgroundColor: registro.cor || '#FFFFFF' }}
      />
      <span>{registro.cor || 'Nao informado'}</span>
    </span>
  );
}

function renderizarObrigatoriosTipoAgenda(registro) {
  const chips = [];

  if (registro.obrigarCliente) {
    chips.push('Cliente');
  }

  if (registro.obrigarLocal) {
    chips.push('Local');
  }

  if (registro.obrigarRecurso) {
    chips.push('Recurso');
  }

  if (chips.length === 0) {
    return <span className="textoConfiguracaoVazio">Nenhum</span>;
  }

  return (
    <span className="listaChipsConfiguracao">
      {chips.map((chip) => (
        <span key={chip} className="chipConfiguracao">{chip}</span>
      ))}
    </span>
  );
}
