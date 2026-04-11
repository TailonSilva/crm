import { useEffect, useMemo, useState } from 'react';
import { CabecalhoClientes } from './cabecalhoClientes';
import { CorpoClientes } from './corpoClientes';
import {
  atualizarCliente,
  atualizarContato,
  atualizarGrupoEmpresa,
  atualizarRamoAtividade,
  incluirGrupoEmpresa,
  incluirRamoAtividade,
  incluirCliente,
  incluirContato,
  importarClientesPlanilha,
  listarClientesGrid,
  listarContatos,
  listarGruposEmpresa,
  listarRamosAtividade,
  listarVendedores
} from '../../servicos/clientes';
import { atualizarEmpresa, criarPayloadAtualizacaoColunasGrid, listarEmpresas } from '../../servicos/empresa';
import {
  atualizarContatoGrupoEmpresa,
  incluirContatoGrupoEmpresa,
  listarContatosGruposEmpresaConfiguracao
} from '../../servicos/configuracoes';
import { normalizarTelefone } from '../../utilitarios/normalizarTelefone';
import { obterPrimeiroCodigoDisponivel } from '../../utilitarios/obterPrimeiroCodigoDisponivel';
import { obterValorGrid } from '../../utilitarios/valorPadraoGrid';
import {
  normalizarFiltrosPorPadrao,
  normalizarListaFiltroPersistido,
  useFiltrosPersistidos
} from '../../utilitarios/useFiltrosPersistidos';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { ModalCliente } from './modalCliente';
import { ModalImportacaoCadastro } from '../../componentes/comuns/modalImportacaoCadastro';
import { ModalManualClientes } from './modalManualClientes';
import { ModalColunasGridClientes } from '../configuracoes/modalColunasGridClientes';

const filtrosIniciaisClientes = {
  estado: [],
  cidade: '',
  idGrupoEmpresa: '',
  idRamo: [],
  idVendedor: [],
  tipo: [],
  status: []
};

