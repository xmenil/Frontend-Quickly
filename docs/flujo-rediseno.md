# Flujo de rediseño por módulo — KIPU'S ERP

Plantilla para rediseñar cualquier pantalla con la skill `kipus-ui` y el agente `ui-reviewer`.
Se usa una conversación nueva de Claude Code por módulo. Reemplaza lo que está entre [corchetes].

Módulos sugeridos, en este orden: Login, Nueva venta, Caja, Inventario y Kardex, Dashboard, y al final configuración, usuarios y reportes.

---

## Antes de empezar (una sola vez por proyecto)

- [ ] `.claude/skills/kipus-ui/SKILL.md` está en la raíz del repo.
- [ ] `.claude/agents/ui-reviewer.md` está en la raíz del repo.
- [ ] Los tokens de `kipus-tokens.css` están en `global.css` y `tailwind.config.ts`.
- [ ] Inter está instalada en local (`npm i @fontsource-variable/inter`) e importada en `main.tsx`.
- [ ] Hay un commit limpio de git antes de empezar (para poder volver atrás).

---

## Paso 1 — Diagnóstico (sin modificar archivos)

```
Vamos a rediseñar el módulo [MÓDULO] de KIPU'S ERP. Usa la skill kipus-ui.

Primero solo diagnostica, sin modificar archivos:
1. Ubica los archivos del módulo (páginas, componentes, hooks de UI y gráficos).
2. Usa el agente ui-reviewer para auditarlos.
3. Entrégame su informe y dime qué cambiarías primero.
```

Qué revisar tú: que el informe tenga archivos y líneas reales, y que los críticos tengan sentido.

---

## Paso 2 — Plan del rediseño (sin código)

```
Según el informe, propón el rediseño de [MÓDULO] siguiendo quickly-ui.
Quiero ver antes de programar:
- Quién usa esta pantalla ([cajero / administrador / almacenero]) y cuál es su tarea principal.
- La acción primaria única y el orden de lectura (qué se ve primero, segundo y tercero).
- La composición de la pantalla en escritorio y en móvil.
- Qué se queda, qué se quita y por qué.
- Los estados de carga, vacío, error y éxito de cada bloque.
- Los textos nuevos (títulos, botones, mensajes de error y de estado vacío) en español peruano.
No cambies la lógica de datos, los tipos ni las llamadas a la API: solo la interfaz.
```

Qué revisar tú: corrige el plan con tus ideas antes de aprobar. Este paso es el que más evita un resultado genérico.

Datos que conviene dar en este paso, según el módulo:
- Dashboard: qué números necesita ver el administrador al abrir el sistema.
- Nueva venta: si usa lector de código de barras, qué comprobantes emite (boleta, factura) y qué medios de pago acepta.
- Caja: cómo es su apertura, cierre y arqueo hoy.
- Inventario y kardex: umbral de stock bajo y si maneja varias unidades por producto.

---

## Paso 3 — Construcción por bloques

```
Aprobado. Implementa el rediseño de [MÓDULO] por bloques, empezando por [bloque 1].
Reglas:
- Usa solo los tokens y componentes existentes de components/ui.
- No cambies tipos, servicios, rutas ni lógica de negocio.
- Respeta kipus-ui (sin degradados, sin valores arbitrarios, montos con tabular-nums, estados completos).
Al terminar cada bloque, avísame y espera mi revisión antes de seguir con el siguiente.
```

Bloques típicos: encabezado y acciones, resumen o KPIs, tabla o gráfico principal, listas secundarias, estados vacío y error.

---

## Paso 4 — Verificación con el agente

```
Ejecuta el agente ui-reviewer sobre [MÓDULO] ya rediseñado.
Corrige todos los hallazgos críticos e importantes y vuelve a ejecutarlo hasta que no quede ninguno.
Después corre npx tsc --noEmit, npm run lint y npm run build, y dime si todo pasa.
Lista por separado los hallazgos menores que decidiste no corregir y por qué.
```

Si algún comando falla, pega el error en el chat y pide la corrección antes de seguir.

---

## Paso 5 — Revisión visual tuya

Abre el módulo en el navegador, toma captura en escritorio y en celular, y envíalas:

```
[captura escritorio] [captura móvil]
Veo estos problemas: [describe: espacio entre bloques, gráfico muy alto, texto pequeño, etc.].
Ajusta eso manteniendo kipus-ui y vuelve a pasar el ui-reviewer.
```

Checklist rápido para mirar la pantalla tú mismo:
- [ ] Se entiende en 3 segundos qué hacer en esta pantalla.
- [ ] Hay una sola acción primaria visible.
- [ ] Los números están alineados a la derecha y se leen sin esfuerzo.
- [ ] Los estados (cargando, vacío, error) se ven bien: pruébalos desconectando el backend o filtrando sin resultados.
- [ ] En el celular no hay scroll horizontal y los botones se alcanzan con el pulgar.
- [ ] Se ve sobrio, sin adornos que no ayuden a trabajar.

---

## Cierre del módulo

```
Resume en 5 líneas qué cambió en [MÓDULO]: archivos modificados, decisiones de diseño importantes y cualquier regla de kipus-ui que se haya excepcionado con su razón.
```

Después: haz commit con un mensaje claro (por ejemplo `rediseño UI del módulo Dashboard según kipus-ui`), abre una conversación nueva y repite el flujo con el siguiente módulo.

---

## Si algo no sale como esperas

- **Claude no parece usar la skill:** empieza el mensaje con `/kipus-ui` o escribe "usa la skill kipus-ui".
- **Claude no llama al agente:** escribe "usa el agente ui-reviewer" y el nombre del módulo.
- **El rediseño tocó lógica de negocio:** pide "revierte los cambios en [archivo] y deja solo cambios de interfaz". Por eso conviene el commit limpio previo.
- **El resultado quedó genérico:** vuelve al Paso 2 y dale más contexto real (qué hace el usuario, qué decide con esos datos).
- **La conversación se hizo larga y empieza a olvidar reglas:** abre una nueva, pega el informe final del agente y continúa desde ahí.