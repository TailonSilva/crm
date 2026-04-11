import { ModalBuscaTabela } from './modalBuscaTabela';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';

export function ModalBuscaProdutos({
  aberto,
  produtos = [],
  placeholder = 'Pesquisar produto no grid',
  ariaLabelPesquisa = 'Pesquisar produto no grid',
  rotuloAcaoPrimaria = '',
  tituloAcaoPrimaria = '',
  iconeAcaoPrimaria = 'adicionar',
  aoAcionarPrimaria = null,
  aoSelecionar,
  aoFechar
}) {
  return (
    <ModalBuscaTabela
      aberto={aberto}
      titulo="Buscar produto"
      placeholder={placeholder}
      ariaLabelPesquisa={ariaLabelPesquisa}
      rotuloAcaoPrimaria={rotuloAcaoPrimaria}
      tituloAcaoPrimaria={tituloAcaoPrimaria}
      iconeAcaoPrimaria={iconeAcaoPrimaria}
      aoAcionarPrimaria={aoAcionarPrimaria}
      colunas={[
        {
          key: 'codigo',
          label: 'Codigo',
          render: (produto) => `#${String(produto.idProduto || '').padStart(4, '0')}`
        },
        { key: 'referencia', label: 'Referencia', render: (produto) => produto.referencia || '-' },
        { key: 'descricao', label: 'Descricao', render: (produto) => produto.descricao || '-' },
        { key: 'preco', label: 'Preco', render: (produto) => normalizarPreco(produto.preco || 0) }
      ]}
      registros={produtos}
      obterTextoBusca={(produto) => [
        produto.idProduto,
        produto.referencia,
        produto.descricao,
        produto.preco
      ].join(' ')}
      obterChaveRegistro={(produto) => produto.idProduto}
      aoSelecionar={aoSelecionar}
      aoFechar={aoFechar}
    />
  );
}
