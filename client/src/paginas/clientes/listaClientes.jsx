import { useMemo } from 'react';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { AcoesRegistro } from '../../componentes/comuns/acoesRegistro';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { TextoGradeClamp } from '../../componentes/comuns/textoGradeClamp';
import { obterCodigoPrincipalCliente } from '../../utilitarios/codigoCliente';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';
import { obterValorGrid } from '../../utilitarios/valorPadraoGrid';
import { AvatarCliente } from './avatarCliente';
import {
  normalizarColunasGridClientes,
  TOTAL_COLUNAS_GRID_CLIENTES
} from '../../utilitarios/colunasGridClientes';

export function ListaClientes({
  empresa,
  clientes,
  carregando,
  mensagemErro,
  aoEditarCliente,
  aoConsultarCliente,
  aoInativarCliente
}) {
  const colunasVisiveisClientes = useMemo(
    () => normalizarColunasGridClientes(empresa?.colunasGridClientes),
    [empresa?.colunasGridClientes]
  );

  return (
    <GradePadrao
      modo="layout"
      totalColunasLayout={TOTAL_COLUNAS_GRID_CLIENTES}
      cabecalho={<CabecalhoGradeClientes colunas={colunasVisiveisClientes} />}
      carregando={carregando}
      mensagemErro={mensagemErro}
      temItens={clientes.length > 0}
      mensagemCarregando="Carregando clientes..."
      mensagemVazia="Nenhum cliente encontrado."
    >
      {clientes.map((cliente) => (
        <LinhaCliente
          key={cliente.idCliente}
          empresa={empresa}
          cliente={cliente}
          colunas={colunasVisiveisClientes}
          aoConsultar={() => aoConsultarCliente(cliente)}
          aoEditar={() => aoEditarCliente(cliente)}
          aoInativar={() => aoInativarCliente(cliente)}
        />
      ))}
    </GradePadrao>
  );
}

function CabecalhoGradeClientes({ colunas }) {
  return (
    <div className="cabecalhoLayoutGradePadrao cabecalhoGradeClientes">
      {colunas.map((coluna) => (
        <div key={coluna.id} className={coluna.classe} style={obterEstiloColunaLayout(coluna)}>
          {coluna.rotulo}
        </div>
      ))}
    </div>
  );
}

function LinhaCliente({ empresa, cliente, colunas, aoConsultar, aoEditar, aoInativar }) {
  return (
    <div className="linhaLayoutGradePadrao linhaCliente">
      {colunas.map((coluna) => renderizarCelulaCliente({
        coluna,
        empresa,
        cliente,
        aoConsultar,
        aoEditar,
        aoInativar
      }))}
    </div>
  );
}

function renderizarCelulaCliente({ coluna, empresa, cliente, aoConsultar, aoEditar, aoInativar }) {
  const propriedadesCelula = {
    key: coluna.id,
    className: `celulaLayoutGradePadrao ${coluna.classe}`.trim(),
    style: obterEstiloColunaLayout(coluna)
  };

  if (coluna.id === 'imagem') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <AvatarCliente cliente={cliente} />
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'codigo') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={obterCodigoPrincipalCliente(cliente, empresa) || 0} />
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'idCliente') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={cliente.idCliente || 0} />
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'codigoAlternativo') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        {cliente.codigoAlternativo ? (
          <CodigoRegistro valor={cliente.codigoAlternativo} />
        ) : (
          '-'
        )}
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'cliente') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.nomeFantasia || cliente.razaoSocial)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'razaoSocial') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.razaoSocial)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'nomeFantasia') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.nomeFantasia)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'documento') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.cnpj)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'cnpj') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.cnpj)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'tipo') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.tipo)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'inscricaoEstadual') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.inscricaoEstadual)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'idGrupoEmpresa') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.nomeGrupoEmpresa)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'idRamo') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.nomeRamo)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'cidade') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.cidade)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'estado') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        {obterValorGrid(cliente.estado)}
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'contato') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.nomeContatoPrincipal)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'emailContatoPrincipal') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.emailContatoPrincipal)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'email') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.email)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'telefone') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.telefone)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'vendedor') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.nomeVendedor)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'idVendedor') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.nomeVendedor)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'logradouro') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.logradouro)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'numero') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        {obterValorGrid(cliente.numero)}
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'complemento') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.complemento)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'bairro') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.bairro)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'cep') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.cep)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'observacao') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(cliente.observacao)}</TextoGradeClamp>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'dataCriacao') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        {formatarDataCriacaoCliente(cliente.dataCriacao)}
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'status') {
    const ativo = registroEstaAtivo(cliente.status);

    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <span className={`etiquetaStatus ${ativo ? 'ativo' : 'inativo'}`}>
          {ativo ? 'Ativo' : 'Inativo'}
        </span>
      </CelulaLayoutCliente>
    );
  }

  if (coluna.id === 'acoes') {
    return (
      <CelulaLayoutCliente coluna={coluna} {...propriedadesCelula}>
        <AcoesRegistro
          rotuloConsulta="Consultar cliente"
          rotuloEdicao="Editar cliente"
          rotuloInativacao="Inativar cliente"
          aoConsultar={aoConsultar}
          aoEditar={aoEditar}
          aoInativar={aoInativar}
        />
      </CelulaLayoutCliente>
    );
  }

  return null;
}

function CelulaLayoutCliente({ coluna, children, ...propriedades }) {
  return (
    <div {...propriedades}>
      <span className="rotuloCelulaLayoutGradePadrao">{coluna.rotulo}</span>
      {children}
    </div>
  );
}

function obterEstiloColunaLayout(coluna) {
  return {
    order: coluna.ordem,
    gridColumn: `span ${Math.max(1, Number(coluna.span || 1))}`
  };
}

function formatarDataCriacaoCliente(valor) {
  if (!valor) {
    return '-';
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR').format(data);
}
