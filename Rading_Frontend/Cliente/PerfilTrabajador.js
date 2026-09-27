import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import API_URL from '../configS';

/* ==================================================================== */
/*  TOKENS                                                              */
/* ==================================================================== */
const INDIGO = '#3D4EEA';
const INDIGO_DEEP = '#2432B0';
const AMBER = '#F5A623';
const TEAL = '#0EA5A0';
const TEAL_DEEP = '#0B8580';
const WHITE = '#FFFFFF';
const GRAY_SOFT = '#8A90A6';
const CHIP_OFF_BG = '#EDEFF7';
const CHIP_OFF_BORDER = '#DFE3F2';
const TEAL_BG = 'rgba(14,165,160,0.10)';
const TEAL_BORDER = 'rgba(14,165,160,0.25)';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_NOMBRE = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };

/* ------------------------------------------------------------------ */
/*  Helpers (idénticos a los que usa el trabajador para mapear su      */
/*  propio perfil, así el cliente ve exactamente los mismos datos)     */
/* ------------------------------------------------------------------ */

function parsearJson(valor, fallback) {
  if (valor == null) return fallback;
  if (Array.isArray(valor)) return valor;
  try {
    const p = JSON.parse(valor);
    return Array.isArray(p) ? p : fallback;
  } catch {
    return fallback;
  }
}

function parsearLista(valor, separador) {
  if (!valor) return [];
  return String(valor)
    .split(separador)
    .map((x) => x.trim())
    .filter(Boolean);
}

function partirTituloDetalle(item) {
  const idx = item.indexOf(':');
  if (idx === -1) return { titulo: item, detalle: '' };
  return { titulo: item.slice(0, idx).trim(), detalle: item.slice(idx + 1).trim() };
}

const ICONOS_APTITUD = [
  { match: /fuga|ultrason/i, icon: 'search-outline' },
  { match: /termotanque|calefón|caldera|gas/i, icon: 'flame-outline' },
  { match: /griferí|canilla|grifer/i, icon: 'water-outline' },
  { match: /destape|cañer|desagü/i, icon: 'construct-outline' },
  { match: /eléctric|instalaci/i, icon: 'flash-outline' },
];
function iconoParaAptitud(texto) {
  const hit = ICONOS_APTITUD.find((r) => r.match.test(texto));
  return hit ? hit.icon : 'checkmark-circle-outline';
}

const PERFIL_VACIO = {
  categoria: '',
  nombre: '',
  ubicacion: '',
  foto: null,
  portada: null,

  identidadVerificada: false,
  antecedentesVerificados: false,
  matricula: '',
  matriculaVerificada: false,
  seguroVigente: false,

  tiempoRespuesta: '',
  tasaAceptacion: 0,
  añosExperiencia: 0,
  trabajosRealizados: 0,
  calificacion: 0,
  cantidadResenas: 0,

  tarifaDesde: '',

  descripcion: '',

  servicios: [],

  zonaCobertura: [],

  disponibilidad: [],
  horarioAtencion: '',
  atiendeEmergencias: false,

  idiomas: [],
  metodosPago: [],

  educacion: [],
  experiencia: [],
  aptitudes: [],

  portfolio: [],

  resenas: [],
};

