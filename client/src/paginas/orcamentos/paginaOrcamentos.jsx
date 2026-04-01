import { useEffect, useMemo, useState } from 'react';
import { AcoesRegistro } from '../../componentes/comuns/acoesRegistro';
import { Botao } from '../../componentes/comuns/botao';
import { CampoPesquisa } from '../../componentes/comuns/campoPesquisa';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import { listarClientes, listarContatos, listarVendedores } from '../../servicos/clientes';
import {
  listarCamposPedidoConfiguracao,
  listarEtapasPedidoConfiguracao,
  listarCamposOrcamentoConfiguracao,
  listarEtapasOrcamentoConfiguracao,
  listarMetodosPagamentoConfiguracao,
  listarMotivosPerdaConfiguracao,
  listarPrazosPagamentoConfiguracao
} from '../../servicos/configuracoes';
import { incluirPedido } from '../../servicos/pedidos';
import {
  listarOrcamentos,
  atualizarOrcamento,
  excluirOrcamento,
  incluirOrcamento
} from '../../servicos/orcamentos';
import { listarEmpresas } from '../../servicos/empresa';
import { listarProdutos } from '../../servicos/produtos';
import { listarUsuarios } from '../../servicos/usuarios';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';
import { ModalOrcamento } from './modalOrcamento';
import { ModalPedido } from '../pedidos/modalPedido';

function criarFiltrosIniciaisOrcamentos(usuarioLogado, empresa = null) {
  return {
    idCliente: '',
    idUsuario: '',
    idVendedorCliente: '',
    idVendedor: usuarioLogado?.idVendedor ? String(usuarioLogado.idVendedor) : '',
    idsEtapaOrcamento: obterEtapasFiltroPadraoOrcamento(empresa)
  };
}

  const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;
  const ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO = 2;

function criarFiltrosLimposOrcamentos(usuarioLogado, empresa = null) {
  return {
    idCliente: '',
    idUsuario: '',
    idVendedorCliente: '',
    idVendedor: usuarioLogado?.idVendedor ? String(usuarioLogado.idVendedor) : '',
    idsEtapaOrcamento: obterEtapasFiltroPadraoOrcamento(empresa)
  };
}

