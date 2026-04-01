import { useEffect, useMemo, useState } from 'react';
import { AcoesRegistro } from '../../componentes/comuns/acoesRegistro';
import { Botao } from '../../componentes/comuns/botao';
import { CampoPesquisa } from '../../componentes/comuns/campoPesquisa';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import {
  atualizarAtendimento,
  excluirAtendimento,
  incluirAtendimento,
  listarAtendimentos,
  listarCanaisAtendimento,
  listarOrigensAtendimento
} from '../../servicos/atendimentos';
import {
  incluirCliente,
  incluirContato,
  listarClientes,
  listarContatos,
  listarRamosAtividade,
  listarVendedores
} from '../../servicos/clientes';
import {
  listarCamposPedidoConfiguracao,
  listarCamposOrcamentoConfiguracao,
  listarEtapasPedidoConfiguracao,
  listarEtapasOrcamentoConfiguracao,
  listarMotivosPerdaConfiguracao,
  listarPrazosPagamentoConfiguracao
} from '../../servicos/configuracoes';
import { listarEmpresas } from '../../servicos/empresa';
import {
  atualizarOrcamento,
  incluirOrcamento,
  listarOrcamentos
} from '../../servicos/orcamentos';
import { incluirPedido } from '../../servicos/pedidos';
import { listarProdutos } from '../../servicos/produtos';
import { listarUsuarios } from '../../servicos/usuarios';
import { ModalPedido } from '../pedidos/modalPedido';
import { ModalAtendimento } from './modalAtendimento';

function criarFiltrosIniciaisAtendimentos(usuarioLogado) {
  return {
    idCliente: '',
    idUsuario: usuarioLogado?.idUsuario ? String(usuarioLogado.idUsuario) : '',
    idVendedorCliente: '',
    idCanalAtendimento: '',
    idOrigemAtendimento: ''
  };
}

function criarFiltrosLimposAtendimentos() {
  return {
    idCliente: '',
    idUsuario: '',
    idVendedorCliente: '',
    idCanalAtendimento: '',
    idOrigemAtendimento: ''
  };
}

const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;
const ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO = 2;
const ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO = 3;

