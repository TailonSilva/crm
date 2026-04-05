import { useEffect, useMemo, useState } from 'react';
import { CabecalhoProdutos } from './cabecalhoProdutos';
import { CorpoProdutos } from './corpoProdutos';
import {
  atualizarProduto,
  importarProdutosPlanilha,
  incluirProduto,
  listarGruposProduto,
  listarMarcas,
  listarProdutosGrid,
  listarUnidadesMedida
} from '../../servicos/produtos';
import { listarEmpresas } from '../../servicos/empresa';
import {
  atualizarGrupoProduto,
  atualizarMarca,
  atualizarUnidadeMedida,
  incluirGrupoProduto,
  incluirMarca,
  incluirUnidadeMedida
} from '../../servicos/configuracoes';
import { converterPrecoParaNumero } from '../../utilitarios/normalizarPreco';
import { obterPrimeiroCodigoDisponivel } from '../../utilitarios/obterPrimeiroCodigoDisponivel';
import { obterValorGrid } from '../../utilitarios/valorPadraoGrid';
import {
  normalizarFiltrosPorPadrao,
  normalizarListaFiltroPersistido,
  useFiltrosPersistidos
} from '../../utilitarios/useFiltrosPersistidos';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { ModalProduto } from './modalProduto';
import { ModalImportacaoCadastro } from '../../componentes/comuns/modalImportacaoCadastro';
import { ModalManualProdutos } from './modalManualProdutos';

const filtrosIniciaisProdutos = {
  idGrupo: [],
  idMarca: [],
  idUnidade: [],
  status: []
};