export function PaginaOrcamentos({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const [filtros, definirFiltros] = useState(() => criarFiltrosIniciaisOrcamentos(usuarioLogado, null));
  const [orcamentos, definirOrcamentos] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [metodosPagamento, definirMetodosPagamento] = useState([]);
  const [prazosPagamento, definirPrazosPagamento] = useState([]);
  const [etapasOrcamento, definirEtapasOrcamento] = useState([]);
  const [motivosPerda, definirMotivosPerda] = useState([]);
  const [produtos, definirProdutos] = useState([]);
  const [camposOrcamento, definirCamposOrcamento] = useState([]);
  const [camposPedido, definirCamposPedido] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [orcamentoSelecionado, definirOrcamentoSelecionado] = useState(null);
  const [orcamentoExclusaoPendente, definirOrcamentoExclusaoPendente] = useState(null);
  const [alteracaoEtapaPendente, definirAlteracaoEtapaPendente] = useState(null);
  const [motivoPerdaEtapaRapida, definirMotivoPerdaEtapaRapida] = useState('');
  const [orcamentoPedidoPendente, definirOrcamentoPedidoPendente] = useState(null);
  const [orcamentoPedidoEmCriacao, definirOrcamentoPedidoEmCriacao] = useState(null);
  const [dadosIniciaisPedido, definirDadosIniciaisPedido] = useState(null);
  const [modalPedidoAberto, definirModalPedidoAberto] = useState(false);
  const [modoModal, definirModoModal] = useState('novo');
  const usuarioSomenteVendedor = usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor;
  const permitirExcluir = usuarioLogado?.tipo !== 'Usuario padrao';

  useEffect(() => {
    definirFiltros(criarFiltrosIniciaisOrcamentos(usuarioLogado, empresa));
  }, [usuarioLogado?.idUsuario, usuarioLogado?.idVendedor, empresa?.etapasFiltroPadraoOrcamento]);

  useEffect(() => {
    carregarDados();
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor]);

  async function carregarDados() {
    definirCarregando(true);
    definirMensagemErro('');

    try {
      const [
        orcamentosCarregados,
        clientesCarregados,
        contatosCarregados,
        usuariosCarregados,
        vendedoresCarregados,
        metodosCarregados,
        prazosCarregados,
        etapasCarregadas,
        motivosPerdaCarregados,
        produtosCarregados,
        camposCarregados,
        camposPedidoCarregados,
        etapasPedidoCarregadas,
        empresasCarregadas
      ] = await Promise.all([
        listarOrcamentos(),
        listarClientes(),
        listarContatos(),
        listarUsuarios(),
        listarVendedores(),
        listarMetodosPagamentoConfiguracao(),
        listarPrazosPagamentoConfiguracao(),
        listarEtapasOrcamentoConfiguracao(),
        listarMotivosPerdaConfiguracao(),
        listarProdutos(),
        listarCamposOrcamentoConfiguracao(),
        listarCamposPedidoConfiguracao(),
        listarEtapasPedidoConfiguracao(),
        listarEmpresas()
      ]);

      const clientesCarteira = usuarioSomenteVendedor
        ? clientesCarregados.filter((cliente) => cliente.idVendedor === usuarioLogado.idVendedor)
        : clientesCarregados;
      const idsClientesCarteira = new Set(clientesCarteira.map((cliente) => cliente.idCliente));
      const orcamentosVisiveis = usuarioSomenteVendedor
        ? orcamentosCarregados.filter((orcamento) => (
          idsClientesCarteira.has(orcamento.idCliente)
          || String(orcamento.idUsuario) === String(usuarioLogado.idUsuario)
        ))
        : orcamentosCarregados;
      const clientesDisponiveis = usuarioSomenteVendedor ? clientesCarteira : clientesCarregados;
      const idsClientesDisponiveis = new Set(clientesDisponiveis.map((cliente) => cliente.idCliente));

      definirOrcamentos(
        enriquecerOrcamentos(
          orcamentosVisiveis,
          clientesDisponiveis,
          contatosCarregados,
          usuariosCarregados,
          vendedoresCarregados,
          enriquecerPrazosPagamento(prazosCarregados, metodosCarregados),
          etapasCarregadas,
          produtosCarregados
        )
      );
      definirClientes(clientesDisponiveis);
      definirContatos(contatosCarregados.filter((contato) => idsClientesDisponiveis.has(contato.idCliente)));
      definirUsuarios(usuariosCarregados);
      definirVendedores(vendedoresCarregados);
      definirMetodosPagamento(metodosCarregados);
      definirPrazosPagamento(enriquecerPrazosPagamento(prazosCarregados, metodosCarregados));
      definirEtapasOrcamento(etapasCarregadas);
      definirMotivosPerda(motivosPerdaCarregados);
      definirProdutos(produtosCarregados.filter((produto) => produto.status !== 0));
      definirCamposOrcamento(camposCarregados);
      definirCamposPedido(camposPedidoCarregados);
      definirEtapasPedido(etapasPedidoCarregadas);
      definirEmpresa(empresasCarregadas[0] || null);
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os orcamentos.');
    } finally {
      definirCarregando(false);
    }
  }

  async function salvarOrcamento(dadosOrcamento) {
    const payload = normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado);
    const etapaAnterior = orcamentoSelecionado?.idEtapaOrcamento || null;
    const etapaAtual = dadosOrcamento.idEtapaOrcamento || null;
    let registroSalvo = null;

    if (orcamentoSelecionado?.idOrcamento) {
      registroSalvo = await atualizarOrcamento(orcamentoSelecionado.idOrcamento, payload);
    } else {
      registroSalvo = await incluirOrcamento(payload);
    }

    await carregarDados();
    fecharModal();

    if (etapaAcabouDeFechar(etapaAnterior, etapaAtual, etapasOrcamento) && !registroSalvo?.idPedidoVinculado) {
      const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
        registroSalvo || { ...dadosOrcamento, idOrcamento: orcamentoSelecionado?.idOrcamento },
        {
          clientes,
          contatos,
          usuarios,
          vendedores,
          prazosPagamento,
          etapasOrcamento,
          produtos
        }
      );

      const pendenciaPedido = {
        dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
        idOrcamento: orcamentoEnriquecido.idOrcamento,
        idEtapaAnterior: etapaAnterior
      };

      if (dadosOrcamento.solicitarPedidoAoSalvar) {
        definirOrcamentoPedidoEmCriacao(pendenciaPedido);
        definirDadosIniciaisPedido(pendenciaPedido.dadosPedido);
        definirModalPedidoAberto(true);
        return;
      }

      definirOrcamentoPedidoPendente(pendenciaPedido);
    }
  }

  async function alterarEtapaRapidamente(orcamento, idEtapaOrcamento, idMotivoPerda = null) {
    const payload = normalizarPayloadOrcamento(
      {
        ...orcamento,
        idEtapaOrcamento,
        idMotivoPerda
      },
      usuarioLogado
    );

    const registroAtualizado = await atualizarOrcamento(orcamento.idOrcamento, payload);
    await carregarDados();
    return registroAtualizado;
  }

  async function selecionarEtapaNoGrid(orcamento, proximoIdEtapa) {
    if (orcamento.idPedidoVinculado) {
      return;
    }

    const valorEtapa = String(proximoIdEtapa || '').trim();

    if (!valorEtapa || String(orcamento.idEtapaOrcamento || '') === valorEtapa) {
      return;
    }

    const etapaSelecionada = etapasOrcamento.find(
      (etapa) => String(etapa.idEtapaOrcamento) === valorEtapa
    );

    if (etapaSelecionada?.obrigarMotivoPerda && !String(orcamento.idMotivoPerda || '').trim()) {
      definirAlteracaoEtapaPendente({
        orcamento,
        idEtapaOrcamento: valorEtapa,
        nomeEtapa: etapaSelecionada.descricao
      });
      definirMotivoPerdaEtapaRapida('');
      return;
    }

    const registroAtualizado = await alterarEtapaRapidamente(
      orcamento,
      Number(valorEtapa),
      etapaSelecionada?.obrigarMotivoPerda ? orcamento.idMotivoPerda || null : null
    );

    if (etapaAcabouDeFechar(orcamento.idEtapaOrcamento, valorEtapa, etapasOrcamento) && !registroAtualizado?.idPedidoVinculado) {
      const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
        registroAtualizado || { ...orcamento, idEtapaOrcamento: Number(valorEtapa) },
        {
          clientes,
          contatos,
          usuarios,
          vendedores,
          prazosPagamento,
          etapasOrcamento,
          produtos
        }
      );

      definirOrcamentoPedidoPendente({
        dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
        idOrcamento: orcamento.idOrcamento,
        idEtapaAnterior: orcamento.idEtapaOrcamento || null
      });
    }
  }

  function abrirNovoOrcamento() {
    definirOrcamentoSelecionado(null);
    definirModoModal('novo');
    definirModalAberto(true);
  }

  function abrirEdicaoOrcamento(orcamento) {
    definirOrcamentoSelecionado(orcamento);
    definirModoModal('edicao');
    definirModalAberto(true);
  }

  function abrirConsultaOrcamento(orcamento) {
    definirOrcamentoSelecionado(orcamento);
    definirModoModal('consulta');
    definirModalAberto(true);
  }

  function fecharModal() {
    definirModalAberto(false);
    definirOrcamentoSelecionado(null);
    definirModoModal('novo');
  }

  function abrirExclusaoOrcamento(orcamento) {
    if (!permitirExcluir || orcamento.idPedidoVinculado) {
      return;
    }

    definirOrcamentoExclusaoPendente(orcamento);
  }

  function cancelarExclusaoOrcamento() {
    definirOrcamentoExclusaoPendente(null);
  }

  async function confirmarExclusaoOrcamento() {
    if (!orcamentoExclusaoPendente) {
      return;
    }

    await excluirOrcamento(orcamentoExclusaoPendente.idOrcamento);
    definirOrcamentoExclusaoPendente(null);
    await carregarDados();
  }

  function abrirPedidoAPartirDoOrcamento() {
    if (!orcamentoPedidoPendente) {
      return;
    }

    definirOrcamentoPedidoEmCriacao(orcamentoPedidoPendente);
    definirDadosIniciaisPedido(orcamentoPedidoPendente.dadosPedido);
    definirModalPedidoAberto(true);
    definirOrcamentoPedidoPendente(null);
  }

  async function cancelarCriacaoPedido() {
    const pendencia = orcamentoPedidoPendente || orcamentoPedidoEmCriacao;

    if (!pendencia?.idOrcamento) {
      definirOrcamentoPedidoPendente(null);
      definirOrcamentoPedidoEmCriacao(null);
      return;
    }

    const orcamentoAtual = orcamentos.find((item) => item.idOrcamento === pendencia.idOrcamento);
    const etapaFechadoSemPedido = obterEtapaFechadoSemPedido(etapasOrcamento);

    if (orcamentoAtual && etapaFechadoSemPedido?.idEtapaOrcamento) {
      await alterarEtapaRapidamente(
        orcamentoAtual,
        Number(etapaFechadoSemPedido.idEtapaOrcamento),
        orcamentoAtual.idMotivoPerda || null
      );
    } else {
      await carregarDados();
    }

    definirOrcamentoPedidoPendente(null);
    definirOrcamentoPedidoEmCriacao(null);
  }

  function fecharModalPedido() {
    definirModalPedidoAberto(false);
    definirDadosIniciaisPedido(null);
    if (orcamentoPedidoEmCriacao) {
      cancelarCriacaoPedido();
    }
  }

  async function salvarPedido(dadosPedido) {
    await incluirPedido(normalizarPayloadPedido(dadosPedido));
    await carregarDados();
    definirOrcamentoPedidoEmCriacao(null);
    fecharModalPedido();
  }

  const orcamentosFiltrados = useMemo(
    () => filtrarOrcamentos(orcamentos, pesquisa, filtros),
    [orcamentos, pesquisa, filtros]
  );
  const filtrosIniciais = useMemo(
    () => criarFiltrosIniciaisOrcamentos(usuarioLogado, empresa),
    [usuarioLogado?.idUsuario, usuarioLogado?.idVendedor, empresa?.etapasFiltroPadraoOrcamento]
  );
  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(filtrosIniciais);

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Orcamentos</h1>
          <p>Cadastre, acompanhe e organize as propostas comerciais do CRM.</p>
        </div>

        <div className="acoesCabecalhoPagina">
          <CampoPesquisa
            valor={pesquisa}
            aoAlterar={definirPesquisa}
            placeholder="Pesquisar orcamentos"
            ariaLabel="Pesquisar orcamentos"
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
            title="Novo orcamento"
            aria-label="Novo orcamento"
            onClick={abrirNovoOrcamento}
          />
        </div>
      </header>

      <CorpoPagina>
        <GradePadrao
          cabecalho={<CabecalhoGradeOrcamentos />}
          carregando={carregando}
          mensagemErro={mensagemErro}
          temItens={orcamentosFiltrados.length > 0}
          mensagemCarregando="Carregando orcamentos..."
          mensagemVazia="Nenhum orcamento encontrado."
        >
          {orcamentosFiltrados.map((orcamento) => (
            <LinhaOrcamento
              key={orcamento.idOrcamento}
              orcamento={orcamento}
              etapasOrcamento={etapasOrcamento}
              permitirExcluir={permitirExcluir}
              aoAlterarEtapa={(idEtapaOrcamento) => selecionarEtapaNoGrid(orcamento, idEtapaOrcamento)}
              aoConsultar={() => abrirConsultaOrcamento(orcamento)}
              aoEditar={() => abrirEdicaoOrcamento(orcamento)}
              aoExcluir={() => abrirExclusaoOrcamento(orcamento)}
            />
          ))}
        </GradePadrao>
      </CorpoPagina>

      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros de orcamentos"
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
            name: 'idVendedor',
            label: 'Vendedor do orcamento',
            options: vendedores.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'idsEtapaOrcamento',
            label: 'Status do orcamento',
            multiple: true,
            tituloSelecao: 'Status do orcamento',
            options: etapasOrcamento.map((etapa) => ({
              valor: String(etapa.idEtapaOrcamento),
              label: etapa.descricao
            }))
          }
        ]}
        aoFechar={() => definirModalFiltrosAberto(false)}
        aoAplicar={(proximosFiltros) => {
          definirFiltros(proximosFiltros);
          definirModalFiltrosAberto(false);
        }}
        aoLimpar={() => definirFiltros(criarFiltrosLimposOrcamentos(usuarioLogado, empresa))}
      />

      <ModalOrcamento
        aberto={modalAberto}
        orcamento={orcamentoSelecionado}
        clientes={clientes}
        contatos={contatos}
        usuarios={usuarios}
        vendedores={vendedores}
        prazosPagamento={prazosPagamento}
        etapasOrcamento={etapasOrcamento}
        motivosPerda={motivosPerda}
        produtos={produtos}
        camposOrcamento={camposOrcamento}
        empresa={empresa}
        usuarioLogado={usuarioLogado}
        modo={modoModal}
        aoFechar={fecharModal}
        aoSalvar={salvarOrcamento}
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
        aoSalvar={salvarPedido}
      />

      {orcamentoExclusaoPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={cancelarExclusaoOrcamento}>
          <div
            className="modalConfirmacaoAgenda"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacaoExclusaoOrcamento"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloConfirmacaoExclusaoOrcamento">Excluir orcamento</h4>
            </div>

            <div className="corpoConfirmacaoModal">
              <p>Tem certeza que deseja excluir este orcamento?</p>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao variante="secundario" type="button" onClick={cancelarExclusaoOrcamento}>
                Nao
              </Botao>
              <Botao variante="perigo" type="button" onClick={confirmarExclusaoOrcamento}>
                Sim
              </Botao>
            </div>
          </div>
        </div>
      ) : null}

      {alteracaoEtapaPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={() => definirAlteracaoEtapaPendente(null)}>
          <div
            className="modalConfirmacaoAgenda modalEtapaRapidaOrcamento"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloMotivoPerdaEtapaRapida"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloMotivoPerdaEtapaRapida">Motivo da perda</h4>
            </div>

            <div className="corpoConfirmacaoModal corpoModalEtapaRapidaOrcamento">
              <p>
                A etapa <strong>{alteracaoEtapaPendente.nomeEtapa}</strong> exige um motivo da perda.
              </p>
              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="motivoPerdaEtapaRapida">Selecione o motivo</label>
                <select
                  id="motivoPerdaEtapaRapida"
                  className="entradaFormulario"
                  value={motivoPerdaEtapaRapida}
                  onChange={(evento) => definirMotivoPerdaEtapaRapida(evento.target.value)}
                >
                  <option value="">Selecione</option>
                  {motivosPerda.map((motivo) => (
                    <option key={motivo.idMotivo} value={motivo.idMotivo}>
                      {motivo.descricao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao
                variante="secundario"
                type="button"
                onClick={() => {
                  definirAlteracaoEtapaPendente(null);
                  definirMotivoPerdaEtapaRapida('');
                }}
              >
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                type="button"
                onClick={async () => {
                  if (!String(motivoPerdaEtapaRapida || '').trim()) {
                    return;
                  }

                  const alteracao = alteracaoEtapaPendente;
                  const motivoSelecionado = motivoPerdaEtapaRapida;
                  definirAlteracaoEtapaPendente(null);
                  definirMotivoPerdaEtapaRapida('');
                  const registroAtualizado = await alterarEtapaRapidamente(
                    alteracao.orcamento,
                    Number(alteracao.idEtapaOrcamento),
                    Number(motivoSelecionado)
                  );

                  if (etapaAcabouDeFechar(
                    alteracao.orcamento.idEtapaOrcamento,
                    alteracao.idEtapaOrcamento,
                    etapasOrcamento
                  ) && !registroAtualizado?.idPedidoVinculado) {
                    const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
                      registroAtualizado || {
                        ...alteracao.orcamento,
                        idEtapaOrcamento: Number(alteracao.idEtapaOrcamento),
                        idMotivoPerda: Number(motivoSelecionado)
                      },
                      {
                        clientes,
                        contatos,
                        usuarios,
                        vendedores,
                        prazosPagamento,
                        etapasOrcamento,
                        produtos
                      }
                    );

                    definirOrcamentoPedidoPendente({
                      dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
                      idOrcamento: alteracao.orcamento.idOrcamento,
                      idEtapaAnterior: alteracao.orcamento.idEtapaOrcamento || null
                    });
                  }
                }}
              >
                Confirmar
              </Botao>
            </div>
          </div>
        </div>
      ) : null}

      {orcamentoPedidoPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={cancelarCriacaoPedido}>
          <div
            className="modalConfirmacaoAgenda"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacaoCriarPedido"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloConfirmacaoCriarPedido">Criar pedido</h4>
            </div>

            <div className="corpoConfirmacaoModal">
              <p>Este orcamento foi fechado. Deseja criar um pedido a partir dele?</p>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao variante="secundario" type="button" onClick={cancelarCriacaoPedido}>
                Nao
              </Botao>
              <Botao variante="primario" type="button" onClick={abrirPedidoAPartirDoOrcamento}>
                Sim
              </Botao>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CabecalhoGradeOrcamentos() {
  return (
    <tr className="cabecalhoGradeOrcamentos">
      <th>Codigo</th>
      <th>Cliente</th>
      <th>Etapa</th>
      <th>Vendedor</th>
      <th>Total</th>
      <th>Acoes</th>
    </tr>
  );
}

function LinhaOrcamento({
  orcamento,
  etapasOrcamento,
  permitirExcluir,
  aoAlterarEtapa,
  aoConsultar,
  aoEditar,
  aoExcluir
}) {
  return (
    <tr className="linhaOrcamento">
      <td>
        <CodigoRegistro valor={orcamento.idOrcamento} />
      </td>
      <td>
        <div className="celulaRegistroDetalhes">
          <div className="topoRegistroDetalhes">
            <strong>{orcamento.nomeCliente}</strong>
          </div>
          <span className="textoSecundarioRegistro">{orcamento.nomeContato || 'Sem contato'}</span>
        </div>
      </td>
      <td>
        <div className="campoEtapaGridOrcamento">
          <select
            className="selectEtapaGridOrcamento"
            style={criarEstiloEtapaOrcamento(orcamento.corEtapaOrcamento)}
            value={orcamento.idEtapaOrcamento ? String(orcamento.idEtapaOrcamento) : ''}
            onChange={(evento) => aoAlterarEtapa(evento.target.value)}
            aria-label={`Alterar etapa do orcamento ${orcamento.idOrcamento}`}
            disabled={Boolean(orcamento.idPedidoVinculado)}
          >
            <option value="">Sem etapa</option>
            {etapasOrcamento.map((etapa) => (
              <option key={etapa.idEtapaOrcamento} value={etapa.idEtapaOrcamento}>
                {etapa.descricao}
              </option>
            ))}
          </select>
        </div>
      </td>
      <td>{orcamento.nomeVendedor || 'Nao informado'}</td>
      <td>{normalizarPreco(orcamento.totalOrcamento)}</td>
      <td>
        <AcoesRegistro
          rotuloConsulta="Consultar orcamento"
          rotuloEdicao="Editar orcamento"
          rotuloInativacao="Excluir orcamento"
          iconeInativacao="limpar"
          exibirInativacao={permitirExcluir && !orcamento.idPedidoVinculado}
          aoConsultar={aoConsultar}
          aoEditar={aoEditar}
          aoInativar={aoExcluir}
        />
      </td>
    </tr>
  );
}

function filtrarOrcamentos(orcamentos, pesquisa, filtros) {
  const termo = String(pesquisa || '').trim().toLowerCase();

  return orcamentos.filter((orcamento) => {
    const atendePesquisa = !termo || [
      orcamento.nomeCliente,
      orcamento.nomeContato,
      orcamento.nomeUsuario,
      orcamento.nomeVendedor,
      orcamento.nomeVendedorCliente,
      orcamento.nomePrazoPagamento,
      orcamento.nomeEtapaOrcamento,
      orcamento.observacao
    ].some((valor) => String(valor || '').toLowerCase().includes(termo));

    const atendeFiltros = (
      (!filtros.idCliente || String(orcamento.idCliente) === String(filtros.idCliente))
      && (!filtros.idUsuario || String(orcamento.idUsuario) === String(filtros.idUsuario))
      && (!filtros.idVendedorCliente || String(orcamento.idVendedorCliente) === String(filtros.idVendedorCliente))
      && (!filtros.idVendedor || String(orcamento.idVendedor) === String(filtros.idVendedor))
      && (
        !Array.isArray(filtros.idsEtapaOrcamento)
        || filtros.idsEtapaOrcamento.length === 0
        || filtros.idsEtapaOrcamento.includes(String(orcamento.idEtapaOrcamento))
      )
    );

    return atendePesquisa && atendeFiltros;
  });
}

function enriquecerOrcamentos(orcamentos, clientes, contatos, usuarios, vendedores, prazosPagamento, etapasOrcamento, produtos) {
  const clientesPorId = new Map(
    clientes.map((cliente) => [cliente.idCliente, cliente])
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
  const prazosPorId = new Map(
    prazosPagamento.map((prazo) => [prazo.idPrazoPagamento, prazo])
  );
  const etapasPorId = new Map(
    etapasOrcamento.map((etapa) => [etapa.idEtapaOrcamento, etapa])
  );
  const produtosPorId = new Map(
    produtos.map((produto) => [produto.idProduto, produto])
  );

  return orcamentos.map((orcamento) => {
    const cliente = clientesPorId.get(orcamento.idCliente);
    const totalOrcamento = Array.isArray(orcamento.itens)
      ? orcamento.itens.reduce((total, item) => total + (Number(item.valorTotal) || 0), 0)
      : 0;

    return {
      ...orcamento,
      itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => ({
        ...item,
        nomeProduto: produtosPorId.get(item.idProduto)?.descricao || 'Produto nao informado'
      })) : [],
      nomeCliente: cliente?.nomeFantasia || cliente?.razaoSocial || 'Nao informado',
      nomeContato: contatosPorId.get(orcamento.idContato) || '',
      idVendedorCliente: cliente?.idVendedor || null,
      nomeVendedorCliente: vendedoresPorId.get(cliente?.idVendedor) || 'Nao informado',
      nomeUsuario: usuariosPorId.get(orcamento.idUsuario) || 'Nao informado',
      nomeVendedor: vendedoresPorId.get(orcamento.idVendedor) || 'Nao informado',
      nomeMetodoPagamento: prazosPorId.get(orcamento.idPrazoPagamento)?.nomeMetodoPagamento || '',
      nomePrazoPagamento: prazosPorId.get(orcamento.idPrazoPagamento)?.descricaoFormatada || '',
      nomePrazoPagamentoDias: prazosPorId.get(orcamento.idPrazoPagamento)?.descricaoDias || '',
      nomeEtapaOrcamento: etapasPorId.get(orcamento.idEtapaOrcamento)?.descricao || '',
      corEtapaOrcamento: etapasPorId.get(orcamento.idEtapaOrcamento)?.cor || '',
      obrigarMotivoPerdaEtapa: Boolean(etapasPorId.get(orcamento.idEtapaOrcamento)?.obrigarMotivoPerda),
      totalOrcamento
    };
  });
}

function enriquecerPrazosPagamento(prazosPagamento, metodosPagamento = []) {
  const metodosPorId = new Map(
    metodosPagamento.map((metodo) => [metodo.idMetodoPagamento, metodo.descricao])
  );

  return prazosPagamento.map((prazo) => {
    const parcelas = [prazo.prazo1, prazo.prazo2, prazo.prazo3, prazo.prazo4, prazo.prazo5, prazo.prazo6]
      .filter((valor) => valor !== null && valor !== undefined && valor !== '')
      .join(' / ');
    const descricaoFormatada = prazo.descricao || (parcelas ? `${parcelas} dias` : 'Prazo sem descricao');
    const descricaoDias = parcelas ? `${parcelas} dias` : '';

    return {
      ...prazo,
      nomeMetodoPagamento: metodosPorId.get(prazo.idMetodoPagamento) || '',
      descricaoDias,
      descricaoFormatada
    };
  });
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
    itens: dadosOrcamento.itens.map((item) => ({
      idProduto: Number(item.idProduto),
      quantidade: normalizarNumeroDecimal(item.quantidade),
      valorUnitario: normalizarNumeroDecimal(item.valorUnitario),
      valorTotal: normalizarNumeroDecimal(item.valorTotal),
      imagem: limparTextoOpcional(item.imagem),
      observacao: limparTextoOpcional(item.observacao)
    })),
    camposExtras: dadosOrcamento.camposExtras.map((campo) => ({
      idCampoOrcamento: Number(campo.idCampoOrcamento),
      valor: limparTextoOpcional(campo.valor)
    }))
  };
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

function limparTextoOpcional(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
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

function criarEstiloEtapaOrcamento(cor) {
  const corBase = normalizarCorHexadecimal(cor || '#1791e2');

  return {
    background: converterHexParaRgba(corBase, 0.22),
    color: escurecerCorHexadecimal(corBase, 0.18)
  };
}

function obterEtapasFiltroPadraoOrcamento(empresa) {
  if (!empresa?.etapasFiltroPadraoOrcamento) {
    return [];
  }

  try {
    const lista = JSON.parse(empresa.etapasFiltroPadraoOrcamento);
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch (_erro) {
    return String(empresa.etapasFiltroPadraoOrcamento)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
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

function enriquecerOrcamentoParaPedido(orcamento, contexto) {
  const cliente = contexto.clientes.find((item) => String(item.idCliente) === String(orcamento.idCliente));
  const contato = contexto.contatos.find((item) => String(item.idContato) === String(orcamento.idContato));
  const usuario = contexto.usuarios.find((item) => String(item.idUsuario) === String(orcamento.idUsuario));
  const vendedor = contexto.vendedores.find((item) => String(item.idVendedor) === String(orcamento.idVendedor));
  const prazo = contexto.prazosPagamento.find((item) => String(item.idPrazoPagamento) === String(orcamento.idPrazoPagamento));
  const etapa = contexto.etapasOrcamento.find((item) => String(item.idEtapaOrcamento) === String(orcamento.idEtapaOrcamento));

  return {
    ...orcamento,
    nomeCliente: orcamento.nomeCliente || cliente?.nomeFantasia || cliente?.razaoSocial || '',
    nomeContato: orcamento.nomeContato || contato?.nome || '',
    nomeUsuario: orcamento.nomeUsuario || usuario?.nome || '',
    nomeVendedor: orcamento.nomeVendedor || vendedor?.nome || '',
    nomePrazoPagamento: orcamento.nomePrazoPagamento || prazo?.descricaoFormatada || prazo?.descricao || '',
    nomeMetodoPagamento: orcamento.nomeMetodoPagamento || prazo?.nomeMetodoPagamento || '',
    nomeEtapaOrcamento: orcamento.nomeEtapaOrcamento || etapa?.descricao || '',
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

function obterDataAtualFormatoInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function normalizarCorHexadecimal(cor) {
  const texto = String(cor || '').trim();
  return /^#([0-9a-fA-F]{6})$/.test(texto) ? texto : '#1791e2';
}

function escurecerCorHexadecimal(cor, intensidade = 0.2) {
  const corNormalizada = normalizarCorHexadecimal(cor).replace('#', '');
  const fator = Math.max(0, Math.min(1, 1 - intensidade));
  const vermelho = Math.round(Number.parseInt(corNormalizada.slice(0, 2), 16) * fator);
  const verde = Math.round(Number.parseInt(corNormalizada.slice(2, 4), 16) * fator);
  const azul = Math.round(Number.parseInt(corNormalizada.slice(4, 6), 16) * fator);

  return `#${[vermelho, verde, azul].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
}

function converterHexParaRgba(cor, opacidade = 1) {
  const corNormalizada = normalizarCorHexadecimal(cor).replace('#', '');
  const vermelho = Number.parseInt(corNormalizada.slice(0, 2), 16);
  const verde = Number.parseInt(corNormalizada.slice(2, 4), 16);
  const azul = Number.parseInt(corNormalizada.slice(4, 6), 16);

  return `rgba(${vermelho}, ${verde}, ${azul}, ${opacidade})`;
}