export function PaginaClientes({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [gruposEmpresa, definirGruposEmpresa] = useState([]);
  const [contatosGruposEmpresa, definirContatosGruposEmpresa] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [vendedores, definirVendedores] = useState([]);
  const [ramosAtividade, definirRamosAtividade] = useState([]);
  const [carregandoContexto, definirCarregandoContexto] = useState(true);
  const [carregandoGrade, definirCarregandoGrade] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalManualAberto, definirModalManualAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalImportacaoAberto, definirModalImportacaoAberto] = useState(false);
  const [modalColunasGridAberto, definirModalColunasGridAberto] = useState(false);
  const [resultadoImportacao, definirResultadoImportacao] = useState(null);
  const [importando, definirImportando] = useState(false);
  const [clienteEmEdicao, definirClienteEmEdicao] = useState(null);
  const [modoModalCliente, definirModoModalCliente] = useState('novo');
  const filtrosIniciais = useMemo(() => ({
    ...filtrosIniciaisClientes,
    idVendedor: []
  }), []);
  const [filtros, definirFiltros] = useFiltrosPersistidos({
    chave: 'paginaClientes',
    usuario: usuarioLogado,
    filtrosPadrao: filtrosIniciais,
    normalizarFiltros: normalizarFiltrosClientes
  });

  useEffect(() => {
    carregarContexto();
  }, []);

  useEffect(() => {
    carregarGradeClientes();
  }, [pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarGrupoEmpresaAtualizado() {
      carregarContexto();
      carregarGradeClientes();
    }

    window.addEventListener('grupo-empresa-atualizado', tratarGrupoEmpresaAtualizado);

    return () => {
      window.removeEventListener('grupo-empresa-atualizado', tratarGrupoEmpresaAtualizado);
    };
  }, [pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarEmpresaAtualizada() {
      carregarContexto();
      carregarGradeClientes();
    }

    window.addEventListener('empresa-atualizada', tratarEmpresaAtualizada);

    return () => {
      window.removeEventListener('empresa-atualizada', tratarEmpresaAtualizada);
    };
  }, [pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarAtalhosClientes(evento) {
      if (evento.key !== 'F1') {
        return;
      }

      evento.preventDefault();

      if (!modalAberto && !modalManualAberto && !modalFiltrosAberto && !modalImportacaoAberto) {
        definirModalManualAberto(true);
      }
    }

    window.addEventListener('keydown', tratarAtalhosClientes);

    return () => {
      window.removeEventListener('keydown', tratarAtalhosClientes);
    };
  }, [modalAberto, modalManualAberto, modalFiltrosAberto, modalImportacaoAberto]);

  async function carregarContexto() {
    definirCarregandoContexto(true);
    try {
      const resultados = await Promise.allSettled([
        listarContatos(),
        listarGruposEmpresa({ incluirInativos: true }),
        listarContatosGruposEmpresaConfiguracao({ incluirInativos: true }),
        listarEmpresas(),
        listarVendedores(),
        listarRamosAtividade()
      ]);

      const [
        contatosResultado,
        gruposEmpresaResultado,
        contatosGrupoResultado,
        empresasResultado,
        vendedoresResultado,
        ramosResultado
      ] = resultados;

      definirContatos(contatosResultado.status === 'fulfilled' ? contatosResultado.value : []);
      definirGruposEmpresa(gruposEmpresaResultado.status === 'fulfilled' ? gruposEmpresaResultado.value : []);
      definirContatosGruposEmpresa(contatosGrupoResultado.status === 'fulfilled' ? contatosGrupoResultado.value : []);
      definirEmpresa(
        empresasResultado.status === 'fulfilled'
          ? (empresasResultado.value[0] || null)
          : null
      );
      definirVendedores(vendedoresResultado.status === 'fulfilled' ? vendedoresResultado.value : []);
      definirRamosAtividade(ramosResultado.status === 'fulfilled' ? ramosResultado.value : []);
    } finally {
      definirCarregandoContexto(false);
    }
  }

  async function carregarGradeClientes() {
    definirCarregandoGrade(true);
    definirMensagemErro('');

    try {
      const clientesCarregados = await listarClientesGrid({
        pesquisa,
        filtros
      });

      definirClientes(
        enriquecerClientes(
          clientesCarregados,
          contatos,
          vendedores,
          gruposEmpresa,
          ramosAtividade
        )
      );
    } catch (erro) {
      definirMensagemErro(erro?.message || 'Nao foi possivel carregar os clientes.');
    } finally {
      definirCarregandoGrade(false);
    }
  }

  async function recarregarPagina() {
    await Promise.all([carregarContexto(), carregarGradeClientes()]);
  }

  async function salvarColunasGridClientes(dadosColunas) {
    if (!empresa?.idEmpresa) {
      throw new Error('Cadastre a empresa antes de configurar as colunas do grid.');
    }

    await atualizarEmpresa(
      empresa.idEmpresa,
      criarPayloadAtualizacaoColunasGrid('colunasGridClientes', dadosColunas.colunasGridClientes)
    );

    const empresasAtualizadas = await listarEmpresas();
    definirEmpresa(empresasAtualizadas[0] || null);
    window.dispatchEvent(new CustomEvent('empresa-atualizada'));
    definirModalColunasGridAberto(false);
  }

  async function salvarCliente(dadosCliente) {
    const payload = normalizarPayloadCliente({
      ...dadosCliente,
      idVendedor: dadosCliente.idVendedor,
      idCliente: clienteEmEdicao?.idCliente || proximoCodigoCliente
    });
    let clienteSalvo;

    if (clienteEmEdicao?.idCliente) {
      clienteSalvo = await atualizarCliente(clienteEmEdicao.idCliente, payload);
    } else {
      clienteSalvo = await incluirCliente(payload);
    }

    await salvarContatosCliente(
      clienteSalvo.idCliente,
      dadosCliente.contatos || []
    );

    await recarregarPagina();
    definirModalAberto(false);
    definirClienteEmEdicao(null);
  }

  async function importarClientes(linhas) {
    definirImportando(true);

    try {
      const resultado = await importarClientesPlanilha({
        linhas,
        idVendedorPadrao: null
      });

      definirResultadoImportacao(resultado);
      await recarregarPagina();
    } finally {
      definirImportando(false);
    }
  }

  async function salvarRamoAtividade(dadosRamo) {
    const payload = {
      descricao: String(dadosRamo.descricao || '').trim(),
      status: dadosRamo.status ? 1 : 0
    };

    let ramoSalvo;

    if (dadosRamo.idRamo) {
      ramoSalvo = await atualizarRamoAtividade(dadosRamo.idRamo, payload);
    } else {
      ramoSalvo = await incluirRamoAtividade(payload);
    }

    const ramosAtualizados = await listarRamosAtividade();
    definirRamosAtividade(ramosAtualizados);

    return ramoSalvo;
  }

  async function salvarGrupoEmpresa(dadosGrupo) {
    const payloadGrupo = {
      descricao: String(dadosGrupo.descricao || '').trim(),
      status: dadosGrupo.status ? 1 : 0
    };

    let grupoSalvo;

    if (dadosGrupo.idGrupoEmpresa) {
      grupoSalvo = await atualizarGrupoEmpresa(dadosGrupo.idGrupoEmpresa, payloadGrupo);
    } else {
      grupoSalvo = await incluirGrupoEmpresa(payloadGrupo);
    }

    const idGrupoEmpresa = grupoSalvo?.idGrupoEmpresa || dadosGrupo.idGrupoEmpresa;

    for (const contato of normalizarContatosGrupoEmpresa(dadosGrupo.contatos, idGrupoEmpresa)) {
      if (contato.idContatoGrupoEmpresa) {
        await atualizarContatoGrupoEmpresa(contato.idContatoGrupoEmpresa, contato);
      } else {
        await incluirContatoGrupoEmpresa(contato);
      }
    }

    await recarregarPagina();
    window.dispatchEvent(new CustomEvent('grupo-empresa-atualizado'));
    return grupoSalvo;
  }

  async function inativarRamoAtividadeCliente(registro) {
    await atualizarRamoAtividade(registro.idRamo, { status: 0 });
    const ramosAtualizados = await listarRamosAtividade();
    definirRamosAtividade(ramosAtualizados);
  }

  async function inativarGrupoEmpresaCliente(registro) {
    const contatosDoGrupo = contatosGruposEmpresa.filter(
      (contato) => String(contato.idGrupoEmpresa) === String(registro.idGrupoEmpresa)
    );

    for (const contato of contatosDoGrupo) {
      await atualizarContatoGrupoEmpresa(contato.idContatoGrupoEmpresa, {
        status: 0,
        principal: 0
      });
    }

    await atualizarGrupoEmpresa(registro.idGrupoEmpresa, { status: 0 });

    await recarregarPagina();
    window.dispatchEvent(new CustomEvent('grupo-empresa-atualizado'));
  }

  function abrirNovoCliente() {
    definirClienteEmEdicao(null);
    definirModoModalCliente('novo');
    definirModalAberto(true);
  }

  function abrirEdicaoCliente(cliente) {
    definirClienteEmEdicao(cliente);
    definirModoModalCliente('edicao');
    definirModalAberto(true);
  }

  function abrirConsultaCliente(cliente) {
    definirClienteEmEdicao(cliente);
    definirModoModalCliente('consulta');
    definirModalAberto(true);
  }

  async function inativarCliente(cliente) {
    await atualizarCliente(cliente.idCliente, { status: 0 });
    await recarregarPagina();
  }

  function fecharModalCliente() {
    definirModalAberto(false);
    definirClienteEmEdicao(null);
    definirModoModalCliente('novo');
  }

  const carregando = carregandoContexto || carregandoGrade;
  const proximoCodigoCliente = obterPrimeiroCodigoDisponivel(clientes, 'idCliente');
  const filtrosAtivos = Object.values(filtros).some((valor) => (
    Array.isArray(valor) ? valor.length > 0 : Boolean(valor)
  ));
  const opcoesEstado = obterOpcoesTexto(clientes, 'estado');
  const opcoesCidade = obterOpcoesTexto(clientes, 'cidade');
  const vendedoresDisponiveis = vendedores;
  const referenciasImportacaoClientes = useMemo(() => ({
    vendedor: {
      opcoes: vendedoresDisponiveis.map((vendedor) => ({
        valor: vendedor.nome || '',
        label: vendedor.nome || '-'
      }))
    },
    ramoAtividade: {
      opcoes: ramosAtividade.map((ramo) => ({
        valor: ramo.descricao || '',
        label: ramo.descricao || '-'
      }))
    },
    grupoEmpresa: {
      opcoes: gruposEmpresa
        .filter((grupo) => Number(grupo.status ?? 1) !== 0)
        .map((grupo) => ({
          valor: grupo.descricao || '',
          label: grupo.descricao || '-'
        }))
    }
  }), [gruposEmpresa, ramosAtividade, vendedoresDisponiveis]);

  return (
    <>
      <CabecalhoClientes
        pesquisa={pesquisa}
        aoAlterarPesquisa={definirPesquisa}
        aoAbrirFiltros={() => definirModalFiltrosAberto(true)}
        aoAbrirConfiguracaoGrid={() => definirModalColunasGridAberto(true)}
        aoAbrirImportacao={() => {
          definirResultadoImportacao(null);
          definirModalImportacaoAberto(true);
        }}
        aoNovoCliente={abrirNovoCliente}
        filtrosAtivos={filtrosAtivos}
        configuracaoGridBloqueada={usuarioLogado?.tipo === 'Usuario padrao' || !empresa?.idEmpresa}
      />
      <CorpoClientes
        empresa={empresa}
        clientes={clientes}
        carregando={carregando}
        mensagemErro={mensagemErro}
        aoEditarCliente={abrirEdicaoCliente}
        aoConsultarCliente={abrirConsultaCliente}
        aoInativarCliente={inativarCliente}
      />
      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros de clientes"
        filtros={filtros}
        campos={[
          {
            name: 'estado',
            label: 'Estado',
            multiple: true,
            placeholder: 'Todos os estados',
            options: opcoesEstado
          },
          { name: 'cidade', label: 'Cidade', options: opcoesCidade },
          {
            name: 'idGrupoEmpresa',
            label: 'Grupo de empresa',
            options: gruposEmpresa.map((grupo) => ({
              valor: String(grupo.idGrupoEmpresa),
              label: grupo.descricao
            }))
          },
          {
            name: 'idRamo',
            label: 'Ramo de atividade',
            multiple: true,
            placeholder: 'Todos os ramos',
            options: ramosAtividade.map((ramo) => ({
              valor: String(ramo.idRamo),
              label: ramo.descricao
            }))
          },
          {
            name: 'idVendedor',
            label: 'Vendedor',
            multiple: true,
            placeholder: 'Todos os vendedores',
            options: vendedoresDisponiveis.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'tipo',
            label: 'Tipo',
            multiple: true,
            placeholder: 'Todos os tipos',
            options: [
              { valor: 'Pessoa fisica', label: 'Pessoa fisica' },
              { valor: 'Pessoa juridica', label: 'Pessoa juridica' }
            ]
          },
          {
            name: 'status',
            label: 'Ativo',
            multiple: true,
            placeholder: 'Todos',
            options: [
              { valor: '1', label: 'Ativo' },
              { valor: '0', label: 'Inativo' }
            ]
          }
        ]}
        aoFechar={() => definirModalFiltrosAberto(false)}
        aoAplicar={(proximosFiltros) => {
          definirFiltros(proximosFiltros);
          definirModalFiltrosAberto(false);
        }}
        aoLimpar={() => definirFiltros(filtrosIniciais)}
      />
      <ModalCliente
        aberto={modalAberto}
        cliente={clienteEmEdicao}
        usuarioLogado={usuarioLogado}
        codigoSugerido={proximoCodigoCliente}
        contatos={obterContatosDoCliente(contatos, clienteEmEdicao?.idCliente)}
        contatosEditaveis={obterContatosEditaveisDoCliente(contatos, clienteEmEdicao?.idCliente)}
        gruposEmpresa={gruposEmpresa}
        contatosGruposEmpresa={contatosGruposEmpresa}
        vendedores={vendedoresDisponiveis}
        ramosAtividade={ramosAtividade}
        modo={modoModalCliente}
        empresa={empresa}
        somenteConsultaRamos={false}
        somenteConsultaGrupos={false}
        idVendedorBloqueado={null}
        aoFechar={fecharModalCliente}
        aoSalvarRamoAtividade={salvarRamoAtividade}
        aoInativarRamoAtividade={inativarRamoAtividadeCliente}
        aoSalvarGrupoEmpresa={salvarGrupoEmpresa}
        aoInativarGrupoEmpresa={inativarGrupoEmpresaCliente}
        aoSalvar={salvarCliente}
      />
      <ModalManualClientes
        aberto={modalManualAberto}
        aoFechar={() => definirModalManualAberto(false)}
        clientes={clientes}
        contatos={contatos}
        gruposEmpresa={gruposEmpresa}
        vendedores={vendedoresDisponiveis}
        ramosAtividade={ramosAtividade}
        filtros={filtros}
        usuarioLogado={usuarioLogado}
      />
      <ModalColunasGridClientes
        aberto={modalColunasGridAberto}
        empresa={empresa}
        aoFechar={() => definirModalColunasGridAberto(false)}
        aoSalvar={salvarColunasGridClientes}
      />
      <ModalImportacaoCadastro
        aberto={modalImportacaoAberto}
        tipo="clientes"
        carregando={importando}
        resultado={resultadoImportacao}
        referenciasRelacionais={referenciasImportacaoClientes}
        onFechar={() => {
          definirModalImportacaoAberto(false);
          definirResultadoImportacao(null);
        }}
        onImportar={importarClientes}
      />
    </>
  );
}

