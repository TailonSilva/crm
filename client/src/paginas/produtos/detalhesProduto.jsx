import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';

export function DetalhesProduto({ produto }) {
  return (
    <div className="celulaRegistroDetalhes">
      <div className="topoRegistroDetalhes">
        <strong>{produto.referencia || 'Referencia nao informada'}</strong>
        <CodigoRegistro valor={produto.idProduto} />
      </div>

      <span className="textoSecundarioRegistro">{produto.descricao}</span>
    </div>
  );
}
