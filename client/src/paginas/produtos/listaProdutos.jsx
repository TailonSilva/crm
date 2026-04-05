import { useMemo } from 'react';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { AcoesRegistro } from '../../componentes/comuns/acoesRegistro';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { TextoGradeClamp } from '../../componentes/comuns/textoGradeClamp';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';
import { obterValorGrid } from '../../utilitarios/valorPadraoGrid';
import {
  normalizarColunasGridProdutos,
  TOTAL_COLUNAS_GRID_PRODUTOS
} from '../../utilitarios/colunasGridProdutos';
import { ImagemProduto } from './imagemProduto';

export function ListaProdutos({
  empresa,
  produtos,
  carregando,
  mensagemErro,
  aoConsultarProduto,
  aoEditarProduto,
  aoInativarProduto,
  somenteConsulta = false
}) {
  const colunasVisiveisProdutos = useMemo(
    () => normalizarColunasGridProdutos(empresa?.colunasGridProdutos),
    [empresa?.colunasGridProdutos]
  );

  return (
    <GradePadrao
      modo="layout"
      totalColunasLayout={TOTAL_COLUNAS_GRID_PRODUTOS}
      cabecalho={<CabecalhoGradeProdutos colunas={colunasVisiveisProdutos} />}
      carregando={carregando}
      mensagemErro={mensagemErro}
      temItens={produtos.length > 0}
      mensagemCarregando="Carregando produtos..."
      mensagemVazia="Nenhum produto encontrado."
    >
      {produtos.map((produto) => (
        <LinhaProduto
          key={produto.idProduto}
          produto={produto}
          colunas={colunasVisiveisProdutos}
          aoConsultar={() => aoConsultarProduto(produto)}
          aoEditar={() => aoEditarProduto(produto)}
          aoInativar={() => aoInativarProduto(produto)}
          somenteConsulta={somenteConsulta}
        />
      ))}
    </GradePadrao>
  );
}

function CabecalhoGradeProdutos({ colunas }) {
  return (
    <div className="cabecalhoLayoutGradePadrao cabecalhoGradeProdutos">
      {colunas.map((coluna) => (
        <div key={coluna.id} className={coluna.classe} style={obterEstiloColunaLayout(coluna)}>
          {coluna.rotulo}
        </div>
      ))}
    </div>
  );
}

function LinhaProduto({
  produto,
  colunas,
  aoConsultar,
  aoEditar,
  aoInativar,
  somenteConsulta = false
}) {
  return (
    <div className="linhaLayoutGradePadrao linhaProduto">
      {colunas.map((coluna) => renderizarCelulaProduto({
        coluna,
        produto,
        aoConsultar,
        aoEditar,
        aoInativar,
        somenteConsulta
      }))}
    </div>
  );
}

function renderizarCelulaProduto({ coluna, produto, aoConsultar, aoEditar, aoInativar, somenteConsulta }) {
  const propriedadesCelula = {
    key: coluna.id,
    className: `celulaLayoutGradePadrao ${coluna.classe}`.trim(),
    style: obterEstiloColunaLayout(coluna)
  };

  if (coluna.id === 'imagem') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <ImagemProduto produto={produto} />
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'codigo') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={produto.idProduto} />
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'idProduto') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={produto.idProduto} />
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'referencia') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.referencia)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'descricao') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.descricao)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'idGrupo') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.nomeGrupo)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'grupo') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.nomeGrupo)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'idMarca') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.nomeMarca)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'marca') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.nomeMarca)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'idUnidade') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.nomeUnidade)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'unidade') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(produto.nomeUnidade)}</TextoGradeClamp>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'preco') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        {normalizarPreco(produto.preco)}
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'status') {
    const ativo = registroEstaAtivo(produto.status);

    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <span className={`etiquetaStatus ${ativo ? 'ativo' : 'inativo'}`}>
          {ativo ? 'Ativo' : 'Inativo'}
        </span>
      </CelulaLayoutProduto>
    );
  }

  if (coluna.id === 'acoes') {
    return (
      <CelulaLayoutProduto coluna={coluna} {...propriedadesCelula}>
        <AcoesRegistro
          rotuloConsulta="Consultar produto"
          rotuloEdicao="Editar produto"
          rotuloInativacao="Inativar produto"
          exibirEdicao={!somenteConsulta}
          exibirInativacao={!somenteConsulta}
          aoConsultar={aoConsultar}
          aoEditar={aoEditar}
          aoInativar={aoInativar}
        />
      </CelulaLayoutProduto>
    );
  }

  return null;
}

function CelulaLayoutProduto({ coluna, children, ...propriedades }) {
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
