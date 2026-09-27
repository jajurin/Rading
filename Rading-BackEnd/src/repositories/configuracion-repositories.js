import config from "../configs/dbconfig.js";
import pkg from "pg";
const { Client } = pkg;

// Mapea el nombre camelCase (como lo usa el front) a la columna real
// en minúsculas de la tabla configuracionusuario.
const COLUMN_MAP = {
  modoOscuro: "modooscuro",
  notifOfertas: "notifofertas",
  notifMensajes: "notifmensajes",
  notifResenas: "notifresenas",
  notifSonido: "notifsonido",
  notifVibracion: "notifvibracion",
  ubicacionHabilitada: "ubicacionhabilitada",
  datosUso: "datosuso",
};

// SELECT con alias para que el resultado siempre venga en camelCase.
const SELECT_CAMEL = `
  SELECT
    idusuario AS "idUsuario",
    modooscuro AS "modoOscuro",
    notifofertas AS "notifOfertas",
    notifmensajes AS "notifMensajes",
    notifresenas AS "notifResenas",
    notifsonido AS "notifSonido",
    notifvibracion AS "notifVibracion",
    ubicacionhabilitada AS "ubicacionHabilitada",
    datosuso AS "datosUso"
  FROM configuracionusuario
`;

export class ConfiguracionRepository {
  obtenerPorUsuario = async (idUsuario) => {
    const client = new Client(config);
    try {
      await client.connect();
      const sql = `${SELECT_CAMEL} WHERE idusuario = $1`;
      const result = await client.query(sql, [idUsuario]);
      return result.rows[0] || null;
    } catch (err) {
      console.error("Error en obtenerPorUsuario:", err);
      throw err;
    } finally {
      await client.end();
    }
  };

  crear = async (idUsuario) => {
    const client = new Client(config);
    try {
      await client.connect();
      // Insertamos y devolvemos ya con alias camelCase.
      const sql = `
        WITH nueva AS (
          INSERT INTO configuracionusuario (idusuario)
          VALUES ($1)
          RETURNING *
        )
        SELECT
          idusuario AS "idUsuario",
          modooscuro AS "modoOscuro",
          notifofertas AS "notifOfertas",
          notifmensajes AS "notifMensajes",
          notifresenas AS "notifResenas",
          notifsonido AS "notifSonido",
          notifvibracion AS "notifVibracion",
          ubicacionhabilitada AS "ubicacionHabilitada",
          datosuso AS "datosUso"
        FROM nueva
      `;
      const result = await client.query(sql, [idUsuario]);
      return result.rows[0];
    } catch (err) {
      console.error("Error en crear:", err);
      throw err;
    } finally {
      await client.end();
    }
  };

  // Actualiza SOLO las columnas presentes en `prefs` (camelCase),
  // traduciéndolas a las columnas reales en minúsculas.
  actualizar = async (idUsuario, prefs) => {
    const client = new Client(config);
    try {
      await client.connect();

      const sets = [];
      const values = [idUsuario];
      let i = 1;

      for (const [camelKey, dbCol] of Object.entries(COLUMN_MAP)) {
        if (prefs[camelKey] !== undefined) {
          i++;
          sets.push(`${dbCol} = $${i}`);
          values.push(prefs[camelKey]);
        }
      }

      if (sets.length === 0) {
        return await this.obtenerPorUsuario(idUsuario);
      }

      const sql = `
        WITH actualizada AS (
          UPDATE configuracionusuario
          SET ${sets.join(", ")}, updated_at = now()
          WHERE idusuario = $1
          RETURNING *
        )
        SELECT
          idusuario AS "idUsuario",
          modooscuro AS "modoOscuro",
          notifofertas AS "notifOfertas",
          notifmensajes AS "notifMensajes",
          notifresenas AS "notifResenas",
          notifsonido AS "notifSonido",
          notifvibracion AS "notifVibracion",
          ubicacionhabilitada AS "ubicacionHabilitada",
          datosuso AS "datosUso"
        FROM actualizada
      `;

      const result = await client.query(sql, values);
      return result.rows[0] || null;
    } catch (err) {
      console.error("Error en actualizar:", err);
      throw err;
    } finally {
      await client.end();
    }
  };
}