function mapearPerfilTrabajador(db) {
  if (!db) return PERFIL_VACIO;
  return {
    ...PERFIL_VACIO,
    categoria: db.categoria ?? '',
    nombre: `${db.nombre ?? ''} ${db.apellido ?? ''}`.trim(),
    ubicacion: db.direccion ?? '',
    foto: db.foto ?? null,
    portada: db.portada ?? null,

    identidadVerificada: db.identidadVerificada ?? false,
    antecedentesVerificados: db.antecedentesVerificados ?? false,
    matricula: db.matricula ?? '',
    matriculaVerificada: db.matriculaVerificada ?? false,
    seguroVigente: db.seguroVigente ?? false,

    tiempoRespuesta: db.tiempoRespuesta ?? '',
    tasaAceptacion: db.tasaAceptacion ?? 0,
    añosExperiencia: db.añosExperiencia ?? 0,
    trabajosRealizados: db.trabajosRealizados ?? 0,
    calificacion: db.estrellas ?? 0,
    cantidadResenas: db.reseñasRec ?? 0,

    tarifaDesde: db.tarifaDesde != null ? String(db.tarifaDesde) : '',

    descripcion: db.descripcion ?? '',

    servicios: (db.servicios ?? []).map((s) => ({
      id: s.id,
      nombre: s.nombre ?? '',
      precio: s.precio != null ? String(s.precio) : '',
    })),

    zonaCobertura: parsearLista(db.zonaTrabajo, ','),

    disponibilidad: parsearJson(db.disponibilidad, []),
    horarioAtencion:
      db.DispComienzo && db.DispFinal ? `${db.DispComienzo} a ${db.DispFinal} hs` : '',
    atiendeEmergencias: db.atiendeEmergencias ?? false,

    idiomas: parsearJson(db.idiomas, []),
    metodosPago: parsearJson(db.metodosPago, []),

    educacion: parsearJson(db.educacion, []),
    experiencia: parsearJson(db.experiencia, []),
    aptitudes: parsearJson(db.aptitudes, []),

    portfolio: parsearJson(db.portfolio, []),

    resenas: (db.resenas ?? []).map((r) => ({
      nombre: `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim(),
      comentario: r.descripcion ?? r.razon ?? '',
      estrellas: r.estrellas ?? 0,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Pantalla principal (solo lectura)                                  */
/* ------------------------------------------------------------------ */

export default function PerfilTrabajador({ route, navigation }) {
  const { idTrabajador } = route.params;
  const { colors, isDark } = useTheme();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);
        const resp = await fetch(`${API_URL}/trabajador/perfil/${idTrabajador}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const db = await resp.json();
        setPerfil(mapearPerfilTrabajador(db));
      } catch (e) {
        setError(e.message || 'No se pudo cargar el perfil');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [idTrabajador]);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !perfil) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorTexto}>{error || 'No se pudo cargar el perfil'}</Text>
        <TouchableOpacity style={styles.reintentarBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.reintentarTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diasTexto = perfil.disponibilidad.length
    ? perfil.disponibilidad.map((d) => DIAS_NOMBRE[d]).join(' · ')
    : 'Sin días cargados';

  /* ---------------- Subcomponentes de solo lectura ---------------- */

  const Estrellas = ({ valor = 0, size = 16 }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= Math.round(valor) ? 'star' : 'star-outline'}
          size={size}
          color={AMBER}
        />
      ))}
    </View>
  );

  const SeccionCard = ({ titulo, subtitulo, children, style }) => (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitulo}>{titulo}</Text>
      {subtitulo ? <Text style={styles.cardSubtitulo}>{subtitulo}</Text> : null}
      {children}
    </View>
  );

  const Chip = ({ label, tono = 'default' }) => {
    const activo = tono === 'teal';
    return (
      <View style={[styles.chip, activo && styles.chipTeal]}>
        <Text style={[styles.chipTexto, activo && styles.chipTextoTeal]}>{label}</Text>
      </View>
    );
  };

  const ConfianzaItem = ({ label, verificado }) => (
    <View style={[styles.confianzaItem, verificado ? styles.confianzaItemOn : styles.confianzaItemOff]}>
      <View style={[styles.confianzaIconWrap, verificado ? styles.confianzaIconOn : styles.confianzaIconOff]}>
        <Ionicons
          name={verificado ? 'shield-checkmark' : 'time-outline'}
          size={15}
          color={verificado ? WHITE : GRAY_SOFT}
        />
      </View>
      <Text style={[styles.confianzaLabel, !verificado && styles.confianzaLabelOff]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );

  const AptitudCard = ({ texto }) => (
    <View style={styles.aptitudCard}>
      <View style={styles.aptitudIconWrap}>
        <Ionicons name={iconoParaAptitud(texto)} size={15} color={INDIGO_DEEP} />
      </View>
      <Text style={styles.aptitudTexto}>{texto}</Text>
    </View>
  );

  const ExperienciaTimeline = ({ items, vacio }) => {
    if (!items || items.length === 0) {
      return <Text style={styles.textoVacio}>{vacio}</Text>;
    }
    return items.map((item, i) => {
      const { titulo, detalle } = partirTituloDetalle(item);
      const esUltimo = i === items.length - 1;
      return (
        <View key={i} style={styles.timelineFila}>
          <View style={styles.timelineRielWrap}>
            <View style={styles.timelineDot}>
              <Ionicons name="briefcase" size={11} color={WHITE} />
            </View>
            {!esUltimo && <View style={styles.timelineLinea} />}
          </View>
          <View style={[styles.timelineContenido, !esUltimo && { marginBottom: 16 }]}>
            <Text style={styles.timelineTitulo}>{titulo}</Text>
            {!!detalle && <Text style={styles.timelineDetalle}>{detalle}</Text>}
          </View>
        </View>
      );
    });
  };

  const EducacionLista = ({ items, vacio }) => {
    if (!items || items.length === 0) {
      return <Text style={styles.textoVacio}>{vacio}</Text>;
    }
    return items.map((item, i) => {
      const { titulo, detalle } = partirTituloDetalle(item);
      const esCertificacion = /certifica|curso|diploma/i.test(item);
      return (
        <View key={i} style={[styles.educacionFila, i === items.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.educacionIconWrap}>
            <Ionicons name="school-outline" size={16} color={INDIGO_DEEP} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.educacionTituloRow}>
              <Text style={styles.educacionTitulo}>{titulo}</Text>
              {esCertificacion && (
                <View style={styles.educacionBadge}>
                  <Text style={styles.educacionBadgeTexto}>Certificación</Text>
                </View>
              )}
            </View>
            {!!detalle && <Text style={styles.educacionDetalle}>{detalle}</Text>}
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Perfil del trabajador</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Portada */}
        {perfil.portada ? (
          <Image source={{ uri: perfil.portada }} style={styles.portadaImg} />
        ) : null}

        {/* Banner principal */}
        <View style={styles.banner}>
          <View style={styles.avatarWrap}>
            {perfil.foto ? (
              <Image source={{ uri: perfil.foto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInicial}>{perfil.nombre.charAt(0)}</Text>
              </View>
            )}
          </View>

          {perfil.categoria ? <Text style={styles.categoriaTexto}>{perfil.categoria}</Text> : null}
          <Text style={styles.nombre}>{perfil.nombre}</Text>

          {perfil.identidadVerificada && (
            <View style={styles.verificadoPill}>
              <Ionicons name="checkmark-circle" size={12} color={TEAL_DEEP} />
              <Text style={styles.verificadoPillTexto}>Identidad verificada</Text>
            </View>
          )}

          {perfil.ubicacion ? (
            <View style={styles.ubicacionRow}>
              <Ionicons name="location-sharp" size={13} color={GRAY_SOFT} />
              <Text style={styles.ubicacionTexto}>{perfil.ubicacion}</Text>
            </View>
          ) : null}

          <View style={styles.ratingRow}>
            <Estrellas valor={perfil.calificacion} size={18} />
            <Text style={styles.ratingTexto}>
              {Number(perfil.calificacion).toFixed(1)} · {perfil.cantidadResenas} reseñas · {perfil.trabajosRealizados} trabajos
            </Text>
          </View>

          {perfil.descripcion ? (
            <Text style={styles.descripcion}>{perfil.descripcion}</Text>
          ) : null}
        </View>

        {/* Métricas */}
        <View style={styles.metricasRow}>
          <View style={styles.metrica}>
            <Text style={styles.metricaValor}>{perfil.añosExperiencia}</Text>
            <Text style={styles.metricaLabel}>Años exp.</Text>
          </View>
          <View style={styles.metricaDivisor} />
          <View style={styles.metrica}>
            <Text style={styles.metricaValor}>{perfil.tasaAceptacion}%</Text>
            <Text style={styles.metricaLabel}>Aceptación</Text>
          </View>
          <View style={styles.metricaDivisor} />
          <View style={styles.metrica}>
            <Text style={styles.metricaValorChico}>{perfil.tiempoRespuesta || '—'}</Text>
            <Text style={styles.metricaLabel}>Respuesta</Text>
          </View>
        </View>

        {/* Tarifa */}
        {perfil.tarifaDesde ? (
          <View style={styles.tarifaCard}>
            <Text style={styles.tarifaLabel}>Tarifa desde</Text>
            <Text style={styles.tarifaValor}>${perfil.tarifaDesde}/h</Text>
          </View>
        ) : null}

        {/* Verificación y confianza */}
        <SeccionCard titulo="Verificación y confianza" subtitulo="Documentación validada por la plataforma">
          <View style={styles.confianzaGrid}>
            <ConfianzaItem label="Identidad verificada" verificado={perfil.identidadVerificada} />
            <ConfianzaItem label="Antecedentes verificados" verificado={perfil.antecedentesVerificados} />
            <ConfianzaItem label="Matrícula profesional" verificado={perfil.matriculaVerificada} />
            <ConfianzaItem label="Seguro de responsabilidad civil" verificado={perfil.seguroVigente} />
          </View>
          <View style={styles.matriculaRow}>
            <Ionicons name="ribbon-outline" size={16} color={INDIGO_DEEP} />
            <Text style={styles.matriculaTexto}>{perfil.matricula || 'Sin matrícula cargada'}</Text>
          </View>
        </SeccionCard>

        {/* Servicios */}
        <SeccionCard titulo="Servicios y precios" subtitulo="Precio de referencia — puede variar según el trabajo">
          {perfil.servicios.length === 0 ? (
            <Text style={styles.textoVacio}>Todavía no cargó servicios.</Text>
          ) : (
            perfil.servicios.map((s, i) => (
              <View key={s.id ?? i} style={[styles.servicioFila, i === perfil.servicios.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.servicioNombre}>{s.nombre}</Text>
                <Text style={styles.servicioPrecio}>{s.precio ? `desde $${s.precio}` : 'Sin precio cargado'}</Text>
              </View>
            ))
          )}
        </SeccionCard>

        {/* Zona de cobertura */}
        <SeccionCard titulo="Zona de cobertura">
          <View style={styles.chipsWrap}>
            {perfil.zonaCobertura.length === 0 ? (
              <Text style={styles.textoVacio}>Sin zona de cobertura cargada.</Text>
            ) : (
              perfil.zonaCobertura.map((z, i) => <Chip key={i} label={z} />)
            )}
          </View>
        </SeccionCard>

        {/* Disponibilidad */}
        <SeccionCard titulo="Disponibilidad">
          <View style={styles.diasRow}>
            {DIAS.map((d, idx) => {
              const activo = perfil.disponibilidad.includes(d);
              return (
                <View key={`${d}-${idx}`} style={[styles.diaChip, activo && styles.diaChipActivo]}>
                  <Text style={[styles.diaChipTexto, activo && styles.diaChipTextoActivo]}>{d}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.diasResumen}>{diasTexto}</Text>
          {perfil.horarioAtencion ? (
            <View style={styles.horarioFila}>
              <Ionicons name="time-outline" size={15} color={GRAY_SOFT} />
              <Text style={styles.horarioTexto}>{perfil.horarioAtencion}</Text>
            </View>
          ) : null}
          {perfil.atiendeEmergencias && (
            <View style={styles.emergenciaFila}>
              <Ionicons name="alert-circle-outline" size={16} color={TEAL_DEEP} />
              <Text style={styles.emergenciaTexto}>Atiende emergencias fuera de horario</Text>
            </View>
          )}
        </SeccionCard>

        {/* Idiomas */}
        <SeccionCard titulo="Idiomas">
          <View style={styles.chipsWrap}>
            {perfil.idiomas.length === 0 ? (
              <Text style={styles.textoVacio}>Sin idiomas cargados.</Text>
            ) : (
              perfil.idiomas.map((idi, i) => <Chip key={i} label={idi} />)
            )}
          </View>
        </SeccionCard>

        {/* Métodos de pago */}
        <SeccionCard titulo="Métodos de pago aceptados">
          <View style={styles.chipsWrap}>
            {perfil.metodosPago.length === 0 ? (
              <Text style={styles.textoVacio}>Sin métodos de pago cargados.</Text>
            ) : (
              perfil.metodosPago.map((m, i) => <Chip key={i} label={m} tono="teal" />)
            )}
          </View>
        </SeccionCard>

        {/* Aptitudes */}
        <SeccionCard titulo="Aptitudes" subtitulo="Habilidades técnicas destacadas">
          {perfil.aptitudes.length === 0 ? (
            <Text style={styles.textoVacio}>Sin aptitudes cargadas.</Text>
          ) : (
            <View style={styles.aptitudesGrid}>
              {perfil.aptitudes.map((a, i) => <AptitudCard key={i} texto={a} />)}
            </View>
          )}
        </SeccionCard>

        {/* Experiencia */}
        <SeccionCard titulo="Experiencia laboral" subtitulo={`${perfil.añosExperiencia} años en el oficio`}>
          <ExperienciaTimeline items={perfil.experiencia} vacio="Sin experiencia cargada." />
        </SeccionCard>

        {/* Educación */}
        <SeccionCard titulo="Educación y certificaciones">
          <EducacionLista items={perfil.educacion} vacio="Sin educación cargada." />
        </SeccionCard>

        {/* Portfolio */}
        <SeccionCard titulo="Trabajos realizados" subtitulo="Fotos de trabajos anteriores">
          {perfil.portfolio.length === 0 ? (
            <Text style={styles.textoVacio}>Todavía no subió fotos de trabajos.</Text>
          ) : (
            <View style={styles.portfolioGrid}>
              {perfil.portfolio.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.portfolioImg} />
              ))}
            </View>
          )}
        </SeccionCard>

        {/* Reseñas */}
        <SeccionCard titulo="Reseñas recientes" style={{ marginBottom: 8 }}>
          {perfil.resenas.length === 0 ? (
            <Text style={styles.textoVacio}>Todavía no tiene reseñas.</Text>
          ) : (
            perfil.resenas.slice(0, 5).map((r, i) => (
              <View key={i} style={[styles.resenaFila, i === perfil.resenas.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.resenaAvatar}>
                  <Text style={styles.resenaAvatarTexto}>{(r.nombre ?? '?').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.resenaTopRow}>
                    <Text style={styles.resenaNombre}>{r.nombre}</Text>
                    <Estrellas valor={r.estrellas} size={12} />
                  </View>
                  <Text style={styles.resenaComentario}>{r.comentario}</Text>
                </View>
              </View>
            ))
          )}
        </SeccionCard>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Estilos                                                            */
/* ------------------------------------------------------------------ */

const createStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  errorTexto: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  reintentarBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  reintentarTexto: { color: WHITE, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: isDark ? '#1a1f3a' : INDIGO,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { color: WHITE, fontSize: 16, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  portadaImg: { width: '100%', height: 132 },

  banner: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 24, borderWidth: 3, borderColor: colors.card },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarInicial: { fontSize: 28, fontWeight: '900', color: colors.primary },
  categoriaTexto: {
    fontSize: 11.5,
    fontWeight: '800',
    color: INDIGO,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  nombre: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 6 },
  verificadoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: TEAL_BG,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  verificadoPillTexto: { fontSize: 10.5, fontWeight: '800', color: TEAL_DEEP },
  ubicacionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ubicacionTexto: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ratingTexto: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  descripcion: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  metricasRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metrica: { flex: 1, alignItems: 'center', gap: 2 },
  metricaValor: { fontSize: 16, fontWeight: '900', color: colors.text },
  metricaValorChico: { fontSize: 12, fontWeight: '800', color: colors.text },
  metricaLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '700' },
  metricaDivisor: { width: 1, height: 30, backgroundColor: colors.divider },

  tarifaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tarifaLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  tarifaValor: { fontSize: 18, fontWeight: '900', color: colors.primary },

  card: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitulo: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardSubtitulo: { fontSize: 11.5, color: colors.textTertiary, fontWeight: '600', marginBottom: 10 },

  servicioFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  servicioNombre: { fontSize: 13, color: colors.text, fontWeight: '600' },
  servicioPrecio: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  vacioTexto: { fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' },
  textoVacio: { fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' },

  /* Verificación y confianza */
  confianzaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 12 },
  confianzaItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  confianzaItemOn: { backgroundColor: TEAL_BG, borderColor: TEAL_BORDER },
  confianzaItemOff: { backgroundColor: CHIP_OFF_BG, borderColor: CHIP_OFF_BORDER },
  confianzaIconWrap: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  confianzaIconOn: { backgroundColor: TEAL },
  confianzaIconOff: { backgroundColor: '#DCDFEB' },
  confianzaLabel: { flex: 1, fontSize: 11.5, fontWeight: '700', color: colors.text, lineHeight: 15 },
  confianzaLabelOff: { color: colors.textTertiary },
  matriculaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
  },
  matriculaTexto: { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: '600', lineHeight: 16 },

  /* Chips */
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
  },
  chipTeal: { backgroundColor: TEAL_BG, borderColor: TEAL_BORDER },
  chipTexto: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextoTeal: { color: TEAL_DEEP },

  /* Disponibilidad */
  diasRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  diaChip: {
    width: 34, height: 34,
    borderRadius: 10,
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaChipActivo: { backgroundColor: INDIGO, borderColor: INDIGO },
  diaChipTexto: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  diaChipTextoActivo: { color: WHITE },
  diasResumen: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  horarioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
  },
  horarioTexto: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  emergenciaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL_BG,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  emergenciaTexto: { fontSize: 12.5, fontWeight: '700', color: TEAL_DEEP, flex: 1 },

  /* Aptitudes */
  aptitudesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aptitudCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aptitudIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(61,78,234,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptitudTexto: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text, lineHeight: 15 },

  /* Experiencia */
  timelineFila: { flexDirection: 'row', gap: 12 },
  timelineRielWrap: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLinea: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  timelineContenido: { flex: 1, paddingBottom: 0 },
  timelineTitulo: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  timelineDetalle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },

  /* Educación */
  educacionFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  educacionIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(61,78,234,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  educacionTituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  educacionTitulo: { fontSize: 13.5, fontWeight: '700', color: colors.text, flex: 1 },
  educacionBadge: {
    backgroundColor: TEAL_BG,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  educacionBadgeTexto: { fontSize: 9.5, fontWeight: '700', color: TEAL_DEEP },
  educacionDetalle: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  /* Portfolio */
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  portfolioImg: { width: 100, height: 100, borderRadius: 14 },

  /* Reseñas */
  resenaFila: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  resenaAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resenaAvatarTexto: { color: WHITE, fontWeight: '800', fontSize: 12 },
  resenaTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  resenaNombre: { fontSize: 12, fontWeight: '700', color: colors.text },
  resenaComentario: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
});