function normalizarFiltrosClientes(filtros, filtrosPadrao) {
  const filtrosNormalizados = normalizarFiltrosPorPadrao(filtros, filtrosPadrao);

  return {
    ...filtrosNormalizados,
    estado: normalizarListaFiltroPersistido(filtrosNormalizados.estado),
    idRamo: normalizarListaFiltroPersistido(filtrosNormalizados.idRamo),
    idVendedor: filtrosPadrao.idVendedor?.length > 0
      ? [...filtrosPadrao.idVendedor]
      : normalizarListaFiltroPersistido(filtrosNormalizados.idVendedor),
    tipo: normalizarListaFiltroPersistido(filtrosNormalizados.tipo),
    status: normalizarListaFiltroPersistido(filtrosNormalizados.status)
  };
}

function obterOpcoesTexto(registros, campo) {
  return [...new Set(
    registros
      .map((registro) => String(registro[campo] || '').trim())
      .filter(Boolean)
  )]
    .sort((valorA, valorB) => valorA.localeCompare(valorB))
    .map((valor) => ({
      valor,
      label: valor
    }));
}

async function salvarContatosCliente(idCliente, contatos) {
  const contatosNormalizados = normalizarContatos(contatos, idCliente);

  for (const contato of contatosNormalizados) {
    if (contato.idContato) {
      await atualizarContato(contato.idContato, contato);
    } else {
      await incluirContato(contato);
    }
  }
}

