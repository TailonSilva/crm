import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import { Icone } from '../../componentes/comuns/icone';
import { useEffect, useState } from 'react';
import {
  atualizarEtapaPedido,
  atualizarEtapaOrcamento,
  atualizarGrupoProduto,
  atualizarCanalAtendimento,
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
  listarLocaisAgendaConfiguracao,
  listarMarcasConfiguracao,
  listarMetodosPagamentoConfiguracao,
  listarMotivosPerdaConfiguracao,
  listarOrigensAtendimentoConfiguracao,
  listarPrazosPagamentoConfiguracao,
  listarRecursosConfiguracao,
  listarRamosAtividadeConfiguracao,
  listarStatusVisitaConfiguracao,
  listarTiposAgendaConfiguracao,
  listarTiposRecursoConfiguracao,
  listarUnidadesMedidaConfiguracao,
  listarVendedoresConfiguracao
} from '../../servicos/configuracoes';
import { atualizarEmpresa, incluirEmpresa, listarEmpresas } from '../../servicos/empresa';
import { atualizarUsuario, incluirUsuario, listarUsuarios } from '../../servicos/usuarios';
import { normalizarTelefone } from '../../utilitarios/normalizarTelefone';
import { ModalCadastroConfiguracao } from './modalCadastroConfiguracao';
import { ModalEmpresa } from './modalEmpresa';
import { ModalPrazosPagamento } from './modalPrazosPagamento';
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
    titulo: 'Status da visita',
    icone: 'cadastro'
  },
  {
    id: 'motivosPerda',
    titulo: 'Motivos da perda',
    icone: 'cadastro'
  },
  {
    id: 'orcamentos',
    titulo: 'Orcamentos',
    icone: 'orcamento'
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
  }
];

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
  const [modalEmpresaAberto, definirModalEmpresaAberto] = useState(false);
  const [modalUsuariosAberto, definirModalUsuariosAberto] = useState(false);
  const [cadastroConfiguracaoAberto, definirCadastroConfiguracaoAberto] = useState(null);
  const [modoModalEmpresa, definirModoModalEmpresa] = useState('edicao');
  const usuarioSomenteConsulta = usuarioLogado?.tipo === 'Usuario padrao';

  useEffect(() => {
    carregarEmpresa();
    carregarCadastrosConfiguracao();
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
      listarEtapasOrcamentoConfiguracao()
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
    definirTiposAgenda(obterResultadoLista(resultados[10]));
    definirCanaisAtendimento(obterResultadoLista(resultados[11]));
    definirOrigensAtendimento(obterResultadoLista(resultados[12]));
    definirStatusVisita(obterResultadoLista(resultados[13]));
    definirMotivosPerda(obterResultadoLista(resultados[14]));
    definirEtapasPedido(obterResultadoLista(resultados[15]));
    definirEtapasOrcamento(obterResultadoLista(resultados[16]));
  }

  async function salvarUsuario(dadosUsuario) {
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

    if (dadosGrupo.idGrupo) {
      await atualizarGrupoProduto(dadosGrupo.idGrupo, payload);
    } else {
      await incluirGrupoProduto(payload);
    }

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
      sigla: dadosRecurso.sigla.trim(),
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
      abreviacao: dadosEtapa.abreviacao.trim(),
      descricao: dadosEtapa.descricao.trim(),
      cor: dadosEtapa.cor.trim(),
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
      abreviacao: dadosEtapa.abreviacao.trim(),
      descricao: dadosEtapa.descricao.trim(),
      cor: dadosEtapa.cor.trim(),
      status: dadosEtapa.status ? 1 : 0
    };

    if (dadosEtapa.idEtapaOrcamento) {
      await atualizarEtapaOrcamento(dadosEtapa.idEtapaOrcamento, payload);
    } else {
      await incluirEtapaOrcamento(payload);
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

    if ([
      'gruposProduto',
      'etapasPedido',
      'etapasOrcamento',
      'marcas',
      'metodosPagamento',
      'motivosPerda',
      'locaisAgenda',
      'prazosPagamento',
      'recursos',
      'ramosAtividade',
      'canaisAtendimento',
      'origensAtendimento',
      'statusVisita',
      'tiposAgenda',
      'tiposRecurso',
      'vendedores',
      'unidadesMedida'
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

  function fecharCadastroConfiguracao() {
    definirCadastroConfiguracaoAberto(null);
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
        <section className="gradeConfiguracoes" aria-label="Atalhos de configuracao">
          {atalhosConfiguracao.map((atalho) => (
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
        </section>
      </CorpoPagina>

      <ModalEmpresa
        aberto={modalEmpresaAberto}
        empresa={empresa}
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
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'gruposProduto'}
        titulo="Grupos de produtos"
        rotuloIncluir="Incluir grupo"
        registros={gruposProduto}
        chavePrimaria="idGrupo"
        exibirConsulta={false}
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarGrupoProduto}
        aoInativar={inativarGrupoProduto}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'marcas'}
        titulo="Marcas"
        rotuloIncluir="Incluir marca"
        registros={marcas}
        chavePrimaria="idMarca"
        exibirConsulta={false}
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarMarca}
        aoInativar={inativarMarca}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'ramosAtividade'}
        titulo="Ramos de atividade"
        rotuloIncluir="Incluir ramo"
        registros={ramosAtividade}
        chavePrimaria="idRamo"
        exibirConsulta={false}
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
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
          { key: 'email', label: 'E-mail' }
        ]}
        camposFormulario={[
          { name: 'nome', label: 'Nome', required: true },
          { name: 'email', label: 'E-mail', type: 'email', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarVendedor}
        aoInativar={inativarVendedor}
      />
      <ModalCadastroConfiguracao
        aberto={cadastroConfiguracaoAberto === 'unidadesMedida'}
        titulo="Unidades de medida"
        rotuloIncluir="Incluir unidade"
        registros={unidadesMedida}
        chavePrimaria="idUnidade"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
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
          { key: 'sigla', label: 'Sigla' },
          { key: 'descricao', label: 'Descricao' },
          { key: 'nomeTipoRecurso', label: 'Tipo' }
        ]}
        camposFormulario={[
          { name: 'sigla', label: 'Sigla', required: true },
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
        classeFormulario="gradeFormularioEtapas"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'descricao', label: 'Descricao' },
          { key: 'cor', label: 'Cor', render: renderizarCorConfiguracao },
          { key: 'obrigatorios', label: 'Obrigatorios', render: renderizarObrigatoriosTipoAgenda }
        ]}
        camposFormulario={[
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
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'icone', label: 'Icone' },
          { key: 'descricao', label: 'Descricao' }
        ]}
        camposFormulario={[
          { name: 'icone', label: 'Icone', required: false },
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarStatusVisita}
        aoInativar={inativarStatusVisita}
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
        classeFormulario="gradeFormularioEtapas"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'abreviacao', label: 'Abreviacao' },
          { key: 'descricao', label: 'Descricao' },
          { key: 'cor', label: 'Cor', render: renderizarCorConfiguracao }
        ]}
        camposFormulario={[
          { name: 'abreviacao', label: 'Abreviacao', required: true },
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
        classeTabela="tabelaEtapasPedido"
        classeFormulario="gradeFormularioEtapas"
        somenteConsulta={usuarioSomenteConsulta}
        colunas={[
          { key: 'abreviacao', label: 'Abreviacao' },
          { key: 'descricao', label: 'Descricao' },
          { key: 'cor', label: 'Cor', render: renderizarCorConfiguracao }
        ]}
        camposFormulario={[
          { name: 'abreviacao', label: 'Abreviacao', required: true },
          { name: 'descricao', label: 'Descricao', required: true },
          { name: 'cor', label: 'Cor', type: 'color', required: true, defaultValue: '#0B74D1' },
          { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
        ]}
        aoFechar={fecharCadastroConfiguracao}
        aoSalvar={salvarEtapaOrcamento}
        aoInativar={inativarEtapaOrcamento}
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
