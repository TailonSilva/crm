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
import { listarUsuarios } from '../../servicos/usuarios';
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

export function PaginaAtendimentos({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const [filtros, definirFiltros] = useState(() => criarFiltrosIniciaisAtendimentos(usuarioLogado));
  const [atendimentos, definirAtendimentos] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [ramosAtividade, definirRamosAtividade] = useState([]);
  const [canaisAtendimento, definirCanaisAtendimento] = useState([]);
  const [origensAtendimento, definirOrigensAtendimento] = useState([]);
  const [carregando, definirCarregando] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [atendimentoSelecionado, definirAtendimentoSelecionado] = useState(null);
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
        ramosCarregados,
        canaisCarregados,
        origensCarregadas
      ] = await Promise.all([
        listarAtendimentos(),
        listarClientes(),
        listarContatos(),
        listarUsuarios(),
        listarVendedores(),
        listarRamosAtividade(),
        listarCanaisAtendimento(),
        listarOrigensAtendimento()
      ]);

      const clientesCarteira = usuarioSomenteVendedor
        ? clientesCarregados.filter((cliente) => cliente.idVendedor === usuarioLogado.idVendedor)
        : clientesCarregados;
      const idsClientesCarteira = new Set(clientesCarteira.map((cliente) => cliente.idCliente));
      const atendimentosVisiveis = usuarioSomenteVendedor
        ? atendimentosCarregados.filter((atendimento) => (
          idsClientesCarteira.has(atendimento.idCliente)
          || String(atendimento.idUsuario) === String(usuarioLogado.idUsuario)
        ))
        : atendimentosCarregados;
      const idsClientesVisiveis = new Set(
        atendimentosVisiveis
          .map((atendimento) => atendimento.idCliente)
          .filter(Boolean)
      );
      const clientesVisiveis = clientesCarregados.filter((cliente) => idsClientesVisiveis.has(cliente.idCliente));

      definirAtendimentos(
        enriquecerAtendimentos(
          atendimentosVisiveis,
          clientesVisiveis,
          contatosCarregados,
          usuariosCarregados,
          vendedoresCarregados,
          canaisCarregados,
          origensCarregadas
        )
      );
      definirClientes(clientesVisiveis);
      definirContatos(contatosCarregados.filter((contato) => idsClientesVisiveis.has(contato.idCliente)));
      definirUsuarios(usuariosCarregados);
      definirVendedores(vendedoresCarregados);
      definirRamosAtividade(ramosCarregados);
      definirCanaisAtendimento(canaisCarregados);
      definirOrigensAtendimento(origensCarregadas);
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
        aoFechar={fecharModal}
        aoSalvar={salvarAtendimento}
        aoExcluir={excluirRegistroAtendimento}
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
