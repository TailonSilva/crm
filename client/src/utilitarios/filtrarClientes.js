import { normalizarStatusRegistro, registroEstaAtivo } from './statusRegistro';
import { listaIncluiValorFiltro, normalizarValorComparacaoFiltro } from './compararValoresFiltro';

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filtrarClientes(clientes, pesquisa, filtros = {}) {
  const termo = normalizarTexto(pesquisa);

  return clientes.filter((cliente) => {
    const passouFiltros = (
      listaIncluiValorFiltro(filtros.estado, cliente.estado, normalizarTexto) &&
      (!filtros.cidade || normalizarTexto(cliente.cidade) === normalizarTexto(filtros.cidade)) &&
      (!filtros.idGrupoEmpresa || normalizarValorComparacaoFiltro(cliente.idGrupoEmpresa) === normalizarValorComparacaoFiltro(filtros.idGrupoEmpresa)) &&
      listaIncluiValorFiltro(filtros.idRamo, cliente.idRamo) &&
      listaIncluiValorFiltro(filtros.idVendedor, cliente.idVendedor) &&
      listaIncluiValorFiltro(filtros.tipo, cliente.tipo, normalizarTexto) &&
      listaIncluiValorFiltro(filtros.status, normalizarStatusRegistro(cliente.status))
    );

    if (!passouFiltros) {
      return false;
    }

    if (!termo) {
      return true;
    }

    const camposPesquisa = [
      cliente.idCliente,
      cliente.codigoAlternativo,
      cliente.nomeFantasia,
      cliente.razaoSocial,
      cliente.cnpj,
      cliente.cidade,
      cliente.estado,
      cliente.nomeGrupoEmpresa,
      cliente.nomeContatoPrincipal,
      cliente.emailContatoPrincipal,
      cliente.nomeVendedor,
      registroEstaAtivo(cliente.status) ? 'ativo' : 'inativo'
    ];

    return camposPesquisa.some((campo) => normalizarTexto(campo).includes(termo));
  });
}
