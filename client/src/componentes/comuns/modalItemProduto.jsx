import { Botao } from './botao';
import { MensagemErroPopup } from './mensagemErroPopup';
import { CampoImagemPadrao } from './campoImagemPadrao';
import { ModalBuscaProdutos } from './modalBuscaProdutos';

export function ModalItemProduto({
  aberto,
  titulo,
  somenteLeitura,
  itemFormulario,
  produtos,
  mensagemErro,
  modalBuscaProdutoAberto,
  onFechar,
  onSalvar,
  onAlterarCampo,
  onAlterarImagem,
  onAbrirBuscaProduto,
  onFecharBuscaProduto,
  onSelecionarProduto,
  obterIniciais
}) {
  if (!aberto) {
    return null;
  }

  return (
    <div className="camadaModalContato" role="presentation" onMouseDown={onFechar}>
      <div
        className="modalContatoCliente modalItemOrcamento modalItemProduto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalItemProduto"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <div className="cabecalhoModalContato">
          <h3 id="tituloModalItemProduto">{titulo}</h3>

          <div className="acoesFormularioContatoModal">
            <Botao variante="secundario" type="button" onClick={onFechar}>
              {somenteLeitura ? 'Fechar' : 'Cancelar'}
            </Botao>
            {!somenteLeitura ? (
              <Botao variante="primario" type="button" onClick={onSalvar}>
                Salvar
              </Botao>
            ) : null}
          </div>
        </div>

        <div className="corpoModalContato">
          <div className="layoutModalOrcamento">
            <CampoImagemPadrao
              valor={itemFormulario.imagem}
              alt={itemFormulario.descricaoProdutoSnapshot || 'Item do produto'}
              iniciais={obterIniciais(itemFormulario)}
              disabled={somenteLeitura}
              tamanhoSaidaImagem={1024}
              qualidadeSaidaImagem={0.9}
              onChange={(imagem) => onAlterarImagem(imagem || '')}
            />

            <div className="colunaPrincipalModalOrcamento">
              {somenteLeitura ? (
                <CampoFormulario
                  label="Produto"
                  name="descricaoProdutoSnapshot"
                  value={itemFormulario.descricaoProdutoSnapshot}
                  disabled
                />
              ) : (
                <CampoSelect
                  label="Produto"
                  name="idProduto"
                  value={itemFormulario.idProduto}
                  onChange={onAlterarCampo}
                  options={produtos.map((produto) => ({
                    valor: String(produto.idProduto),
                    label: produto.descricao || produto.referencia || `Produto ${produto.idProduto}`
                  }))}
                  disabled={somenteLeitura}
                  acaoExtra={!somenteLeitura ? (
                    <Botao
                      variante="secundario"
                      type="button"
                      icone="pesquisa"
                      className="botaoCampoAcao"
                      somenteIcone
                      title="Buscar produto"
                      aria-label="Buscar produto"
                      onClick={onAbrirBuscaProduto}
                    >
                      Buscar produto
                    </Botao>
                  ) : null}
                />
              )}

              <div className="linhaUsuarioCanalOrigemAtendimento">
                <CampoFormulario label="Quantidade" name="quantidade" value={itemFormulario.quantidade} onChange={onAlterarCampo} disabled={somenteLeitura} />
                <CampoFormulario label="Valor unitario" name="valorUnitario" value={itemFormulario.valorUnitario} onChange={onAlterarCampo} disabled={somenteLeitura} />
                <CampoFormulario label="Valor total" name="valorTotal" value={itemFormulario.valorTotal} onChange={onAlterarCampo} disabled />
              </div>

              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="observacaoItemProduto">Observacao do item</label>
                <textarea
                  id="observacaoItemProduto"
                  name="observacao"
                  className="entradaFormulario entradaFormularioTextoLongo"
                  rows={4}
                  value={itemFormulario.observacao}
                  onChange={onAlterarCampo}
                  disabled={somenteLeitura}
                />
              </div>
            </div>
          </div>
          <MensagemErroPopup mensagem={mensagemErro} titulo="Nao foi possivel salvar o item." />
        </div>

        <ModalBuscaProdutos
          aberto={modalBuscaProdutoAberto}
          placeholder="Pesquisar produtos"
          ariaLabelPesquisa="Pesquisar produtos"
          produtos={produtos}
          aoSelecionar={onSelecionarProduto}
          aoFechar={onFecharBuscaProduto}
        />
      </div>
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

function CampoSelect({ label, name, options, acaoExtra = null, ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <div className="campoComAcao">
        <select id={name} name={name} className="entradaFormulario" {...props}>
          <option value="">Selecione</option>
          {options.map((option) => (
            <option key={option.valor} value={option.valor}>
              {option.label}
            </option>
          ))}
        </select>
        {acaoExtra}
      </div>
    </div>
  );
}