function enriquecerClientes(clientes, contatos, vendedores, gruposEmpresa, ramosAtividade) {
  const contatosPrincipaisPorCliente = new Map();
  const vendedoresPorId = new Map(
    vendedores.map((vendedor) => [String(vendedor.idVendedor), vendedor.nome])
  );
  const gruposEmpresaPorId = new Map(
    (gruposEmpresa || []).map((grupo) => [String(grupo.idGrupoEmpresa), grupo.descricao])
  );
  const ramosPorId = new Map(
    (ramosAtividade || []).map((ramo) => [String(ramo.idRamo), ramo.descricao])
  );

  contatos.forEach((contato) => {
    if (contato.principal) {
      contatosPrincipaisPorCliente.set(String(contato.idCliente), contato);
    }
  });

  return clientes.map((cliente) => ({
    ...cliente,
    nomeGrupoEmpresa: obterValorGrid(
      cliente.nomeGrupoEmpresa || gruposEmpresaPorId.get(String(cliente.idGrupoEmpresa))
    ),
    nomeRamo: obterValorGrid(
      cliente.nomeRamo || ramosPorId.get(String(cliente.idRamo))
    ),
    nomeVendedor: obterValorGrid(
      cliente.nomeVendedor || vendedoresPorId.get(String(cliente.idVendedor))
    ),
    nomeContatoPrincipal: obterValorGrid(
      cliente.nomeContatoPrincipal || contatosPrincipaisPorCliente.get(String(cliente.idCliente))?.nome
    ),
    emailContatoPrincipal: obterValorGrid(
      cliente.emailContatoPrincipal || contatosPrincipaisPorCliente.get(String(cliente.idCliente))?.email
    )
  }));
}

