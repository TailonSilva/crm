export function montarParametrosConsulta(parametros = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(parametros).forEach(([chave, valor]) => {
    if (Array.isArray(valor)) {
      valor
        .map((item) => String(item ?? '').trim())
        .filter(Boolean)
        .forEach((item) => searchParams.append(chave, item));
      return;
    }

    const texto = String(valor ?? '').trim();

    if (texto) {
      searchParams.set(chave, texto);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