export function PaginaAtendimentos({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const [filtros, definirFiltros] = useState(() => criarFiltrosIniciaisAtendimentos(usuarioLogado));
  const [atendimentos, definirAtendimentos] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [orcamentos, definirOrcamentos] = useState([]);
  const [ramosAtividade, definirRamosAtividade] = useState([]);
  const [canaisAtendimento, definirCanaisAtendimento] = useState([]);
  const [origensAtendimento, definirOrigensAtendimento] = useState([]);
  const [prazosPagamento, definirPrazosPagamento] = useState([]);
  const [etapasOrcamento, definirEtapasOrcamento] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [motivosPerda, definirMotivosPerda] = useState([]);
  const [produtos, definirProdutos] = useState([]);
  const [camposOrcamento, definirCamposOrcamento] = useState([]);
  const [camposPedido, definirCamposPedido] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalPedidoAberto, definirModalPedidoAberto] = useState(false);
  const [atendimentoSelecionado, definirAtendimentoSelecionado] = useState(null);
  const [dadosIniciaisPedido, definirDadosIniciaisPedido] = useState(null);
  const [orcamentoPedidoEmCriacao, definirOrcamentoPedidoEmCriacao] = useState(null);
  const [etapaOrcamentoAtualizadaExternamente, definirEtapaOrcamentoAtualizadaExternamente] = useState(null);
  const [modoModal, definirModoModal] = useState('novo');
  const usuarioSomenteVendedor = usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor;

  useEffect(() => {
    definirFiltros(criarFiltrosIniciaisAtendimentos(usuarioLogado));
  }, [usuarioLogado?.idUsuario]);

  useEffect(() => {
    carregarDados();
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor]);

  async function carregarDados() {
    definirCarregando(true);
    definirMensagemErro('');

    try {
      const [
        atendimentosCarregados,
        clientesCarregados,
        contatosCarregados,
        usuariosCarregados,
        vendedoresCarregados,
        orcamentosCarregados,
        ramosCarregados,
        canaisCarregados,
        origensCarregadas,
        prazosCarregados,
        etapasOrcamentoCarregadas,
        etapasPedidoCarregadas,
        motivosPerdaCarregados,
        produtosCarregados,
        camposOrcamentoCarregados,
        camposPedidoCarregados,
        empresasCarregadas
      ] = await Promise.all([
        listarAtendimentos(),
        listarClientes(),
        listarContatos(),
        listarUsuarios(),
        listarVendedores(),
        listarOrcamentos(),
        listarRamosAtividade(),
        listarCanaisAtendimento(),
        listarOrigensAtendimento(),
        listarPrazosPagamentoConfiguracao(),
        listarEtapasOrcamentoConfiguracao(),
        listarEtapasPedidoConfiguracao(),
        listarMotivosPerdaConfiguracao(),
        listarProdutos(),
        listarCamposOrcamentoConfiguracao(),
        listarCamposPedidoConfiguracao(),
        listarEmpresas()
      ]);

      const clientesCarteira = usuarioSomenteVendedor
        ? clientesCarregados.filter((cliente) => cliente.idVendedor === usuarioLogado.idVendedor)
        : clientesCarregados;
      const idsClientesCarteira = new Set(clientesCarteira.map((cliente) => cliente.idCliente));
      const contatosCarteira = contatosCarregados.filter((contato) => idsClientesCarteira.has(contato.idCliente));
      const atendimentosVisiveis = usuarioSomenteVendedor
        ? atendimentosCarregados.filter((atendimento) => (
          idsClientesCarteira.has(atendimento.idCliente)
          || String(atendimento.idUsuario) === String(usuarioLogado.idUsuario)
        ))
        : atendimentosCarregados;

      definirAtendimentos(
        enriquecerAtendimentos(
          atendimentosVisiveis,
          clientesCarteira,
          contatosCarteira,
          usuariosCarregados,
          vendedoresCarregados,
          canaisCarregados,
          origensCarregadas
        )
      );
      definirClientes(clientesCarteira);
      definirContatos(contatosCarteira);
      definirUsuarios(usuariosCarregados);
      definirVendedores(vendedoresCarregados);
      definirOrcamentos(
        enriquecerOrcamentosAtendimento(
          orcamentosCarregados,
          clientesCarregados,
          contatosCarregados,
          usuariosCarregados,
          vendedoresCarregados,
          prazosCarregados.map((prazo) => ({
            ...prazo,
            descricaoFormatada: prazo.descricao || [prazo.prazo1, prazo.prazo2, prazo.prazo3, prazo.prazo4, prazo.prazo5, prazo.prazo6]
              .filter((valor) => valor !== null && valor !== undefined && valor !== '')
              .join(' / ')
          })),
          etapasOrcamentoCarregadas,
          produtosCarregados
        ).filter((orcamento) => orcamentoEstaAberto(orcamento))
      );
      definirRamosAtividade(ramosCarregados);
      definirCanaisAtendimento(canaisCarregados);
      definirOrigensAtendimento(origensCarregadas);
      definirPrazosPagamento(prazosCarregados.map((prazo) => ({
        ...prazo,
        descricaoFormatada: prazo.descricao || [prazo.prazo1, prazo.prazo2, prazo.prazo3, prazo.prazo4, prazo.prazo5, prazo.prazo6]
          .filter((valor) => valor !== null && valor !== undefined && valor !== '')
          .join(' / ')
      })));
      definirEtapasOrcamento(etapasOrcamentoCarregadas);
      definirEtapasPedido(etapasPedidoCarregadas.map((etapa) => ({
        ...etapa,
        idEtapaPedido: etapa.idEtapaPedido ?? etapa.idEtapa
      })));
      definirMotivosPerda(motivosPerdaCarregados);
      definirProdutos(produtosCarregados.filter((produto) => produto.status !== 0));
      definirCamposOrcamento(camposOrcamentoCarregados);
      definirCamposPedido(camposPedidoCarregados);
      definirEmpresa(empresasCarregadas[0] || null);
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os atendimentos.');
    } finally {
      definirCarregando(false);
    }
  }

  async function salvarAtendimento(dadosAtendimento) {
    const payload = normalizarPayloadAtendimento({
      ...dadosAtendimento,
      horaFim: atendimentoSelecionado?.idAtendimento
        ? dadosAtendimento.horaFim
        : obterHoraAtualFormatoInput(),
      idUsuario: atendimentoSelecionado?.idUsuario || usuarioLogado.idUsuario
    });

    if (atendimentoSelecionado?.idAtendimento) {
      await atualizarAtendimento(atendimentoSelecionado.idAtendimento, payload);
    } else {
      await incluirAtendimento(payload);
    }

    await carregarDados();
    fecharModal();
  }

  async function incluirClientePeloAtendimento(dadosCliente) {
    const payload = normalizarPayloadClienteAtendimento({
      ...dadosCliente,
      idVendedor: usuarioSomenteVendedor ? String(usuarioLogado.idVendedor) : dadosCliente.idVendedor
    });

    const clienteSalvo = await incluirCliente(payload);
    await salvarContatosClienteAtendimento(clienteSalvo.idCliente, dadosCliente.contatos || []);
    await carregarDados();

    const clientesAtualizados = await listarClientes();
    const clienteCompleto = clientesAtualizados.find((cliente) => cliente.idCliente === clienteSalvo.idCliente);

    return clienteCompleto || clienteSalvo;
  }

  async function incluirOrcamentoPeloAtendimento(dadosOrcamento) {
    const orcamentoSalvo = await incluirOrcamento(normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado));
    await carregarDados();
    return orcamentoSalvo;
  }

  async function atualizarOrcamentoPeloAtendimento(dadosOrcamento) {
    const payload = normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado);

    if (!dadosOrcamento?.idOrcamento) {
      return null;
    }

    const orcamentoSalvo = await atualizarOrcamento(dadosOrcamento.idOrcamento, payload);
    await carregarDados();
    return orcamentoSalvo;
  }

  async function atualizarStatusOrcamentoPeloAtendimento({ idOrcamento, idEtapaOrcamento }) {
    const orcamentoAtual = orcamentos.find((item) => item.idOrcamento === idOrcamento);

    if (!orcamentoAtual || !idEtapaOrcamento || String(orcamentoAtual.idEtapaOrcamento) === String(idEtapaOrcamento)) {
      return orcamentoAtual || null;
    }

    const orcamentoSalvo = await atualizarOrcamento(
      idOrcamento,
      normalizarPayloadOrcamento(
        {
          ...orcamentoAtual,
          idEtapaOrcamento
        },
        usuarioLogado
      )
    );

    await carregarDados();
    return orcamentoSalvo;
  }

  function abrirPedidoPeloAtendimento(dadosPedido, contexto = null) {
    definirOrcamentoPedidoEmCriacao(contexto);
    definirDadosIniciaisPedido(dadosPedido);
    definirModalPedidoAberto(true);
  }

  async function fecharModalPedido() {
    if (orcamentoPedidoEmCriacao?.idOrcamento) {
      const etapaFechadoSemPedido = obterEtapaFechadoSemPedido(etapasOrcamento);

      if (etapaFechadoSemPedido?.idEtapaOrcamento) {
        await atualizarStatusOrcamentoPeloAtendimento({
          idOrcamento: Number(orcamentoPedidoEmCriacao.idOrcamento),
          idEtapaOrcamento: Number(etapaFechadoSemPedido.idEtapaOrcamento)
        });
        definirEtapaOrcamentoAtualizadaExternamente({
          idOrcamento: Number(orcamentoPedidoEmCriacao.idOrcamento),
          idEtapaOrcamento: String(etapaFechadoSemPedido.idEtapaOrcamento)
        });
      }
    }

    definirModalPedidoAberto(false);
    definirDadosIniciaisPedido(null);
    definirOrcamentoPedidoEmCriacao(null);
  }

  async function salvarPedidoPeloAtendimento(dadosPedido) {
    await incluirPedido(normalizarPayloadPedido(dadosPedido));
    await carregarDados();
    definirModalPedidoAberto(false);
    definirDadosIniciaisPedido(null);
    definirOrcamentoPedidoEmCriacao(null);
    definirEtapaOrcamentoAtualizadaExternamente(null);
  }

  function abrirNovoAtendimento() {
    definirAtendimentoSelecionado(null);
    definirModoModal('novo');
    definirModalAberto(true);
  }

  function abrirEdicaoAtendimento(atendimento) {
    definirAtendimentoSelecionado(atendimento);
    definirModoModal('edicao');
    definirModalAberto(true);
  }

  function abrirConsultaAtendimento(atendimento) {
    definirAtendimentoSelecionado(atendimento);
    definirModoModal('consulta');
    definirModalAberto(true);
  }

  async function excluirAtendimentoPelaGrade(atendimento) {
    const confirmado = window.confirm(`Deseja realmente excluir o atendimento "${atendimento.assunto}"?`);

    if (!confirmado) {
      return;
    }

    await excluirRegistroAtendimento(atendimento.idAtendimento);
  }

  function fecharModal() {
    definirModalAberto(false);
    definirAtendimentoSelecionado(null);
    definirModoModal('novo');
  }

  async function excluirRegistroAtendimento(idAtendimento) {
    await excluirAtendimento(idAtendimento);
    await carregarDados();
    fecharModal();
  }

  const atendimentosFiltrados = useMemo(
    () => filtrarAtendimentos(atendimentos, pesquisa, filtros),
    [atendimentos, pesquisa, filtros]
  );
  const filtrosIniciais = useMemo(
    () => criarFiltrosIniciaisAtendimentos(usuarioLogado),
    [usuarioLogado?.idUsuario]
  );
  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(filtrosIniciais);

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Atendimentos</h1>
          <p>Registre e acompanhe os atendimentos comerciais e operacionais do CRM.</p>
        </div>

        <div className="acoesCabecalhoPagina">
          <CampoPesquisa
            valor={pesquisa}
            aoAlterar={definirPesquisa}
            placeholder="Pesquisar atendimentos"
            ariaLabel="Pesquisar atendimentos"
          />
          <Botao
            variante={filtrosAtivos ? 'primario' : 'secundario'}
            icone="filtro"
            somenteIcone
            title="Filtrar"
            aria-label="Filtrar"
            onClick={() => definirModalFiltrosAberto(true)}
          />
          <Botao
            variante="primario"
            icone="adicionar"
            somenteIcone
            title="Novo atendimento"
            aria-label="Novo atendimento"
            onClick={abrirNovoAtendimento}
          />
        </div>
      </header>

      <CorpoPagina>
        <GradePadrao
          cabecalho={<CabecalhoGradeAtendimentos />}
          carregando={carregando}
          mensagemErro={mensagemErro}
          temItens={atendimentosFiltrados.length > 0}
          mensagemCarregando="Carregando atendimentos..."
          mensagemVazia="Nenhum atendimento encontrado."
        >
          {atendimentosFiltrados.map((atendimento) => (
            <LinhaAtendimento
              key={atendimento.idAtendimento}
              atendimento={atendimento}
              permitirExcluir={usuarioLogado?.tipo === 'Administrador'}
              aoConsultar={() => abrirConsultaAtendimento(atendimento)}
              aoEditar={() => abrirEdicaoAtendimento(atendimento)}
              aoExcluir={() => excluirAtendimentoPelaGrade(atendimento)}
            />
          ))}
        </GradePadrao>
      </CorpoPagina>

      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros de atendimentos"
        filtros={filtros}
        campos={[
          {
            name: 'idCliente',
            label: 'Cliente',
            options: clientes.map((cliente) => ({
              valor: String(cliente.idCliente),
              label: cliente.nomeFantasia || cliente.razaoSocial
            }))
          },
          {
            name: 'idUsuario',
            label: 'Usuario do registro',
            options: usuarios.map((usuario) => ({
              valor: String(usuario.idUsuario),
              label: usuario.nome
            }))
          },
          {
            name: 'idVendedorCliente',
            label: 'Clientes do vendedor',
            options: vendedores.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'idCanalAtendimento',
            label: 'Canal',
            options: canaisAtendimento.map((canal) => ({
              valor: String(canal.idCanalAtendimento),
              label: canal.descricao
            }))
          },
          {
            name: 'idOrigemAtendimento',
            label: 'Origem',
            options: origensAtendimento.map((origem) => ({
              valor: String(origem.idOrigemAtendimento),
              label: origem.descricao
            }))
          },
        ]}
        aoFechar={() => definirModalFiltrosAberto(false)}
        aoAplicar={(proximosFiltros) => {
          definirFiltros(proximosFiltros);
          definirModalFiltrosAberto(false);
        }}
        aoLimpar={() => definirFiltros(criarFiltrosLimposAtendimentos())}
      />

      <ModalAtendimento
        aberto={modalAberto}
        atendimento={atendimentoSelecionado}
        clientes={clientes}
        contatos={contatos}
        usuarioLogado={usuarioLogado}
        vendedores={vendedores}
        ramosAtividade={ramosAtividade}
        canaisAtendimento={canaisAtendimento}
        origensAtendimento={origensAtendimento}
        modo={modoModal}
        permitirExcluir={usuarioLogado?.tipo === 'Administrador'}
        idVendedorBloqueado={usuarioSomenteVendedor ? usuarioLogado.idVendedor : null}
        aoIncluirCliente={incluirClientePeloAtendimento}
        aoIncluirOrcamento={incluirOrcamentoPeloAtendimento}
        aoAtualizarOrcamento={atualizarOrcamentoPeloAtendimento}
        dadosOrcamento={montarDadosIniciaisOrcamentoPeloAtendimento(atendimentoSelecionado, clientes, vendedores, usuarioLogado)}
        clientesOrcamento={clientes}
        contatosOrcamento={contatos}
        usuariosOrcamento={usuarios}
        vendedoresOrcamento={vendedores}
        prazosPagamento={prazosPagamento}
        etapasOrcamento={etapasOrcamento}
        motivosPerda={motivosPerda}
        orcamentos={orcamentos}
        produtos={produtos}
        camposOrcamento={camposOrcamento}
        camposPedido={camposPedido}
        etapasPedido={etapasPedido}
        empresa={empresa}
        etapaOrcamentoAtualizadaExternamente={etapaOrcamentoAtualizadaExternamente}
        aoAtualizarStatusOrcamento={atualizarStatusOrcamentoPeloAtendimento}
        aoAbrirPedido={abrirPedidoPeloAtendimento}
        aoFechar={fecharModal}
        aoSalvar={salvarAtendimento}
        aoExcluir={excluirRegistroAtendimento}
      />

      <ModalPedido
        aberto={modalPedidoAberto}
        pedido={null}
        dadosIniciais={dadosIniciaisPedido}
        clientes={clientes}
        contatos={contatos}
        usuarios={usuarios}
        vendedores={vendedores}
        prazosPagamento={prazosPagamento}
        etapasPedido={etapasPedido}
        produtos={produtos}
        camposPedido={camposPedido}
        empresa={empresa}
        usuarioLogado={usuarioLogado}
        modo="novo"
        aoFechar={fecharModalPedido}
        aoSalvar={salvarPedidoPeloAtendimento}
      />
    </>
  );
}

