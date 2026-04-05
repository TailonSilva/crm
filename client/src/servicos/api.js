function obterUrlApiPadrao() {
  if (typeof window !== 'undefined' && window.location?.protocol !== 'file:') {
    return 'http://127.0.0.1:3101/api';
  }

  return 'http://127.0.0.1:3001/api';
}

const urlApi = import.meta.env.VITE_API_URL || obterUrlApiPadrao();

export async function requisitarApi(caminho, configuracao) {
  const url = `${urlApi}${caminho}`;
  let resposta;

  try {
    resposta = await fetch(url, configuracao);
  } catch (erro) {
    console.error('Falha de conexao com a API.', { url, configuracao, erro });
    throw erro;
  }

  const textoResposta = await resposta.text();
  const dados = textoResposta ? JSON.parse(textoResposta) : null;

  if (!resposta.ok) {
    const erro = new Error(dados?.mensagem || 'Falha ao processar a requisicao.');
    console.error('API retornou erro.', { url, status: resposta.status, dados });
    throw erro;
  }

  return dados;
}
