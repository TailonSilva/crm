import { useEffect, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { CampoImagemPadrao } from '../../componentes/comuns/campoImagemPadrao';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import {
  desformatarPreco,
  normalizarPreco,
  normalizarPrecoDigitado
} from '../../utilitarios/normalizarPreco';

const abasModalProduto = [
  { id: 'dadosGerais', label: 'Dados gerais' },
  { id: 'vendas', label: 'Vendas' }
];

const estadoInicialFormulario = {
  referencia: '',
  descricao: '',
  idGrupo: '',
  idMarca: '',
  idUnidade: '',
  preco: '',
  imagem: '',
  status: true
};

export function ModalProduto({
  aberto,
  produto,
  codigoSugerido,
  gruposProduto,
  marcas,
  unidadesMedida,
  modo = 'novo',
  aoFechar,
  aoSalvar
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [abaAtiva, definirAbaAtiva] = useState(abasModalProduto[0].id);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [confirmandoSaida, definirConfirmandoSaida] = useState(false);
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = !produto;

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioProduto(produto));
    definirAbaAtiva(abasModalProduto[0].id);
    definirSalvando(false);
    definirMensagemErro('');
    definirConfirmandoSaida(false);
  }, [aberto, produto]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !salvando) {
        tentarFecharModal();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar, salvando]);

  if (!aberto) {
    return null;
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    if (somenteLeitura) {
      return;
    }

    const camposObrigatorios = [
      ['referencia', 'Informe a referencia do produto.'],
      ['descricao', 'Informe a descricao do produto.'],
      ['idGrupo', 'Selecione um grupo.'],
      ['idMarca', 'Selecione uma marca.'],
      ['idUnidade', 'Selecione uma unidade.'],
      ['preco', 'Informe o preco do produto.']
    ];

    const mensagemValidacao = camposObrigatorios.find(([campo]) => {
      const valor = formulario[campo];
      return valor === '' || valor === null || valor === undefined;
    });

    if (mensagemValidacao) {
      definirMensagemErro(mensagemValidacao[1]);
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o produto.');
      definirSalvando(false);
    }
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === 'checkbox'
        ? checked
        : name === 'preco' ? normalizarPrecoDigitado(value) : value
    }));
  }

  function tratarFocoPreco() {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      preco: desformatarPreco(estadoAtual.preco)
    }));
  }

  function tratarDesfoquePreco() {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      preco: estadoAtual.preco ? normalizarPreco(estadoAtual.preco) : ''
    }));
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      tentarFecharModal();
    }
  }

  function tentarFecharModal() {
    if (!somenteLeitura && modoInclusao) {
      definirConfirmandoSaida(true);
      return;
    }

    aoFechar();
  }

  function fecharConfirmacaoSaida() {
    if (salvando) {
      return;
    }

    definirConfirmandoSaida(false);
  }

  function confirmarSaida() {
    definirConfirmandoSaida(false);
    aoFechar();
  }

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalCliente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalProduto"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <header className="cabecalhoModalCliente">
          <h2 id="tituloModalProduto">
            {somenteLeitura ? 'Consultar produto' : produto ? 'Editar produto' : 'Incluir produto'}
          </h2>

          <div className="acoesCabecalhoModalCliente">
            <Botao variante="secundario" type="button" onClick={tentarFecharModal} disabled={salvando}>
              {somenteLeitura ? 'Fechar' : 'Cancelar'}
            </Botao>
            {!somenteLeitura ? (
              <Botao variante="primario" type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="abasModalCliente" role="tablist" aria-label="Secoes do cadastro do produto">
          {abasModalProduto.map((aba) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              className={`abaModalCliente ${abaAtiva === aba.id ? 'ativa' : ''}`}
              aria-selected={abaAtiva === aba.id}
              onClick={() => definirAbaAtiva(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div className="corpoModalCliente">
          {abaAtiva === 'dadosGerais' ? (
            <section className="painelDadosGeraisCliente">
              <CampoImagemPadrao
                valor={formulario.imagem}
                alt={`Imagem de ${formulario.descricao || formulario.referencia || 'produto'}`}
                iniciais={obterIniciaisProduto(formulario)}
                codigo={produto?.idProduto || codigoSugerido || 0}
                disabled={somenteLeitura}
                onChange={(imagem) => definirFormulario((estadoAtual) => ({
                  ...estadoAtual,
                  imagem: imagem || estadoAtual.imagem
                }))}
              />

              <div className="gradeCamposModalCliente">
                <CampoFormulario
                  label="Referencia"
                  name="referencia"
                  value={formulario.referencia}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                  required
                />
                <CampoFormulario
                  label="Descricao"
                  name="descricao"
                  value={formulario.descricao}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                  required
                />
                <CampoSelect
                  label="Grupo"
                  name="idGrupo"
                  value={formulario.idGrupo}
                  onChange={alterarCampo}
                  options={gruposProduto.map((grupo) => ({
                    valor: String(grupo.idGrupo),
                    label: grupo.descricao
                  }))}
                  disabled={somenteLeitura}
                  required
                />
                <CampoSelect
                  label="Marca"
                  name="idMarca"
                  value={formulario.idMarca}
                  onChange={alterarCampo}
                  options={marcas.map((marca) => ({
                    valor: String(marca.idMarca),
                    label: marca.descricao
                  }))}
                  disabled={somenteLeitura}
                  required
                />
                <CampoSelect
                  label="Unidade"
                  name="idUnidade"
                  value={formulario.idUnidade}
                  onChange={alterarCampo}
                  options={unidadesMedida.map((unidade) => ({
                    valor: String(unidade.idUnidade),
                    label: unidade.descricao
                  }))}
                  disabled={somenteLeitura}
                  required
                />
                <CampoFormulario
                  label="Preco"
                  name="preco"
                  value={formulario.preco}
                  onChange={alterarCampo}
                  onFocus={tratarFocoPreco}
                  onBlur={tratarDesfoquePreco}
                  disabled={somenteLeitura}
                  inputMode="decimal"
                  required
                />
                <label className="campoCheckboxFormulario" htmlFor="statusProduto">
                  <input
                    id="statusProduto"
                    type="checkbox"
                    name="status"
                    checked={formulario.status}
                    onChange={alterarCampo}
                    disabled={somenteLeitura}
                  />
                  <span>Produto ativo</span>
                </label>
              </div>
            </section>
          ) : null}

          {abaAtiva === 'vendas' ? (
            <section className="painelVazioModalCliente">
              <p>Conteudo em construcao.</p>
            </section>
          ) : null}
        </div>

        {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}

        {confirmandoSaida ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={fecharConfirmacaoSaida}>
            <div
              className="modalConfirmacaoAgenda"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoSaidaProduto"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoSaidaProduto">Cancelar cadastro</h4>
              </div>

              <div className="corpoConfirmacaoModal">
                <p>Se fechar agora, todas as informacoes preenchidas serao perdidas.</p>
              </div>

              <div className="acoesConfirmacaoModal">
                <Botao variante="secundario" type="button" onClick={fecharConfirmacaoSaida} disabled={salvando}>
                  Nao
                </Botao>
                <Botao variante="perigo" type="button" onClick={confirmarSaida} disabled={salvando}>
                  Sim
                </Botao>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function CampoFormulario({ label, name, type = 'text', ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
}

function CampoSelect({ label, name, options, ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} className="entradaFormulario" {...props}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.valor} value={option.valor}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function criarFormularioProduto(produto) {
  if (!produto) {
    return estadoInicialFormulario;
  }

  return {
    referencia: produto.referencia || '',
    descricao: produto.descricao || '',
    idGrupo: String(produto.idGrupo || ''),
    idMarca: String(produto.idMarca || ''),
    idUnidade: String(produto.idUnidade || ''),
    preco: produto.preco ? normalizarPreco(produto.preco) : '',
    imagem: produto.imagem || '',
    status: Boolean(produto.status)
  };
}

function obterIniciaisProduto(produto) {
  const textoBase = produto.referencia || produto.descricao || 'PR';

  return textoBase.slice(0, 2).toUpperCase();
}