function CabecalhoGradeAtendimentos() {
  return (
    <tr className="cabecalhoGradeAtendimentos">
      <th>Data</th>
      <th>Cliente</th>
      <th>Assunto</th>
      <th>Canal</th>
      <th>Origem</th>
      <th>Usuario</th>
      <th>Acoes</th>
    </tr>
  );
}

function LinhaAtendimento({ atendimento, permitirExcluir, aoConsultar, aoEditar, aoExcluir }) {
  return (
    <tr className="linhaAtendimento">
      <td>{formatarData(atendimento.data)}</td>
      <td>
        <div className="celulaRegistroDetalhes">
          <div className="topoRegistroDetalhes">
            <strong>{atendimento.nomeCliente}</strong>
          </div>
          <span className="textoSecundarioRegistro">{atendimento.nomeContato || 'Sem contato'}</span>
        </div>
      </td>
      <td>
        <div className="celulaRegistroDetalhes">
          <div className="topoRegistroDetalhes">
            <strong>{atendimento.assunto}</strong>
          </div>
          <span className="textoSecundarioRegistro">{atendimento.descricao || 'Sem descricao inicial'}</span>
        </div>
      </td>
      <td>{atendimento.nomeCanalAtendimento}</td>
      <td>{atendimento.nomeOrigemAtendimento}</td>
      <td>{atendimento.nomeUsuario}</td>
      <td>
        <AcoesRegistro
          rotuloConsulta="Consultar atendimento"
          rotuloEdicao="Editar atendimento"
          rotuloInativacao="Excluir atendimento"
          iconeInativacao="limpar"
          exibirInativacao={permitirExcluir}
          aoConsultar={aoConsultar}
          aoEditar={aoEditar}
          aoInativar={aoExcluir}
        />
      </td>
    </tr>
  );
}

