export function CodigoRegistro({ valor }) {
  return <span className="codigoRegistro">#{String(valor).padStart(4, '0')}</span>;
}
