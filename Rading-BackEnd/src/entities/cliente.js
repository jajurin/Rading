import Usuario from "./usuario.js";

class Cliente extends Usuario {
  estrellas;
  preferencias;
  IdPersona;      // FK hacia Usuario
  reseñasEnv;
  reseñasRec;

  constructor(
    nombre, apellido, email, direccion, contrasena,
    telefono, fechaNac, dni, IdCuentaBancaria,
    preferencias
  ) {
    super(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria);
    this.preferencias = preferencias;
    this.estrellas = 0;        // empieza en 0 al registrar
    this.reseñasEnv = null;
    this.reseñasRec = null;
  }
}

export default Cliente;