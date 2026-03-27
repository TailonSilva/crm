import { AcoesRegistro } from '../../componentes/comuns/acoesRegistro';
import { DetalhesProduto } from './detalhesProduto';
import { ImagemProduto } from './imagemProduto';

function formatarPreco(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function LinhaProduto({ produto }) {
  return (
    <tr className="linhaProduto">
      <td><ImagemProduto produto={produto} /></td>
      <td><DetalhesProduto produto={produto} /></td>
      <td>{produto.nomeGrupo}</td>
      <td>{produto.nomeMarca}</td>
      <td>{produto.nomeUnidade}</td>
      <td>{formatarPreco(produto.preco)}</td>
      <td>
        <span className={`etiquetaStatus ${produto.status ? 'ativo' : 'inativo'}`}>
          {produto.status ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <AcoesRegistro
          rotuloConsulta="Consultar produto"
          rotuloEdicao="Editar produto"
          rotuloInativacao="Inativar produto"
        />
      </td>
    </tr>
  );
}
