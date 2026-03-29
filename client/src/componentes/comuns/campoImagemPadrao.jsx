import { useEffect, useRef, useState } from 'react';
import { Botao } from './botao';
import { CodigoRegistro } from './codigoRegistro';

const tamanhoRecorteImagem = 320;
const tamanhoSaidaImagem = 480;
const tamanhoMaximoImagemBytes = 5 * 1024 * 1024;

export function CampoImagemPadrao({
  valor,
  alt,
  iniciais,
  onChange,
  disabled = false,
  codigo,
  rotuloBotao = 'Imagem'
}) {
  const campoArquivoImagem = useRef(null);
  const [modalRecorteAberto, definirModalRecorteAberto] = useState(false);
  const [imagemTemporaria, definirImagemTemporaria] = useState('');
  const [dimensoesImagem, definirDimensoesImagem] = useState(null);
  const [zoom, definirZoom] = useState(1);
  const [posicaoHorizontal, definirPosicaoHorizontal] = useState(0.5);
  const [posicaoVertical, definirPosicaoVertical] = useState(0.5);
  const [manterImagemInteira, definirManterImagemInteira] = useState(false);
  const [corFundo, definirCorFundo] = useState('#FFFFFF');

  useEffect(() => () => {
    if (imagemTemporaria) {
      URL.revokeObjectURL(imagemTemporaria);
    }
  }, [imagemTemporaria]);

  function abrirSelecaoImagem() {
    if (!disabled) {
      campoArquivoImagem.current?.click();
    }
  }

  async function carregarImagem(evento) {
    const arquivo = evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (arquivo.size > tamanhoMaximoImagemBytes) {
      window.alert('A imagem selecionada excede o limite de 5 MB.');
      evento.target.value = '';
      return;
    }

    const urlTemporaria = URL.createObjectURL(arquivo);
    const dimensoes = await obterDimensoesImagem(urlTemporaria);

    if (imagemTemporaria) {
      URL.revokeObjectURL(imagemTemporaria);
    }

    definirImagemTemporaria(urlTemporaria);
    definirDimensoesImagem(dimensoes);
    definirZoom(1);
    definirPosicaoHorizontal(0.5);
    definirPosicaoVertical(0.5);
    definirManterImagemInteira(false);
    definirCorFundo('#FFFFFF');
    definirModalRecorteAberto(true);
    evento.target.value = '';
  }

  function fecharModalRecorte() {
    if (imagemTemporaria) {
      URL.revokeObjectURL(imagemTemporaria);
    }

    definirModalRecorteAberto(false);
    definirImagemTemporaria('');
    definirDimensoesImagem(null);
    definirZoom(1);
    definirPosicaoHorizontal(0.5);
    definirPosicaoVertical(0.5);
    definirManterImagemInteira(false);
    definirCorFundo('#FFFFFF');
  }

  async function confirmarRecorte() {
    if (!imagemTemporaria || !dimensoesImagem) {
      return;
    }

    onChange(
      await gerarImagemRecortada({
        origem: imagemTemporaria,
        dimensoesImagem,
        zoom,
        posicaoHorizontal,
        posicaoVertical,
        manterImagemInteira,
        corFundo
      })
    );
    fecharModalRecorte();
  }

  const estiloImagemRecorte = criarEstiloImagemRecorte(
    dimensoesImagem,
    zoom,
    posicaoHorizontal,
    posicaoVertical,
    manterImagemInteira
  );

  return (
    <>
      <div className="thumbnailCliente">
        {codigo !== undefined ? (
          <div className="codigoThumbnailCliente">
            <CodigoRegistro valor={codigo} />
          </div>
        ) : null}

        <div className="previewThumbnailCliente">
          {valor ? (
            <img src={valor} alt={alt} />
          ) : (
            <span>{iniciais}</span>
          )}
        </div>

        <input
          ref={campoArquivoImagem}
          type="file"
          accept="image/*"
          className="campoArquivoImagem"
          onChange={carregarImagem}
        />

        <Botao
          variante="secundario"
          icone="upload"
          type="button"
          onClick={abrirSelecaoImagem}
          disabled={disabled}
        >
          {rotuloBotao}
        </Botao>
      </div>

      {modalRecorteAberto && imagemTemporaria && dimensoesImagem ? (
        <div className="camadaRecorteImagem" role="presentation" onMouseDown={fecharModalRecorte}>
          <div
            className="modalRecorteImagem"
            role="dialog"
            aria-modal="true"
            aria-label="Recortar imagem"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoModalRecorteImagem">
              <div>
                <h3>Recortar imagem</h3>
                <p>Escolha a area que sera aproveitada na thumbnail.</p>
              </div>

              <div className="acoesCabecalhoRecorteImagem">
                <Botao variante="secundario" type="button" onClick={fecharModalRecorte}>
                  Cancelar
                </Botao>
                <Botao variante="primario" type="button" onClick={confirmarRecorte}>
                  Aplicar
                </Botao>
              </div>
            </div>

            <div className="corpoModalRecorteImagem">
                <div className="areaVisualRecorteImagem">
                <div className="molduraRecorteImagem" style={{ backgroundColor: corFundo }}>
                  <img
                    src={imagemTemporaria}
                    alt="Pre-visualizacao da imagem"
                    className="imagemRecorteImagem"
                    style={estiloImagemRecorte}
                  />
                </div>
              </div>

              <div className="painelControlesRecorteImagem">
                <div className="grupoControleRecorteImagem">
                  <label htmlFor="zoom-recorte-imagem">Zoom</label>
                  <input
                    id="zoom-recorte-imagem"
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(evento) => definirZoom(Number(evento.target.value))}
                  />
                </div>

                <label className="opcaoRecorteImagem">
                  <input
                    type="checkbox"
                    checked={manterImagemInteira}
                    onChange={(evento) => definirManterImagemInteira(evento.target.checked)}
                  />
                  <span>Manter imagem inteira</span>
                </label>

                <div className="grupoControleRecorteImagem">
                  <label htmlFor="cor-fundo-recorte-imagem">Cor do fundo</label>
                  <div className="controleCorRecorteImagem">
                    <input
                      id="cor-fundo-recorte-imagem"
                      type="color"
                      value={corFundo}
                      onChange={(evento) => definirCorFundo(evento.target.value)}
                    />
                    <span>{corFundo.toUpperCase()}</span>
                  </div>
                </div>

                <div className="grupoControleRecorteImagem">
                  <label htmlFor="horizontal-recorte-imagem">Horizontal</label>
                  <input
                    id="horizontal-recorte-imagem"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={posicaoHorizontal}
                    onChange={(evento) => definirPosicaoHorizontal(Number(evento.target.value))}
                  />
                </div>

                <div className="grupoControleRecorteImagem">
                  <label htmlFor="vertical-recorte-imagem">Vertical</label>
                  <input
                    id="vertical-recorte-imagem"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={posicaoVertical}
                    onChange={(evento) => definirPosicaoVertical(Number(evento.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function obterDimensoesImagem(urlImagem) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve({
      largura: imagem.naturalWidth,
      altura: imagem.naturalHeight
    });
    imagem.onerror = reject;
    imagem.src = urlImagem;
  });
}

function criarEstiloImagemRecorte(
  dimensoesImagem,
  zoom,
  posicaoHorizontal,
  posicaoVertical,
  manterImagemInteira
) {
  if (!dimensoesImagem) {
    return undefined;
  }

  const { larguraRenderizada, alturaRenderizada, posicaoX, posicaoY } = calcularPosicionamentoRecorte({
    larguraMoldura: tamanhoRecorteImagem,
    alturaMoldura: tamanhoRecorteImagem,
    dimensoesImagem,
    zoom,
    posicaoHorizontal,
    posicaoVertical,
    manterImagemInteira
  });

  return {
    width: `${larguraRenderizada}px`,
    height: `${alturaRenderizada}px`,
    left: `${posicaoX}px`,
    top: `${posicaoY}px`
  };
}

async function gerarImagemRecortada({
  origem,
  dimensoesImagem,
  zoom,
  posicaoHorizontal,
  posicaoVertical,
  manterImagemInteira,
  corFundo
}) {
  const canvas = document.createElement('canvas');
  canvas.width = tamanhoSaidaImagem;
  canvas.height = tamanhoSaidaImagem;

  const contexto = canvas.getContext('2d');
  const imagem = await carregarElementoImagem(origem);
  contexto.fillStyle = corFundo || '#FFFFFF';
  contexto.fillRect(0, 0, tamanhoSaidaImagem, tamanhoSaidaImagem);

  const { larguraRenderizada, alturaRenderizada, posicaoX, posicaoY } = calcularPosicionamentoRecorte({
    larguraMoldura: tamanhoSaidaImagem,
    alturaMoldura: tamanhoSaidaImagem,
    dimensoesImagem,
    zoom,
    posicaoHorizontal,
    posicaoVertical,
    manterImagemInteira
  });

  contexto.drawImage(imagem, posicaoX, posicaoY, larguraRenderizada, alturaRenderizada);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function calcularPosicionamentoRecorte({
  larguraMoldura,
  alturaMoldura,
  dimensoesImagem,
  zoom,
  posicaoHorizontal,
  posicaoVertical,
  manterImagemInteira
}) {
  const escalaBase = manterImagemInteira
    ? Math.min(
      larguraMoldura / dimensoesImagem.largura,
      alturaMoldura / dimensoesImagem.altura
    )
    : Math.max(
      larguraMoldura / dimensoesImagem.largura,
      alturaMoldura / dimensoesImagem.altura
    );
  const larguraRenderizada = dimensoesImagem.largura * escalaBase * zoom;
  const alturaRenderizada = dimensoesImagem.altura * escalaBase * zoom;
  const sobraHorizontal = larguraMoldura - larguraRenderizada;
  const sobraVertical = alturaMoldura - alturaRenderizada;
  const posicaoX = sobraHorizontal >= 0
    ? sobraHorizontal * posicaoHorizontal
    : sobraHorizontal * posicaoHorizontal;
  const posicaoY = sobraVertical >= 0
    ? sobraVertical * posicaoVertical
    : sobraVertical * posicaoVertical;

  return {
    larguraRenderizada,
    alturaRenderizada,
    posicaoX,
    posicaoY
  };
}

function carregarElementoImagem(urlImagem) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = reject;
    imagem.src = urlImagem;
  });
}
