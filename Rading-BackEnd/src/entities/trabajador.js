import Usuario from "./usuario.js";

class Trabajador extends Usuario {
  IdPersona;      // FK hacia Usuario
  categoria;
  descripcion;
  zonaTrabajo;
  DispComienzo;
  DispFinal;
  foto;
  estrellas;
  reseñasEnv;
  reseñasRec;

  constructor(
    nombre, apellido, email, direccion, contrasena,
    telefono, fechaNac, dni, IdCuentaBancaria,
    categoria, descripcion, zonaTrabajo, DispComienzo, DispFinal, foto
  ) {
    super(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria);
    this.categoria = categoria;
    this.descripcion = descripcion;
    this.zonaTrabajo = zonaTrabajo;
    this.DispComienzo = DispComienzo;
    this.DispFinal = DispFinal;
    this.foto = foto;
    this.estrellas = 0;        // empieza en 0 al registrar
    this.reseñasEnv = null;
    this.reseñasRec = null;
  }
}

export default Trabajador;
