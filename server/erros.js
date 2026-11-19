// Erro com status HTTP, usado para responder de forma consistente.
export class ErroHttp extends Error {
  constructor(status, codigo, mensagem, detalhes, headers) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
    this.headers = headers;
  }
}
