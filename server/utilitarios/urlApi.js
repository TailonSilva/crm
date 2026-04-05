function obterBaseUrlApi() {
  const baseConfigurada = String(process.env.PUBLIC_API_BASE_URL || '').trim();

  if (baseConfigurada) {
    return baseConfigurada.replace(/\/+$/, '');
  }

  const porta = Number(process.env.PORT || 3001);
  return `http://127.0.0.1:${Number.isFinite(porta) && porta > 0 ? porta : 3001}`;
}

function montarUrlArquivo(caminhoArquivo = '') {
  const caminhoNormalizado = String(caminhoArquivo || '').replace(/^\/+/, '');
  return `${obterBaseUrlApi()}/api/arquivos/${caminhoNormalizado}`;
}

module.exports = {
  obterBaseUrlApi,
  montarUrlArquivo
};