function filtrarAtendimentos(atendimentos, pesquisa, filtros) {
  const termo = String(pesquisa || '').trim().toLowerCase();

  return atendimentos.filter((atendimento) => {
    const atendePesquisa = !termo || [
      atendimento.assunto,
      atendimento.descricao,
      atendimento.nomeCliente,
      atendimento.nomeContato,
      atendimento.nomeCanalAtendimento,
      atendimento.nomeOrigemAtendimento,
      atendimento.nomeUsuario,
      atendimento.nomeVendedorCliente
    ].some((valor) => String(valor || '').toLowerCase().includes(termo));

    const atendeFiltros = (
      (!filtros.idCliente || String(atendimento.idCliente) === String(filtros.idCliente))
      && (!filtros.idUsuario || String(atendimento.idUsuario) === String(filtros.idUsuario))
      && (!filtros.idVendedorCliente || String(atendimento.idVendedorCliente) === String(filtros.idVendedorCliente))
      && (!filtros.idCanalAtendimento || String(atendimento.idCanalAtendimento) === String(filtros.idCanalAtendimento))
      && (!filtros.idOrigemAtendimento || String(atendimento.idOrigemAtendimento) === String(filtros.idOrigemAtendimento))
    );

    return atendePesquisa && atendeFiltros;
  });
}