export function PaginaProdutos({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const [filtros, definirFiltros] = useFiltrosPersistidos({
    chave: 'paginaProdutos',
    usuario: usuarioLogado,
    filtrosPadrao: filtrosIniciaisProdutos,
    normalizarFiltros: normalizarFiltrosProdutos
  });
  const [produtos, definirProdutos] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [gruposProduto, definirGruposProduto] = useState([]);
  const [marcas, definirMarcas] = useState([]);
  const [unidadesMedida, definirUnidadesMedida] = useState([]);
  const [carregandoContexto, definirCarregandoContexto] = useState(true);
  const [carregandoGrade, definirCarregandoGrade] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalManualAberto, definirModalManualAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalImportacaoAberto, definirModalImportacaoAberto] = useState(false);
  const [resultadoImportacao, definirResultadoImportacao] = useState(null);
  const [importando, definirImportando] = useState(false);
  const [produtoSelecionado, definirProdutoSelecionado] = useState(null);
  const [modoModalProduto, definirModoModalProduto] = useState('novo');
  const usuarioSomenteConsulta = usuarioLogado?.tipo === 'Usuario padrao';

  useEffect(() => {
    carregarContexto();
  }, []);

  useEffect(() => {
    carregarGradeProdutos();
  }, [pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarEmpresaAtualizada() {
      carregarContexto();
      carregarGradeProdutos();
    }

    window.addEventListener('empresa-atualizada', tratarEmpresaAtualizada);

    return () => {
      window.removeEventListener('empresa-atualizada', tratarEmpresaAtualizada);
    };
  }, [pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarAtalhosProdutos(evento) {
      if (evento.key !== 'F1') {
        return;
      }

      evento.preventDefault();

      if (!modalAberto && !modalManualAberto && !modalFiltrosAberto && !modalImportacaoAberto) {
        definirModalManualAberto(true);
      }
    }

    window.addEventListener('keydown', tratarAtalhosProdutos);

    return () => {
      window.removeEventListener('keydown', tratarAtalhosProdutos);
    };
  }, [modalAberto, modalManualAberto, modalFiltrosAberto, modalImportacaoAberto]);

  async function carregarContexto() {
    definirCarregandoContexto(true);
    definirMensagemErro('');

    try {
      const [empresasCarregadas, gruposCarregados, marcasCarregadas, unidadesCarregadas] = await Promise.all([
        listarEmpresas(),
        listarGruposProduto(),
        listarMarcas(),
        listarUnidadesMedida()
      ]);
      definirEmpresa(empresasCarregadas[0] || null);
      definirGruposProduto(gruposCarregados);
      definirMarcas(marcasCarregadas);
      definirUnidadesMedida(unidadesCarregadas);
    } catch (erro) {
      definirMensagemErro('Nao foi possivel carregar os produtos.');
    } finally {
      definirCarregandoContexto(false);
    }
  }

  async function carregarGradeProdutos() {
    definirCarregandoGrade(true);
    definirMensagemErro('');

    try {
      const produtosCarregados = await listarProdutosGrid({
        pesquisa,
        filtros
      });

      definirProdutos(
        enriquecerProdutos(
          produtosCarregados,
          gruposProduto,
          marcas,
          unidadesMedida
        )
      );
    } catch (erro) {
      definirMensagemErro('Nao foi possivel carregar os produtos.');
    } finally {
      definirCarregandoGrade(false);
    }
  }

  async function recarregarPagina() {
    await Promise.all([carregarContexto(), carregarGradeProdutos()]);
  }

  async function recarregarGradeProdutos() {
    await carregarGradeProdutos();
  }

  async function recarregarContextoProdutos() {
    await recarregarPagina();
  }

  async function salvarProduto(dadosProduto) {
    const payload = normalizarPayloadProduto({
      ...dadosProduto,
      idProduto: produtoSelecionado?.idProduto || proximoCodigoProduto
    });

    if (modoModalProduto === 'edicao' && produtoSelecionado?.idProduto) {
      await atualizarProduto(produtoSelecionado.idProduto, payload);
    } else {
      await incluirProduto(payload);
    }

    await recarregarGradeProdutos();
    fecharModalProduto();
  }

  async function importarProdutos(linhas) {
    definirImportando(true);

    try {
      const resultado = await importarProdutosPlanilha({ linhas });
      definirResultadoImportacao(resultado);
      await recarregarGradeProdutos();
    } finally {
      definirImportando(false);
    }
  }

  async function inativarProduto(produto) {
    if (usuarioSomenteConsulta) {
      return;
    }

    await atualizarProduto(produto.idProduto, { status: 0 });
    await recarregarGradeProdutos();
  }

  async function salvarGrupoProduto(dadosGrupo) {
    const payload = {
      descricao: dadosGrupo.descricao.trim(),
      status: dadosGrupo.status ? 1 : 0
    };

    let grupoSalvo = null;

    if (dadosGrupo.idGrupo) {
      await atualizarGrupoProduto(dadosGrupo.idGrupo, payload);
      grupoSalvo = { idGrupo: Number(dadosGrupo.idGrupo), ...payload };
    } else {
      grupoSalvo = await incluirGrupoProduto(payload);
    }

    await recarregarContextoProdutos();
    return grupoSalvo;
  }

  async function inativarGrupoProdutoRegistro(registro) {
    await atualizarGrupoProduto(registro.idGrupo, { status: 0 });
    await recarregarContextoProdutos();
  }

  async function salvarMarca(dadosMarca) {
    const payload = {
      descricao: dadosMarca.descricao.trim(),
      status: dadosMarca.status ? 1 : 0
    };

    let marcaSalva = null;

    if (dadosMarca.idMarca) {
      await atualizarMarca(dadosMarca.idMarca, payload);
      marcaSalva = { idMarca: Number(dadosMarca.idMarca), ...payload };
    } else {
      marcaSalva = await incluirMarca(payload);
    }

    await recarregarContextoProdutos();
    return marcaSalva;
  }

  async function inativarMarcaRegistro(registro) {
    await atualizarMarca(registro.idMarca, { status: 0 });
    await recarregarContextoProdutos();
  }

  async function salvarUnidadeMedida(dadosUnidade) {
    const payload = {
      descricao: dadosUnidade.descricao.trim(),
      status: dadosUnidade.status ? 1 : 0
    };

    let unidadeSalva = null;

    if (dadosUnidade.idUnidade) {
      await atualizarUnidadeMedida(dadosUnidade.idUnidade, payload);
      unidadeSalva = { idUnidade: Number(dadosUnidade.idUnidade), ...payload };
    } else {
      unidadeSalva = await incluirUnidadeMedida(payload);
    }

    await recarregarContextoProdutos();
    return unidadeSalva;
  }

  async function inativarUnidadeMedidaRegistro(registro) {
    await atualizarUnidadeMedida(registro.idUnidade, { status: 0 });
    await recarregarContextoProdutos();
  }

  function abrirNovoProduto() {
    if (usuarioSomenteConsulta) {
      return;
    }

    definirProdutoSelecionado(null);
    definirModoModalProduto('novo');
    definirModalAberto(true);
  }

  function abrirEdicaoProduto(produto) {
    if (usuarioSomenteConsulta) {
      abrirConsultaProduto(produto);
      return;
    }

    definirProdutoSelecionado(produto);
    definirModoModalProduto('edicao');
    definirModalAberto(true);
  }

  function abrirConsultaProduto(produto) {
    definirProdutoSelecionado(produto);
    definirModoModalProduto('consulta');
    definirModalAberto(true);
  }

  function fecharModalProduto() {
    definirModalAberto(false);
    definirProdutoSelecionado(null);
    definirModoModalProduto('novo');
  }

  const carregando = carregandoContexto || carregandoGrade;
  const proximoCodigoProduto = obterPrimeiroCodigoDisponivel(produtos, 'idProduto');
  const filtrosAtivos = Object.values(filtros).some((valor) => (
    Array.isArray(valor) ? valor.length > 0 : Boolean(valor)
  ));
  const referenciasImportacaoProdutos = useMemo(() => ({
    grupoProduto: {
      opcoes: gruposProduto.map((grupo) => ({
        valor: grupo.descricao || '',
        label: grupo.descricao || '-'
      }))
    },
    marca: {
      opcoes: marcas.map((marca) => ({
        valor: marca.descricao || '',
        label: marca.descricao || '-'
      }))
    },
    unidadeMedida: {
      opcoes: unidadesMedida.map((unidade) => ({
        valor: unidade.descricao || '',
        label: unidade.descricao || '-'
      }))
    }
  }), [gruposProduto, marcas, unidadesMedida]);

  return (
    <>
      <CabecalhoProdutos
        pesquisa={pesquisa}
        aoAlterarPesquisa={definirPesquisa}
        aoAbrirFiltros={() => definirModalFiltrosAberto(true)}
        aoAbrirImportacao={() => {
          definirResultadoImportacao(null);
          definirModalImportacaoAberto(true);
        }}
        aoNovoProduto={abrirNovoProduto}
        filtrosAtivos={filtrosAtivos}
        somenteConsulta={usuarioSomenteConsulta}
      />
      <CorpoProdutos
        empresa={empresa}
        produtos={produtos}
        carregando={carregando}
        mensagemErro={mensagemErro}
        aoConsultarProduto={abrirConsultaProduto}
        aoEditarProduto={abrirEdicaoProduto}
        aoInativarProduto={inativarProduto}
        somenteConsulta={usuarioSomenteConsulta}
      />
      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros de produtos"
        filtros={filtros}
        campos={[
          {
            name: 'idGrupo',
            label: 'Grupo',
            multiple: true,
            placeholder: 'Todos os grupos',
            options: gruposProduto.map((grupo) => ({
              valor: String(grupo.idGrupo),
              label: grupo.descricao
            }))
          },
          {
            name: 'idMarca',
            label: 'Marca',
            multiple: true,
            placeholder: 'Todas as marcas',
            options: marcas.map((marca) => ({
              valor: String(marca.idMarca),
              label: marca.descricao
            }))
          },
          {
            name: 'idUnidade',
            label: 'Unidade',
            multiple: true,
            placeholder: 'Todas as unidades',
            options: unidadesMedida.map((unidade) => ({
              valor: String(unidade.idUnidade),
              label: unidade.descricao
            }))
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
        aoLimpar={() => definirFiltros(filtrosIniciaisProdutos)}
      />
      <ModalProduto
        aberto={modalAberto}
        produto={produtoSelecionado}
        codigoSugerido={proximoCodigoProduto}
        gruposProduto={gruposProduto}
        marcas={marcas}
        unidadesMedida={unidadesMedida}
        modo={modoModalProduto}
        somenteConsultaGrupos={usuarioSomenteConsulta}
        aoSalvarGrupoProduto={salvarGrupoProduto}
        aoInativarGrupoProduto={inativarGrupoProdutoRegistro}
        somenteConsultaMarcas={usuarioSomenteConsulta}
        aoSalvarMarca={salvarMarca}
        aoInativarMarca={inativarMarcaRegistro}
        somenteConsultaUnidades={usuarioSomenteConsulta}
        aoSalvarUnidadeMedida={salvarUnidadeMedida}
        aoInativarUnidadeMedida={inativarUnidadeMedidaRegistro}
        aoFechar={fecharModalProduto}
        aoSalvar={salvarProduto}
      />
      <ModalManualProdutos
        aberto={modalManualAberto}
        aoFechar={() => definirModalManualAberto(false)}
        produtos={produtos}
        gruposProduto={gruposProduto}
        marcas={marcas}
        unidadesMedida={unidadesMedida}
        filtros={filtros}
        usuarioLogado={usuarioLogado}
      />
      <ModalImportacaoCadastro
        aberto={modalImportacaoAberto}
        tipo="produtos"
        carregando={importando}
        resultado={resultadoImportacao}
        referenciasRelacionais={referenciasImportacaoProdutos}
        cadastrosRelacionais={{
          grupoProduto: {
            registros: gruposProduto,
            somenteConsulta: usuarioSomenteConsulta,
            aoSalvar: salvarGrupoProduto,
            aoInativar: inativarGrupoProdutoRegistro,
            tituloBotao: 'Abrir grupos de produto'
          },
          marca: {
            registros: marcas,
            somenteConsulta: usuarioSomenteConsulta,
            aoSalvar: salvarMarca,
            aoInativar: inativarMarcaRegistro,
            tituloBotao: 'Abrir marcas'
          },
          unidadeMedida: {
            registros: unidadesMedida,
            somenteConsulta: usuarioSomenteConsulta,
            aoSalvar: salvarUnidadeMedida,
            aoInativar: inativarUnidadeMedidaRegistro,
            tituloBotao: 'Abrir unidades'
          }
        }}
        onFechar={() => {
          definirModalImportacaoAberto(false);
          definirResultadoImportacao(null);
        }}
        onImportar={importarProdutos}
      />
    </>
  );
}

function normalizarFiltrosProdutos(filtros, filtrosPadrao) {
  const filtrosNormalizados = normalizarFiltrosPorPadrao(filtros, filtrosPadrao);

  return {
    ...filtrosNormalizados,
    idGrupo: normalizarListaFiltroPersistido(filtrosNormalizados.idGrupo),
    idMarca: normalizarListaFiltroPersistido(filtrosNormalizados.idMarca),
    idUnidade: normalizarListaFiltroPersistido(filtrosNormalizados.idUnidade),
    status: normalizarListaFiltroPersistido(filtrosNormalizados.status)
  };
}

function enriquecerProdutos(produtos, grupos, marcas, unidades) {
  const gruposPorId = new Map(
    grupos.map((grupo) => [String(grupo.idGrupo), grupo.descricao])
  );
  const marcasPorId = new Map(
    marcas.map((marca) => [String(marca.idMarca), marca.descricao])
  );
  const unidadesPorId = new Map(
    unidades.map((unidade) => [String(unidade.idUnidade), unidade.descricao])
  );

  return produtos.map((produto) => ({
    ...produto,
    nomeGrupo: obterValorGrid(
      produto.nomeGrupo || gruposPorId.get(String(produto.idGrupo))
    ),
    nomeMarca: obterValorGrid(
      produto.nomeMarca || marcasPorId.get(String(produto.idMarca))
    ),
    nomeUnidade: obterValorGrid(
      produto.nomeUnidade || unidadesPorId.get(String(produto.idUnidade))
    )
  }));
}

function normalizarPayloadProduto(dadosProduto) {
  const payload = {
    referencia: dadosProduto.referencia.trim(),
    descricao: dadosProduto.descricao.trim(),
    idGrupo: Number(dadosProduto.idGrupo),
    idMarca: Number(dadosProduto.idMarca),
    idUnidade: Number(dadosProduto.idUnidade),
    preco: converterPrecoParaNumero(dadosProduto.preco) || 0,
    imagem: limparTextoOpcional(dadosProduto.imagem),
    status: dadosProduto.status ? 1 : 0
  };

  if (dadosProduto.idProduto) {
    payload.idProduto = Number(dadosProduto.idProduto);
  }

  return payload;
}

function limparTextoOpcional(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
}
