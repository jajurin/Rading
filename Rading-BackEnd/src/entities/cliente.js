import Usuario from "./usuario.js";

class Cliente extends Usuario {
  estrellas;
  categoriaId;
  reseñasEnv;
  reseñasRec;

  constructor(
    nombre, apellido, email, direccion, contrasena,
    telefono, fechaNac, dni, IdCuentaBancaria,
    categoriaId
  ) {
    super(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria);
    this.categoriaId = categoriaId ?? null;
    this.estrellas = 1;
    this.reseñasEnv = null;
    this.reseñasRec = null;
  }
}

export default Cliente;