function obterContatosDoCliente(contatos, idCliente) {
  if (!idCliente) {
    return [];
  }

  return contatos.filter((contato) => contato.idCliente === idCliente);
}

function obterContatosEditaveisDoCliente(contatos, idCliente) {
  return obterContatosDoCliente(contatos, idCliente)
    .filter((contato) => !Boolean(contato.contatoVinculadoGrupo));
}

function normalizarPayloadCliente(dadosCliente) {
  const payload = {
    idVendedor: Number(dadosCliente.idVendedor),
    idGrupoEmpresa: dadosCliente.idGrupoEmpresa ? Number(dadosCliente.idGrupoEmpresa) : null,
    idRamo: Number(dadosCliente.idRamo),
    razaoSocial: dadosCliente.razaoSocial.trim(),
    nomeFantasia: dadosCliente.nomeFantasia.trim(),
    tipo: dadosCliente.tipo.trim(),
    cnpj: dadosCliente.cnpj.trim(),
    inscricaoEstadual: limparTextoOpcional(dadosCliente.inscricaoEstadual),
    status: dadosCliente.status ? 1 : 0,
    email: limparTextoOpcional(dadosCliente.email),
    telefone: limparTextoOpcional(normalizarTelefone(dadosCliente.telefone)),
    logradouro: limparTextoOpcional(dadosCliente.logradouro),
    numero: limparTextoOpcional(dadosCliente.numero),
    complemento: limparTextoOpcional(dadosCliente.complemento),
    bairro: limparTextoOpcional(dadosCliente.bairro),
    cidade: limparTextoOpcional(dadosCliente.cidade),
    estado: limparTextoOpcional(dadosCliente.estado)?.toUpperCase(),
    cep: limparTextoOpcional(dadosCliente.cep),
    observacao: limparTextoOpcional(dadosCliente.observacao),
    codigoAlternativo: normalizarCodigoAlternativo(dadosCliente.codigoAlternativo),
    imagem: limparTextoOpcional(dadosCliente.imagem)
  };

  if (dadosCliente.idCliente) {
    payload.idCliente = Number(dadosCliente.idCliente);
  }

  return payload;
}

