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
 
  constructor(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria = null) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.direccion = direccion;
    this.contrasena = contrasena;
    this.telefono = telefono;
    this.fechaNac = fechaNac;
    this.dni = dni;
    this.IdCuentaBancaria = IdCuentaBancaria;
  }
}
 
export default Usuario;