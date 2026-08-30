# MCP Curso 10: Paquete de evidencia final

> Esta edición se tradujo automáticamente a partir de la versión inglesa y superó comprobaciones automatizadas de estructura y terminología técnica. No ha sido objeto de revisión lingüística humana.

Línea base del protocolo: MCP `2026-07-28`<br>
Versión de evaluación del curso: `2026-07-28-v2`<br>
Resumen de evidencia del curso: `2026-08-24`

Esta plantilla admite el seguimiento del constructor (implementar un servidor y un cliente pequeños) o el seguimiento del auditor (reproducir y revisar un servidor público). Completarlo es una autodeclaración, no un certificado verificado de forma independiente. Elimine todos los secretos y datos privados antes de compartirlos.

## 1. Decisión adecuada

- Usuario y trabajo:
- Por qué MCP en lugar de una API directa o una función ordinaria:
- Superficie mínima de capacidad:
- No objetivos explícitos:
- Autoridad presentada:

## 2. Arquitectura y flujo de datos

Adjunte un diagrama que muestre el usuario, modelo, host, un cliente MCP por servidor, servidores, sistemas ascendentes, transportes, credenciales, registros y estado almacenado. Para cada borde, indique qué datos lo cruzan y quién puede conservarlos.

## 3. Manifiesto de versión

| Artículo | Versión exacta o revisión inmutable | Fuente | Fecha verificada |
| --- | --- | --- | --- |
| Protocolo MCP | 2026-07-28 |  |  |
| SDK |  |  |  |
| Servidor |  |  |  |
| Anfitrión/cliente |  |  |  |
| Tiempo de ejecución y archivo de bloqueo |  |  |  |

## 4. Contratos de capacidad

Para cada herramienta, recurso, indicación, obtención y extensión negociada, registre:

- nombre o URI;
- propietario de la interacción;
- esquema de entrada y salida;
- regla de autorización y aprobación;
- comportamiento normal, vacío, no válido, no autorizado, de conflicto, de tiempo de espera y de falla ascendente;
- evidencia devuelta;
- reversión o compensación por escrituras.

## 5. Evidencia protocolaria directa

- `server/discover` request/response con metadatos actuales por solicitud y `resultType`;
- rastros primitivos list/read/get/call;
- trazas de fallos normales y esperados;
- registro de redacción;
- nota para cualquier interfaz de usuario de Legacy Inspector que se conserve solo como evidencia histórica.

## 6. Evidencia de integración del host

- nombre de host y versión exacta;
- transporte configurado e identidad del servidor;
- protocolo y capacidades negociados;
- lista de herramientas efectivas y política de aprobación;
- un flujo de trabajo exitoso de solo lectura;
- un flujo de trabajo denegado o con error esperado.

## 7. Modelo de amenaza y pruebas adversarias.

Ejecute los 12 casos nombrados a continuación. Si una fila combina variantes relacionadas, ejercite cada variante y conserve observaciones separadas en esa fila.

| Caso | Activo o límite | Control forzado | Señal esperada | Resultado observado |
| --- | --- | --- | --- | --- |
| 1 | Inyección inmediata o resultado | Mantenga el contenido devuelto en un canal de datos que no sea de confianza | La inyección no puede cambiar la política de mayor prioridad |  |
| 2 | Anotaciones hostiles o instrucciones ocultas. | Trate las anotaciones como sugerencias; inspeccionar bloques de contenido | Sin autoridad ni elevación de políticas |  |
| 3 | Recorrido del camino | Canonicalizar y restringir rutas permitidas | Ruta fuera de alcance rechazada |  |
| 4 | Contenido de gran tamaño | Aplicar límites de bytes, elementos y contexto | Rechazo acotado o señal de truncamiento seguro |  |
| 5 | Omisión de esquema o campos desconocidos | Validar esquema JSON y rechazar extras | Resultado determinista de parámetros no válidos |  |
| 6 | Audiencia incorrecta o transferencia de token | Validar audiencia; nunca reenviar tokens de cliente en sentido ascendente | Solicitud denegada sin fuga de token |  |
| 7 | Redireccionamiento, SSRF o reenlace de DNS | Listar destinos permitidos y revalidar cada salto | Objetivo interno o no permitido bloqueado |  |
| 8 | Reproducción de control de estado | Utilice identificadores impredecibles y vuelva a autorizar cada solicitud | Reproducción entre usuarios o caducada denegada |  |
| 9 | escritura duplicada | Idempotencia o guardia de revisión exacta | Como máximo un cambio previsto |  |
| 10 | Carrera de cancelación | Cancelación cooperativa más cheque estatal posterior a la cancelación | Sin efectos secundarios tardíos ocultos |  |
| 11 | Compromiso de paquete o punto final | Fijar procedencia inmutable y ruta de desactivación del ejercicio | La integración comprometida puede aislarse |  |
| 12 | Tiempo de espera ascendente | Fecha límite, reintento limitado y mapeo de errores claro | Sin efecto infinito de colgar o duplicar |  |

## 8. Fuentes y cifras

Para cada afirmación fáctica o figura reutilizada, título del registro, editor, URL directa, revisión exacta cuando sea posible, fecha access/observation, nivel de evidencia, base de reutilización y afirmación limitada que respalda.

## 9. Evaluación y limitaciones

Informe la conexión, el descubrimiento, la selección, la validez de los argumentos, la ejecución, la autorización, la denegación del usuario, la cancelación y los resultados de las tareas de un extremo a otro por separado. Muestra del estado, entorno, evidencia faltante y limitaciones conocidas.

## 10. Ejercicio de desactivación y recuperación.

- deshabilitar un servidor o herramienta;
- revocar sus credenciales;
- identificar sus acciones recientes a partir de registros redactados;
- restaurar la configuración en buen estado;
- verificar que el servidor antiguo no pueda actuar;
- tiempo récord, dueño, fallas y seguimiento del trabajo.

## Aprobación del revisor (opcional)

- Crítico:
- Fecha de revisión:
- Pruebas inspeccionadas:
- Ruta segura reproducida:
- Fallos esperados reproducidos:
- Correcciones requeridas:
- Decisión y alcance:
