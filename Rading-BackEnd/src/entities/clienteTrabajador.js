class  ClienteTrabajador {
  id;
  distancia;
  horario;
  categoria;
  fijo;
  IdCliente;
  IdTrabajador;
  estado;
  fecha_acabado;
  fehca_iniciado;

  constructor(distancia, horario, categoria, fijo, IdCliente, IdTrabajador, estado, fecha_acabado, fehca_iniciado) {
    this.distancia = distancia;
    this.horario = horario;
    this.categoria = categoria;
    this.fijo = fijo;
    this.IdCliente = IdCliente;
    this.IdTrabajador = IdTrabajador;
    this.estado = estado;
    this.fecha_acabado = fecha_acabado;
    this.fehca_iniciado = fehca_iniciado;
  }
}

export default ClienteTrabajador;