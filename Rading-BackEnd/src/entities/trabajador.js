import Usuario from "./usuario.js";

class Trabajador extends Usuario {
  constructor(
    nombre, apellido, email, direccion, contrasena,
    telefono, fechaNac, dni, IdCuentaBancaria,
    servicios, descripcion, zonaTrabajo, DispComienzo, DispFinal, foto
  ) {
    super(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria);
    this.servicios = servicios; // array de ids
    this.descripcion = descripcion;
    this.zonaTrabajo = zonaTrabajo;
    this.DispComienzo = DispComienzo;
    this.DispFinal = DispFinal;
    this.foto = foto ?? null;
    this.estrellas = 1;
  }
}

export default Trabajador;