# Yayen

Yayen es el asistente visual del panel HomeLab JMTS. Este repositorio reúne su implementación actual, estilos, documentación y capturas de referencia para que se pueda diseñar y evolucionar de forma independiente.

## Contenido

- `src/yayen.js`: componente de interfaz integrado con el objeto global `Dash` del panel.
- `src/yayen.css`: estilos de Yayen extraídos del tema del panel; algunos tokens visuales (`--card`, `--sans`, `--text`, `--soft`, `--accent`) los aporta la aplicación anfitriona.
- `docs/YAYEN.md`: interacciones, configuración local prevista y siguientes pasos.
- `docs/capturas/`: referencias reales del panel a 1280×400.

## Interacciones actuales

- Un toque abre el menú y otro lo cierra.
- Las opciones consultan el estado local del panel y pueden navegar a una pestaña.
- Una pulsación larga avisa que Hermes todavía no está conectado; no activa el micrófono.
- El modo ligero se activa en dispositivos con poca memoria o pocos núcleos.
- «Grabar» activa el modo de privacidad del panel.

Yayen no es todavía una aplicación independiente: requiere el contrato `Dash` del panel. Las opciones de Hermes, reconocimiento de voz y voz local están documentadas como trabajo futuro.

## Seguridad

No guardar aquí tokens, claves, archivos `.env` ni `secrets.env`. Los valores reales viven en el servidor local y se inyectan desde su configuración protegida.