function enriquecerAtendimentos(
  atendimentos,
  clientes,
  contatos,
  usuarios,
  vendedores,
  canaisAtendimento,
  origensAtendimento
) {
  const clientesPorId = new Map(
    clientes.map((cliente) => [
      cliente.idCliente,
      {
        nome: cliente.nomeFantasia || cliente.razaoSocial,
        idVendedor: cliente.idVendedor
      }
    ])
  );
  const contatosPorId = new Map(
    contatos.map((contato) => [contato.idContato, contato.nome])
  );
  const usuariosPorId = new Map(
    usuarios.map((usuario) => [usuario.idUsuario, usuario.nome])
  );
  const vendedoresPorId = new Map(
    vendedores.map((vendedor) => [vendedor.idVendedor, vendedor.nome])
  );
  const canaisPorId = new Map(
    canaisAtendimento.map((canal) => [canal.idCanalAtendimento, canal.descricao])
  );
  const origensPorId = new Map(
    origensAtendimento.map((origem) => [origem.idOrigemAtendimento, origem.descricao])
  );

  return atendimentos.map((atendimento) => ({
    ...atendimento,
    nomeCliente: clientesPorId.get(atendimento.idCliente)?.nome || 'Nao informado',
    idVendedorCliente: clientesPorId.get(atendimento.idCliente)?.idVendedor || null,
    nomeContato: contatosPorId.get(atendimento.idContato) || '',
    nomeUsuario: usuariosPorId.get(atendimento.idUsuario) || 'Nao informado',
    nomeVendedorCliente: vendedoresPorId.get(clientesPorId.get(atendimento.idCliente)?.idVendedor) || 'Nao informado',
    nomeCanalAtendimento: canaisPorId.get(atendimento.idCanalAtendimento) || 'Nao informado',
    nomeOrigemAtendimento: origensPorId.get(atendimento.idOrigemAtendimento) || 'Nao informado'
  }));
}

function normalizarPayloadAtendimento(dadosAtendimento) {
  return {
    idCliente: Number(dadosAtendimento.idCliente),
    idContato: dadosAtendimento.idContato ? Number(dadosAtendimento.idContato) : null,
    idUsuario: Number(dadosAtendimento.idUsuario),
    assunto: String(dadosAtendimento.assunto || '').trim(),
    descricao: limparTextoOpcional(dadosAtendimento.descricao),
    data: dadosAtendimento.data,
    horaInicio: dadosAtendimento.horaInicio,
    horaFim: dadosAtendimento.horaFim,
    idCanalAtendimento: dadosAtendimento.idCanalAtendimento ? Number(dadosAtendimento.idCanalAtendimento) : null,
    idOrigemAtendimento: dadosAtendimento.idOrigemAtendimento ? Number(dadosAtendimento.idOrigemAtendimento) : null
  };
}

