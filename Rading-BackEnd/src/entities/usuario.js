class Usuario {
  id;
  nombre;
  apellido;
  email;
  direccion;
  contrasena;
  telefono;
  fechaNac;
  dni;
  IdCuentaBancaria; // FK a CuentaBancaria (según el diagrama)
  lat;
  lng;

  constructor(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria = null, lat = null, lng = null) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.direccion = direccion;
    this.contrasena = contrasena;
    this.telefono = telefono;
    this.fechaNac = fechaNac;
    this.dni = dni;
    this.IdCuentaBancaria = IdCuentaBancaria;
    this.lat = lat;
    this.lng = lng;
  }
}

export default Usuario;