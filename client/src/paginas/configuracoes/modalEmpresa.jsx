import { useEffect, useMemo, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { MensagemErroPopup } from '../../componentes/comuns/mensagemErroPopup';
import { CampoSelecaoMultiplaModal } from '../../componentes/comuns/campoSelecaoMultiplaModal';
import { CampoImagemPadrao } from '../../componentes/comuns/campoImagemPadrao';
import { buscarCep } from '../../servicos/empresa';
import { normalizarTelefone } from '../../utilitarios/normalizarTelefone';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';

const abasModalEmpresa = [
  { id: 'dadosGerais', label: 'Dados gerais' },
  { id: 'endereco', label: 'Endereco' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'orcamentosPedidos', label: 'Orcamentos/Pedidos' }
];

const estadoInicialFormulario = {
  razaoSocial: '',
  nomeFantasia: '',
  slogan: '',
  tipo: 'Pessoa juridica',
  cnpj: '',
  inscricaoEstadual: '',
  email: '',
  telefone: '',
  horaInicioManha: '08:00',
  horaFimManha: '12:00',
  horaInicioTarde: '13:00',
  horaFimTarde: '18:00',
  trabalhaSabado: false,
  horaInicioSabado: '08:00',
  horaFimSabado: '12:00',
  exibirFunilPaginaInicial: true,
  diasValidadeOrcamento: '7',
  diasEntregaPedido: '7',
  codigoPrincipalCliente: 'codigo',
  etapasFiltroPadraoOrcamento: [],
  corPrimariaOrcamento: '#111827',
  corSecundariaOrcamento: '#ef4444',
  corDestaqueOrcamento: '#f59e0b',
  destaqueItemOrcamentoPdf: 'descricao',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  imagem: ''
};

export function ModalEmpresa({
  aberto,
  empresa,
  etapasOrcamento = [],
  modo = 'edicao',
  aoFechar,
  aoSalvar
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [abaAtiva, definirAbaAtiva] = useState(abasModalEmpresa[0].id);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [buscandoCep, definirBuscandoCep] = useState(false);
  const somenteLeitura = modo === 'consulta';
  const tipoPessoaFisica = formulario.tipo === 'Pessoa fisica';
  const rotuloDocumento = tipoPessoaFisica ? 'CPF' : 'CNPJ';
  const etapasOrcamentoAtivasOrdenadas = useMemo(
    () => [...etapasOrcamento]
      .filter((etapa) => etapa.status !== 0)
      .sort((etapaA, etapaB) => {
        const ordemA = Number(etapaA?.ordem || etapaA?.idEtapaOrcamento || 0);
        const ordemB = Number(etapaB?.ordem || etapaB?.idEtapaOrcamento || 0);

        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }

        return Number(etapaA?.idEtapaOrcamento || 0) - Number(etapaB?.idEtapaOrcamento || 0);
      }),
    [etapasOrcamento]
  );

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioEmpresa(empresa));
    definirAbaAtiva(abasModalEmpresa[0].id);
    definirSalvando(false);
    definirMensagemErro('');
    definirBuscandoCep(false);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !salvando) {
        aoFechar();
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
      ['razaoSocial', 'Informe a razao social.'],
      ['nomeFantasia', 'Informe o nome fantasia.'],
      ['tipo', 'Informe o tipo da empresa.'],
      ['cnpj', `Informe o ${rotuloDocumento}.`]
    ];

    const mensagemValidacao = camposObrigatorios.find(([campo]) => {
      const valor = formulario[campo];
      return valor === '' || valor === null || valor === undefined;
    });

    if (mensagemValidacao) {
      definirMensagemErro(mensagemValidacao[1]);
      return;
    }

    if (
      formulario.horaInicioManha &&
      formulario.horaFimManha &&
      formulario.horaFimManha <= formulario.horaInicioManha
    ) {
      definirMensagemErro('O fim do expediente da manha deve ser maior que o inicio.');
      return;
    }

    if (
      formulario.horaInicioTarde &&
      formulario.horaFimTarde &&
      formulario.horaFimTarde <= formulario.horaInicioTarde
    ) {
      definirMensagemErro('O fim do expediente da tarde deve ser maior que o inicio.');
      return;
    }

    if (
      formulario.horaFimManha &&
      formulario.horaInicioTarde &&
      formulario.horaInicioTarde <= formulario.horaFimManha
    ) {
      definirMensagemErro('O inicio da tarde deve ser maior que o fim da manha.');
      return;
    }

    if (formulario.trabalhaSabado) {
      if (!formulario.horaInicioSabado || !formulario.horaFimSabado) {
        definirMensagemErro('Informe o horario de expediente do sabado.');
        return;
      }

      if (formulario.horaFimSabado <= formulario.horaInicioSabado) {
        definirMensagemErro('O fim do expediente de sabado deve ser maior que o inicio.');
        return;
      }
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar a empresa.');
      definirSalvando(false);
    }
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

    definirFormulario((estadoAtual) => {
      const tipoDocumentoAtualizado = name === 'tipo' ? valorNormalizado : estadoAtual.tipo;
      const proximoEstado = {
        ...estadoAtual,
        [name]: type === 'checkbox'
          ? checked
          : name === 'telefone'
            ? normalizarTelefone(valorNormalizado)
            : name === 'cnpj'
              ? formatarDocumentoFiscal(valorNormalizado, tipoDocumentoAtualizado)
              : valorNormalizado
      };

      if (name === 'tipo') {
        proximoEstado.cnpj = formatarDocumentoFiscal(estadoAtual.cnpj, tipoDocumentoAtualizado);
      }

      return proximoEstado;
    });
  }

  async function buscarDadosCep() {
    if (somenteLeitura) {
      return;
    }

    definirBuscandoCep(true);
    definirMensagemErro('');

    try {
      const dadosCep = await buscarCep(formulario.cep);

      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        cep: dadosCep.cep || estadoAtual.cep,
        logradouro: dadosCep.logradouro || estadoAtual.logradouro,
        complemento: dadosCep.complemento || estadoAtual.complemento,
        bairro: dadosCep.bairro || estadoAtual.bairro,
        cidade: dadosCep.localidade || estadoAtual.cidade,
        estado: dadosCep.uf || estadoAtual.estado
      }));
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel consultar o CEP.');
      definirAbaAtiva('endereco');
    } finally {
      definirBuscandoCep(false);
    }
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      aoFechar();
    }
  }

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalCliente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalEmpresa"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <header className="cabecalhoModalCliente">
          <h2 id="tituloModalEmpresa">
            {empresa ? 'Cadastro da empresa' : 'Incluir empresa'}
          </h2>

          <div className="acoesCabecalhoModalCliente">
            <Botao
              variante="secundario"
              type="button"
              icone="fechar"
              somenteIcone
              title="Fechar"
              aria-label="Fechar"
              onClick={aoFechar}
              disabled={salvando}
            >
              Fechar
            </Botao>
            {!somenteLeitura ? (
              <Botao
                variante="primario"
                type="submit"
                icone="confirmar"
                somenteIcone
                title={salvando ? 'Salvando...' : 'Salvar'}
                aria-label={salvando ? 'Salvando...' : 'Salvar'}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="abasModalCliente" role="tablist" aria-label="Secoes do cadastro da empresa">
          {abasModalEmpresa.map((aba) => (
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
                alt={`Imagem de ${formulario.nomeFantasia || formulario.razaoSocial || 'empresa'}`}
                iniciais={obterIniciaisEmpresa(formulario)}
                disabled={somenteLeitura}
                onChange={(imagem) => definirFormulario((estadoAtual) => ({
                  ...estadoAtual,
                  imagem: imagem || estadoAtual.imagem
                }))}
              />

              <div className="gradeCamposModalCliente">
                <CampoFormulario label="Razao social" name="razaoSocial" value={formulario.razaoSocial} onChange={alterarCampo} disabled={somenteLeitura} required />
                <CampoFormulario label="Nome fantasia" name="nomeFantasia" value={formulario.nomeFantasia} onChange={alterarCampo} disabled={somenteLeitura} required />
                <CampoFormulario label="Slogan" name="slogan" value={formulario.slogan} onChange={alterarCampo} disabled={somenteLeitura} />
                <CampoSelect label="Tipo" name="tipo" value={formulario.tipo} onChange={alterarCampo} options={[{ valor: 'Pessoa fisica', label: 'Pessoa fisica' }, { valor: 'Pessoa juridica', label: 'Pessoa juridica' }]} disabled={somenteLeitura} required />
                <CampoFormulario label={rotuloDocumento} name="cnpj" value={formulario.cnpj} onChange={alterarCampo} disabled={somenteLeitura} required />
                <CampoFormulario label="Inscricao estadual" name="inscricaoEstadual" value={formulario.inscricaoEstadual} onChange={alterarCampo} disabled={somenteLeitura} />
                <CampoFormulario label="E-mail" name="email" type="email" value={formulario.email} onChange={alterarCampo} disabled={somenteLeitura} />
                <CampoFormulario label="Telefone" name="telefone" value={formulario.telefone} onChange={alterarCampo} disabled={somenteLeitura} />
              </div>
            </section>
          ) : null}

          {abaAtiva === 'endereco' ? (
            <section className="gradeCamposModalCliente">
              <CampoFormularioComAcao label="CEP" name="cep" value={formulario.cep} onChange={alterarCampo} aoAcionar={buscarDadosCep} carregando={buscandoCep} rotuloAcao="Buscar CEP" disabled={somenteLeitura} />
              <CampoFormulario label="Logradouro" name="logradouro" value={formulario.logradouro} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Numero" name="numero" value={formulario.numero} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Complemento" name="complemento" value={formulario.complemento} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Bairro" name="bairro" value={formulario.bairro} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Cidade" name="cidade" value={formulario.cidade} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Estado" name="estado" value={formulario.estado} onChange={alterarCampo} disabled={somenteLeitura} maxLength={2} />
            </section>
          ) : null}

          {abaAtiva === 'agenda' ? (
            <section className="gradeCamposModalCliente">
              <CampoFormulario label="Inicio da manha" name="horaInicioManha" type="time" value={formulario.horaInicioManha} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Fim da manha" name="horaFimManha" type="time" value={formulario.horaFimManha} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Inicio da tarde" name="horaInicioTarde" type="time" value={formulario.horaInicioTarde} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Fim da tarde" name="horaFimTarde" type="time" value={formulario.horaFimTarde} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoCheckbox
                label="Trabalha aos sabados"
                name="trabalhaSabado"
                checked={formulario.trabalhaSabado}
                onChange={alterarCampo}
                disabled={somenteLeitura}
              />
              {formulario.trabalhaSabado ? (
                <>
                  <CampoFormulario label="Inicio do sabado" name="horaInicioSabado" type="time" value={formulario.horaInicioSabado} onChange={alterarCampo} disabled={somenteLeitura} />
                  <CampoFormulario label="Fim do sabado" name="horaFimSabado" type="time" value={formulario.horaFimSabado} onChange={alterarCampo} disabled={somenteLeitura} />
                </>
              ) : null}
            </section>
          ) : null}

          {abaAtiva === 'orcamentosPedidos' ? (
            <section className="gradeCamposModalCliente">
              <CampoFormulario label="Validade padrao do orcamento (dias)" name="diasValidadeOrcamento" type="number" min="0" value={formulario.diasValidadeOrcamento} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Prazo padrao de entrega do pedido (dias)" name="diasEntregaPedido" type="number" min="0" value={formulario.diasEntregaPedido} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoSelect
                label="Codigo principal do cliente"
                name="codigoPrincipalCliente"
                value={formulario.codigoPrincipalCliente}
                onChange={alterarCampo}
                options={[
                  { valor: 'codigo', label: 'Codigo padrao' },
                  { valor: 'codigoAlternativo', label: 'Codigo alternativo' }
                ]}
                disabled={somenteLeitura}
              />
              <CampoSelect
                label="Primeiro plano dos itens"
                name="destaqueItemOrcamentoPdf"
                value={formulario.destaqueItemOrcamentoPdf}
                onChange={alterarCampo}
                options={[
                  { valor: 'descricao', label: 'Descricao em primeiro plano' },
                  { valor: 'referencia', label: 'Referencia em primeiro plano' }
                ]}
                disabled={somenteLeitura}
              />
              <CampoSelecaoMultiplaModal
                className="campoFormularioIntegral"
                label="Filtro padrao de status do orcamento"
                titulo="Status padrao do orcamento"
                itens={etapasOrcamentoAtivasOrdenadas.map((etapa) => ({
                  valor: String(etapa.idEtapaOrcamento),
                  label: etapa.descricao
                }))}
                valoresSelecionados={formulario.etapasFiltroPadraoOrcamento}
                placeholder="Todos"
                disabled={somenteLeitura}
                aoAlterar={(valores) => definirFormulario((estadoAtual) => ({
                  ...estadoAtual,
                  etapasFiltroPadraoOrcamento: valores
                }))}
              />
            </section>
          ) : null}
        </div>

        <MensagemErroPopup mensagem={mensagemErro} titulo="Nao foi possivel salvar a empresa." />
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

function CampoFormularioComAcao({
  label,
  name,
  aoAcionar,
  carregando,
  rotuloAcao,
  disabled = false,
  ...props
}) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <div className="campoComAcao">
        <input id={name} name={name} type="text" className="entradaFormulario" disabled={disabled} {...props} />
        <Botao variante="secundario" icone="pesquisa" type="button" className="botaoCampoAcao" onClick={aoAcionar} disabled={carregando || disabled}>
          {carregando ? 'Buscando...' : rotuloAcao}
        </Botao>
      </div>
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

function CampoCheckbox({ label, name, ...props }) {
  return (
    <div className="campoCheckboxFormulario">
      <input id={name} name={name} type="checkbox" {...props} />
      <label htmlFor={name}>{label}</label>
    </div>
  );
}

function criarFormularioEmpresa(empresa) {
  if (!empresa) {
    return {
      ...estadoInicialFormulario
    };
  }

  return {
    razaoSocial: empresa.razaoSocial || '',
    nomeFantasia: empresa.nomeFantasia || '',
    slogan: empresa.slogan || '',
    tipo: empresa.tipo || 'Pessoa juridica',
    cnpj: formatarDocumentoFiscal(empresa.cnpj || '', empresa.tipo || 'Pessoa juridica'),
    inscricaoEstadual: empresa.inscricaoEstadual || '',
    email: empresa.email || '',
    telefone: empresa.telefone || '',
    horaInicioManha: empresa.horaInicioManha || '08:00',
    horaFimManha: empresa.horaFimManha || '12:00',
    horaInicioTarde: empresa.horaInicioTarde || '13:00',
    horaFimTarde: empresa.horaFimTarde || '18:00',
    trabalhaSabado: Boolean(empresa.trabalhaSabado),
    horaInicioSabado: empresa.horaInicioSabado || '08:00',
    horaFimSabado: empresa.horaFimSabado || '12:00',
    exibirFunilPaginaInicial: empresa.exibirFunilPaginaInicial === undefined
      ? true
      : Boolean(empresa.exibirFunilPaginaInicial),
    diasValidadeOrcamento: String(empresa.diasValidadeOrcamento ?? 7),
    diasEntregaPedido: String(empresa.diasEntregaPedido ?? 7),
    codigoPrincipalCliente: normalizarCodigoPrincipalCliente(empresa.codigoPrincipalCliente),
    etapasFiltroPadraoOrcamento: normalizarListaEmpresa(empresa.etapasFiltroPadraoOrcamento),
    corPrimariaOrcamento: empresa.corPrimariaOrcamento || '#111827',
    corSecundariaOrcamento: empresa.corSecundariaOrcamento || '#ef4444',
    corDestaqueOrcamento: empresa.corDestaqueOrcamento || '#f59e0b',
    destaqueItemOrcamentoPdf: normalizarDestaqueItemOrcamentoPdf(empresa.destaqueItemOrcamentoPdf),
    logradouro: empresa.logradouro || '',
    numero: empresa.numero || '',
    complemento: empresa.complemento || '',
    bairro: empresa.bairro || '',
    cidade: empresa.cidade || '',
    estado: empresa.estado || '',
    cep: empresa.cep || '',
    imagem: empresa.imagem || ''
  };
}

function normalizarDestaqueItemOrcamentoPdf(valor) {
  return String(valor || '').trim() === 'referencia' ? 'referencia' : 'descricao';
}

function normalizarCodigoPrincipalCliente(valor) {
  return String(valor || '').trim() === 'codigoAlternativo' ? 'codigoAlternativo' : 'codigo';
}

function normalizarListaEmpresa(valor) {
  if (Array.isArray(valor)) {
    return valor.map(String);
  }

  if (!valor) {
    return [];
  }

  try {
    const lista = JSON.parse(valor);
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch (_erro) {
    return String(valor)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function obterIniciaisEmpresa(empresa) {
  const nomeBase = empresa.nomeFantasia || empresa.razaoSocial || 'Empresa';

  return nomeBase
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

function formatarDocumentoFiscal(valor, tipo) {
  const digitos = String(valor || '').replace(/\D/g, '');

  if (tipo === 'Pessoa fisica') {
    const cpf = digitos.slice(0, 11);

    return cpf
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  const cnpj = digitos.slice(0, 14);

  return cnpj
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}