function limparTextoOpcional(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
}

async function salvarContatosClienteAtendimento(idCliente, contatos) {
  const contatosNormalizados = normalizarContatosClienteAtendimento(contatos, idCliente);

  for (const contato of contatosNormalizados) {
    await incluirContato(contato);
  }
}

function normalizarPayloadClienteAtendimento(dadosCliente) {
  return {
    idVendedor: Number(dadosCliente.idVendedor),
    idRamo: Number(dadosCliente.idRamo),
    razaoSocial: String(dadosCliente.razaoSocial || '').trim(),
    nomeFantasia: String(dadosCliente.nomeFantasia || '').trim(),
    tipo: String(dadosCliente.tipo || '').trim(),
    cnpj: String(dadosCliente.cnpj || '').trim(),
    inscricaoEstadual: limparTextoOpcional(dadosCliente.inscricaoEstadual),
    status: dadosCliente.status ? 1 : 0,
    email: limparTextoOpcional(dadosCliente.email),
    telefone: limparTextoOpcional(dadosCliente.telefone),
    logradouro: limparTextoOpcional(dadosCliente.logradouro),
    numero: limparTextoOpcional(dadosCliente.numero),
    complemento: limparTextoOpcional(dadosCliente.complemento),
    bairro: limparTextoOpcional(dadosCliente.bairro),
    cidade: limparTextoOpcional(dadosCliente.cidade),
    estado: limparTextoOpcional(dadosCliente.estado)?.toUpperCase(),
    cep: limparTextoOpcional(dadosCliente.cep),
    observacao: limparTextoOpcional(dadosCliente.observacao),
    imagem: limparTextoOpcional(dadosCliente.imagem)
  };
}

function normalizarContatosClienteAtendimento(contatos, idCliente) {
  return contatos.map((contato) => ({
    idCliente,
    nome: String(contato.nome || '').trim(),
    cargo: limparTextoOpcional(contato.cargo),
    email: limparTextoOpcional(contato.email),
    telefone: limparTextoOpcional(contato.telefone),
    whatsapp: limparTextoOpcional(contato.whatsapp),
    status: contato.status ? 1 : 0,
    principal: contato.principal ? 1 : 0
  }));
}

function formatarData(data) {
  if (!data) {
    return 'Nao informado';
  }

  const [ano, mes, dia] = String(data).split('T')[0].split('-');

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function obterHoraAtualFormatoInput() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');

  return `${horas}:${minutos}`;
}

function montarDadosIniciaisOrcamentoPeloAtendimento(atendimento, clientes, vendedores, usuarioLogado) {
  const cliente = clientes.find((item) => String(item.idCliente) === String(atendimento?.idCliente || ''));
  const vendedor = vendedores.find((item) => String(item.idVendedor) === String(cliente?.idVendedor || ''));

  return {
    idCliente: atendimento?.idCliente || '',
    idContato: atendimento?.idContato || '',
    idUsuario: atendimento?.idUsuario || usuarioLogado?.idUsuario || '',
    nomeUsuario: atendimento?.nomeUsuario || usuarioLogado?.nome || '',
    idVendedor: cliente?.idVendedor || '',
    comissao: vendedor?.comissaoPadrao ?? 0,
    observacao: atendimento?.descricao || ''
  };
}

function enriquecerOrcamentosAtendimento(orcamentos, clientes, contatos, usuarios, vendedores, prazosPagamento, etapasOrcamento, produtos) {
  const clientesPorId = new Map(clientes.map((cliente) => [cliente.idCliente, cliente]));
  const contatosPorId = new Map(contatos.map((contato) => [contato.idContato, contato.nome]));
  const usuariosPorId = new Map(usuarios.map((usuario) => [usuario.idUsuario, usuario.nome]));
  const vendedoresPorId = new Map(vendedores.map((vendedor) => [vendedor.idVendedor, vendedor.nome]));
  const prazosPorId = new Map(prazosPagamento.map((prazo) => [prazo.idPrazoPagamento, prazo]));
  const etapasPorId = new Map(etapasOrcamento.map((etapa) => [etapa.idEtapaOrcamento, etapa]));
  const produtosPorId = new Map(produtos.map((produto) => [produto.idProduto, produto]));

  return orcamentos.map((orcamento) => {
    const cliente = clientesPorId.get(orcamento.idCliente);

    return {
      ...orcamento,
      nomeCliente: cliente?.nomeFantasia || cliente?.razaoSocial || 'Nao informado',
      nomeContato: contatosPorId.get(orcamento.idContato) || '',
      nomeUsuario: usuariosPorId.get(orcamento.idUsuario) || 'Nao informado',
      nomeVendedor: vendedoresPorId.get(orcamento.idVendedor) || 'Nao informado',
      nomePrazoPagamento: prazosPorId.get(orcamento.idPrazoPagamento)?.descricaoFormatada || '',
      nomeEtapaOrcamento: etapasPorId.get(orcamento.idEtapaOrcamento)?.descricao || '',
      itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => ({
        ...item,
        nomeProduto: produtosPorId.get(item.idProduto)?.descricao || item.nomeProduto || 'Produto nao informado'
      })) : []
    };
  });
}

