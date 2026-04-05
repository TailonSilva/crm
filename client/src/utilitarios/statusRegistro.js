export function registroEstaAtivo(valor) {
  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase();

    if (!texto || texto === '0' || texto === 'false' || texto === 'inativo') {
      return false;
    }

    if (texto === '1' || texto === 'true' || texto === 'ativo') {
      return true;
    }
  }

  return Number(valor) !== 0 && Boolean(valor);
}

export function normalizarStatusRegistro(valor) {
  return registroEstaAtivo(valor) ? 1 : 0;
}