function limparTextoOpcional(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
}

function normalizarCodigoAlternativo(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').trim();
  return digitos ? Number(digitos) : null;
}

function normalizarContatos(contatos, idCliente) {
  return contatos.map((contato) => ({
    idContato: typeof contato.idContato === 'number' ? contato.idContato : undefined,
    idCliente,
    nome: contato.nome.trim(),
    cargo: limparTextoOpcional(contato.cargo),
    email: limparTextoOpcional(contato.email),
    telefone: limparTextoOpcional(normalizarTelefone(contato.telefone)),
    whatsapp: limparTextoOpcional(normalizarTelefone(contato.whatsapp)),
    status: contato.status ? 1 : 0,
    principal: contato.principal ? 1 : 0
  }));
}

function normalizarContatosGrupoEmpresa(contatos, idGrupoEmpresa) {
  return (contatos || []).map((contato) => ({
    idContatoGrupoEmpresa: typeof contato.idContatoGrupoEmpresa === 'number'
      ? contato.idContatoGrupoEmpresa
      : undefined,
    idGrupoEmpresa: Number(idGrupoEmpresa),
    nome: String(contato.nome || '').trim(),
    cargo: limparTextoOpcional(contato.cargo),
    email: limparTextoOpcional(contato.email),
    telefone: limparTextoOpcional(normalizarTelefone(contato.telefone)),
    whatsapp: limparTextoOpcional(normalizarTelefone(contato.whatsapp)),
    status: contato.status ? 1 : 0,
    principal: contato.principal ? 1 : 0
  }));
}