function orcamentoEstaAberto(orcamento) {
  const idEtapa = Number(orcamento?.idEtapaOrcamento);

  return ![
    ID_ETAPA_ORCAMENTO_FECHAMENTO,
    ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO,
    ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO
  ].includes(idEtapa);
}

function etapaAcabouDeFechar(idEtapaAnterior, idEtapaAtual, etapasOrcamento) {
  const etapaAnterior = etapasOrcamento.find((etapa) => String(etapa.idEtapaOrcamento) === String(idEtapaAnterior || ''));
  const etapaAtual = etapasOrcamento.find((etapa) => String(etapa.idEtapaOrcamento) === String(idEtapaAtual || ''));

  return !etapaOrcamentoEhFechamento(etapaAnterior) && etapaOrcamentoEhFechamento(etapaAtual);
}

function etapaOrcamentoEhFechamento(etapa) {
  return Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHAMENTO;
}

function obterEtapaFechadoSemPedido(etapasOrcamento) {
  return etapasOrcamento.find((etapa) => Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO) || null;
}

function normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado) {
  return {
    idCliente: Number(dadosOrcamento.idCliente),
    idContato: dadosOrcamento.idContato ? Number(dadosOrcamento.idContato) : null,
    idUsuario: Number(dadosOrcamento.idUsuario || usuarioLogado.idUsuario),
    idVendedor: Number(dadosOrcamento.idVendedor),
    comissao: normalizarNumeroDecimal(dadosOrcamento.comissao),
    idPrazoPagamento: dadosOrcamento.idPrazoPagamento ? Number(dadosOrcamento.idPrazoPagamento) : null,
    idEtapaOrcamento: dadosOrcamento.idEtapaOrcamento ? Number(dadosOrcamento.idEtapaOrcamento) : null,
    idMotivoPerda: dadosOrcamento.idMotivoPerda ? Number(dadosOrcamento.idMotivoPerda) : null,
    dataInclusao: limparTextoOpcional(dadosOrcamento.dataInclusao),
    dataValidade: limparTextoOpcional(dadosOrcamento.dataValidade),
    observacao: limparTextoOpcional(dadosOrcamento.observacao),
    itens: Array.isArray(dadosOrcamento.itens) ? dadosOrcamento.itens.map((item) => ({
      idProduto: Number(item.idProduto),
      quantidade: normalizarNumeroDecimal(item.quantidade),
      valorUnitario: normalizarNumeroDecimal(item.valorUnitario),
      valorTotal: normalizarNumeroDecimal(item.valorTotal),
      imagem: limparTextoOpcional(item.imagem),
      observacao: limparTextoOpcional(item.observacao)
    })) : [],
    camposExtras: Array.isArray(dadosOrcamento.camposExtras) ? dadosOrcamento.camposExtras.map((campo) => ({
      idCampoOrcamento: Number(campo.idCampoOrcamento),
      valor: limparTextoOpcional(campo.valor)
    })) : []
  };
}

function normalizarNumeroDecimal(valor) {
  const textoOriginal = String(valor ?? '').trim();

  if (!textoOriginal) {
    return 0;
  }

  const textoLimpo = textoOriginal
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '');
  const texto = textoLimpo.includes(',')
    ? textoLimpo.replace(',', '.')
    : textoLimpo;
  const numero = Number(texto);
  return Number.isNaN(numero) ? 0 : numero;
}

