import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';

export function DetalhesCliente({ cliente }) {
  return (
    <div className="celulaRegistroDetalhes">
      <div className="topoRegistroDetalhes">
        <strong>{cliente.nomeFantasia || cliente.razaoSocial}</strong>
        <CodigoRegistro valor={cliente.idCliente} />
      </div>

      <span className="textoSecundarioRegistro">{cliente.cnpj || 'CNPJ nao informado'}</span>
    </div>
  );
}