function normalizarPayloadPedido(dadosPedido) {
  return {
    idOrcamento: dadosPedido.idOrcamento ? Number(dadosPedido.idOrcamento) : null,
    idCliente: dadosPedido.idCliente ? Number(dadosPedido.idCliente) : null,
    idContato: dadosPedido.idContato ? Number(dadosPedido.idContato) : null,
    idUsuario: dadosPedido.idUsuario ? Number(dadosPedido.idUsuario) : null,
    idVendedor: dadosPedido.idVendedor ? Number(dadosPedido.idVendedor) : null,
    idPrazoPagamento: dadosPedido.idPrazoPagamento ? Number(dadosPedido.idPrazoPagamento) : null,
    idEtapaPedido: dadosPedido.idEtapaPedido ? Number(dadosPedido.idEtapaPedido) : null,
    comissao: normalizarNumeroDecimal(dadosPedido.comissao),
    dataInclusao: limparTextoOpcional(dadosPedido.dataInclusao),
    dataEntrega: limparTextoOpcional(dadosPedido.dataEntrega),
    observacao: limparTextoOpcional(dadosPedido.observacao),
    codigoOrcamentoOrigem: dadosPedido.codigoOrcamentoOrigem ? Number(dadosPedido.codigoOrcamentoOrigem) : null,
    nomeClienteSnapshot: limparTextoOpcional(dadosPedido.nomeClienteSnapshot),
    nomeContatoSnapshot: limparTextoOpcional(dadosPedido.nomeContatoSnapshot),
    nomeUsuarioSnapshot: limparTextoOpcional(dadosPedido.nomeUsuarioSnapshot),
    nomeVendedorSnapshot: limparTextoOpcional(dadosPedido.nomeVendedorSnapshot),
    nomeMetodoPagamentoSnapshot: limparTextoOpcional(dadosPedido.nomeMetodoPagamentoSnapshot),
    nomePrazoPagamentoSnapshot: limparTextoOpcional(dadosPedido.nomePrazoPagamentoSnapshot),
    nomeEtapaPedidoSnapshot: limparTextoOpcional(dadosPedido.nomeEtapaPedidoSnapshot),
    itens: Array.isArray(dadosPedido.itens) ? dadosPedido.itens.map((item) => ({
      idProduto: item.idProduto ? Number(item.idProduto) : null,
      quantidade: normalizarNumeroDecimal(item.quantidade),
      valorUnitario: normalizarNumeroDecimal(item.valorUnitario),
      valorTotal: normalizarNumeroDecimal(item.valorTotal),
      imagem: limparTextoOpcional(item.imagem),
      observacao: limparTextoOpcional(item.observacao),
      referenciaProdutoSnapshot: limparTextoOpcional(item.referenciaProdutoSnapshot),
      descricaoProdutoSnapshot: limparTextoOpcional(item.descricaoProdutoSnapshot),
      unidadeProdutoSnapshot: limparTextoOpcional(item.unidadeProdutoSnapshot)
    })) : [],
    camposExtras: Array.isArray(dadosPedido.camposExtras) ? dadosPedido.camposExtras.map((campo) => ({
      idCampoPedido: campo.idCampoPedido ? Number(campo.idCampoPedido) : null,
      tituloSnapshot: limparTextoOpcional(campo.tituloSnapshot || campo.titulo),
      valor: limparTextoOpcional(campo.valor)
    })) : []
  };
}

function enriquecerOrcamentoParaPedido(orcamento, contexto) {
  const cliente = contexto.clientes.find((item) => String(item.idCliente) === String(orcamento.idCliente));
  const contato = contexto.contatos.find((item) => String(item.idContato) === String(orcamento.idContato));
  const usuario = contexto.usuarios.find((item) => String(item.idUsuario) === String(orcamento.idUsuario));
  const vendedor = contexto.vendedores.find((item) => String(item.idVendedor) === String(orcamento.idVendedor));
  const prazo = contexto.prazosPagamento.find((item) => String(item.idPrazoPagamento) === String(orcamento.idPrazoPagamento));

  return {
    ...orcamento,
    nomeCliente: orcamento.nomeCliente || cliente?.nomeFantasia || cliente?.razaoSocial || '',
    nomeContato: orcamento.nomeContato || contato?.nome || '',
    nomeUsuario: orcamento.nomeUsuario || usuario?.nome || '',
    nomeVendedor: orcamento.nomeVendedor || vendedor?.nome || '',
    nomePrazoPagamento: orcamento.nomePrazoPagamento || prazo?.descricaoFormatada || prazo?.descricao || '',
    nomeMetodoPagamento: orcamento.nomeMetodoPagamento || prazo?.nomeMetodoPagamento || '',
    itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => {
      const produto = contexto.produtos.find((registro) => String(registro.idProduto) === String(item.idProduto));
      return {
        ...item,
        descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || produto?.descricao || item.nomeProduto || '',
        referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || produto?.referencia || '',
        unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || produto?.nomeUnidadeMedida || produto?.siglaUnidadeMedida || '',
        imagem: item.imagem || produto?.imagem || ''
      };
    }) : []
  };
}

function montarDadosIniciaisPedidoAPartirDoOrcamento(orcamento) {
  return {
    idOrcamento: orcamento.idOrcamento,
    codigoOrcamentoOrigem: orcamento.idOrcamento,
    idCliente: orcamento.idCliente,
    idContato: orcamento.idContato,
    idUsuario: orcamento.idUsuario,
    idVendedor: orcamento.idVendedor,
    idPrazoPagamento: orcamento.idPrazoPagamento,
    comissao: orcamento.comissao,
    dataInclusao: obterDataAtualFormatoInput(),
    nomeClienteSnapshot: orcamento.nomeCliente || '',
    nomeContatoSnapshot: orcamento.nomeContato || '',
    nomeUsuarioSnapshot: orcamento.nomeUsuario || '',
    nomeVendedorSnapshot: orcamento.nomeVendedor || '',
    nomeMetodoPagamentoSnapshot: orcamento.nomeMetodoPagamento || '',
    nomePrazoPagamentoSnapshot: orcamento.nomePrazoPagamento || '',
    observacao: orcamento.observacao || '',
    itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => ({
      idProduto: item.idProduto,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      imagem: item.imagem || '',
      observacao: item.observacao || '',
      referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || '',
      descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || item.nomeProduto || '',
      unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || ''
    })) : []
  };
}
