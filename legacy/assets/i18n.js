/* aicourse.top — internationalisation
 * ---------------------------------------------------------------------------
 * One dictionary, nine languages, no dependencies and no build step.
 *
 * Usage in markup:
 *     <span data-i18n="nav.home"></span>          → textContent
 *     <input data-i18n-ph="key.placeholder">      → placeholder
 *     <a data-i18n-aria="key.label">              → aria-label
 *     <div data-i18n-html="key.rich"></div>       → innerHTML (trusted strings only)
 *
 * Then call I18N.apply(). Switching language re-applies and rewrites
 * <html lang> and <html dir>, so Arabic flips the whole layout to RTL.
 *
 * A key with no translation falls back to English rather than rendering
 * blank — a half-translated page is usable, an empty one is not.
 */
(function (global) {
  "use strict";

  var LANGS = [
    { code: "en",      name: "English",    native: "English",  dir: "ltr", flag: "🇬🇧" },
    { code: "es",      name: "Spanish",    native: "Español",  dir: "ltr", flag: "🇪🇸" },
    { code: "fr",      name: "French",     native: "Français", dir: "ltr", flag: "🇫🇷" },
    { code: "de",      name: "German",     native: "Deutsch",  dir: "ltr", flag: "🇩🇪" },
    { code: "zh-Hans", name: "Chinese (Simplified)",  native: "简体中文", dir: "ltr", flag: "🇨🇳" },
    { code: "zh-Hant", name: "Chinese (Traditional)", native: "繁體中文", dir: "ltr", flag: "🇭🇰" },
    { code: "ja",      name: "Japanese",   native: "日本語",   dir: "ltr", flag: "🇯🇵" },
    { code: "ko",      name: "Korean",     native: "한국어",   dir: "ltr", flag: "🇰🇷" },
    { code: "ar",      name: "Arabic",     native: "العربية",  dir: "rtl", flag: "🇸🇦" }
  ];

  var T = {};

  /* ======================= ENGLISH (the source) ======================= */
  T.en = {
    "brand.name": "aicourse.top",
    "brand.tag": "Top AI course",
    "brand.sub": "Learn to build with AI, from first principles",

    "nav.home": "Home",
    "nav.handbook": "Handbook",
    "nav.lab": "Lab",
    "nav.course": "Python course",
    "nav.teach": "For teachers",
    "nav.lang": "Language",
    "nav.theme": "Theme",
    "nav.menu": "Menu",

    "home.kicker": "A free, open course in agentic engineering",
    "home.h1": "Every program is a list of steps.",
    "home.h1b": "The only question is who picks them.",
    "home.lede": "A complete course on building systems that use AI — written for people who are new to software engineering. Three parts, about four hours, and you finish having built a working agent with an eval suite that scores it.",
    "home.cta": "Start learning — free",
    "home.cta2": "Browse the curriculum",
    "home.free": "No account. No tracking. MIT licensed.",

    "home.pathTitle": "Your learning path",
    "home.pathLede": "Each part asks a little more of you than the last. Start at the top.",

    "track.1.tag": "Part 1 · Read",
    "track.1.title": "The Handbook",
    "track.1.desc": "Eleven illustrated sections on who decides the next step at run time — writing code, prompts, context, loops, graphs, harnesses, evaluation and security. Twenty diagrams you can click through.",
    "track.1.meta": "45 minutes · nothing to install",
    "track.1.cta": "Read the handbook",

    "track.2.tag": "Part 2 · Practise",
    "track.2.title": "The Lab",
    "track.2.desc": "Four hands-on stages in this browser. Make a real model call, extend a rule-based till until it breaks, write your own prompt, then score it against twenty real cases and watch the number move.",
    "track.2.meta": "40 minutes · your own API key · about 1¢",
    "track.2.cta": "Open the lab",

    "track.3.tag": "Part 3 · Build",
    "track.3.title": "The Python Course",
    "track.3.desc": "Five more stages, on your own machine. The agent loop written by hand, tools that fail on purpose, a permission gate, a reviewer that cannot be skipped, and an email that tries to give your agent orders.",
    "track.3.meta": "2–3 hours · Python · about 2¢",
    "track.3.cta": "Open the course",

    "home.learnTitle": "What you will be able to do",
    "home.learn1": "Tell which problems need a model and which do not",
    "home.learn1d": "The most valuable judgement in the field, and the cheapest to get wrong.",
    "home.learn2": "Write a prompt and prove it works",
    "home.learn2d": "Not by reading its answers — by scoring it against cases and watching a number.",
    "home.learn3": "Build an agent loop that survives failure",
    "home.learn3d": "Tools break. The loop has to read the error and adapt, not crash.",
    "home.learn4": "Put a fence around what a model can do",
    "home.learn4d": "Permission gates, mandatory review steps, and limits enforced in code.",

    "home.forTitle": "Who this is for",
    "home.for1": "Complete beginners",
    "home.for1d": "Parts 1 and 2 assume no programming at all.",
    "home.for2": "Students and self-learners",
    "home.for2d": "A full curriculum you can finish in an afternoon.",
    "home.for3": "Teachers",
    "home.for3d": "A 90-minute lesson plan, free to reuse and translate.",

    "home.progTitle": "Where you are",
    "home.progNone": "Nothing yet. Your progress is saved in this browser only — no account, nothing sent anywhere.",
    "home.progReset": "Reset progress",

    "home.faqTitle": "Common questions",
    "home.q1": "Is it really free?",
    "home.a1": "Yes. The whole course is MIT licensed and there is no account, no email capture and no tracking of any kind. Parts 2 and 3 call a model, so you bring your own API key — the entire course costs a few cents of tokens.",
    "home.q2": "Do I need to know how to program?",
    "home.a2": "Not for Parts 1 and 2. Part 3 assumes you can read and write basic Python — functions, dictionaries, a for loop. If you cannot yet, do Parts 1 and 2 and come back.",
    "home.q3": "Which AI model does it use?",
    "home.a3": "DeepSeek or Anthropic's Claude, your choice. The code is written so that not one line of any exercise changes between them, which is itself one of the lessons.",
    "home.q4": "Is my API key safe?",
    "home.a4": "Your key is held in the browser tab only and is erased when you close it. It is sent to the model provider and nowhere else. This site has no server, so there is nowhere for it to go.",

    "foot.built": "Built by",
    "foot.source": "Source on GitHub",
    "foot.licence": "MIT licensed — use it, fork it, translate it, teach with it.",
    "foot.disclaim": "Not affiliated with any AI provider. All model behaviour shown is as of the model you run it on.",
    "foot.translate": "Help translate",

    "ui.back": "Back",
    "ui.next": "Next",
    "ui.start": "Start",
    "ui.run": "Run",
    "ui.retry": "Try again",
    "ui.loading": "Working…",
    "ui.done": "Done",
    "ui.locked": "Locked",
    "ui.optional": "Optional",
    "ui.minutes": "min",
    "ui.of": "of",
    "ui.close": "Close",

    "lab.title": "The Lab",
    "lab.sub": "Four stages, in this browser",
    "lab.keyTitle": "Your API key",
    "lab.keySet": "saved for this tab",
    "lab.keyNone": "not set",
    "lab.keySave": "Save",
    "lab.keyReplace": "Replace",
    "lab.keyForget": "Forget",
    "lab.keyNote": "Held in this browser tab only and erased when you close it. Sent to the model provider and nowhere else — this site has no server and no analytics.",
    "lab.noCalls": "no calls yet",

    "hb.start": "Start here",
    "hb.code": "Writing code",
    "hb.prompt": "Prompt engineering",
    "hb.context": "Context engineering",
    "hb.loop": "Loop engineering",
    "hb.graph": "Graph engineering",
    "hb.harness": "Harness engineering",
    "hb.evals": "Evaluation engineering",
    "hb.security": "Security engineering",
    "hb.compare": "Which one, when",
    "hb.play": "Play the game",
    "note.englishOnly": "The teaching text in this section is currently English only. The interface is translated into nine languages; translating the long-form articles is the next job, and contributions are very welcome.",
    "note.langHelp": "Spotted a bad translation? Corrections are welcome — every string lives in one file."
  };

  /* ============================= ESPAÑOL ============================= */
  T.es = {
    "brand.tag": "El mejor curso de IA",
    "brand.sub": "Aprende a construir con IA, desde los fundamentos",
    "nav.home": "Inicio", "nav.handbook": "Manual", "nav.lab": "Laboratorio",
    "nav.course": "Curso de Python", "nav.teach": "Para docentes",
    "nav.lang": "Idioma", "nav.theme": "Tema", "nav.menu": "Menú",
    "home.kicker": "Un curso libre y gratuito de ingeniería de agentes",
    "home.h1": "Todo programa es una lista de pasos.",
    "home.h1b": "La única pregunta es quién los elige.",
    "home.lede": "Un curso completo sobre cómo construir sistemas que usan IA, escrito para quienes empiezan en programación. Tres partes, unas cuatro horas, y terminas habiendo construido un agente que funciona y un conjunto de pruebas que lo puntúa.",
    "home.cta": "Empezar — gratis",
    "home.cta2": "Ver el temario",
    "home.free": "Sin cuenta. Sin rastreo. Licencia MIT.",
    "home.pathTitle": "Tu itinerario",
    "home.pathLede": "Cada parte te pide un poco más que la anterior. Empieza por arriba.",
    "track.1.tag": "Parte 1 · Leer", "track.1.title": "El Manual",
    "track.1.desc": "Once secciones ilustradas sobre quién decide el siguiente paso en tiempo de ejecución: escribir código, prompts, contexto, bucles, grafos, arneses, evaluación y seguridad. Veinte diagramas interactivos.",
    "track.1.meta": "45 minutos · sin instalar nada", "track.1.cta": "Leer el manual",
    "track.2.tag": "Parte 2 · Practicar", "track.2.title": "El Laboratorio",
    "track.2.desc": "Cuatro etapas prácticas en este navegador. Haz una llamada real a un modelo, amplía una caja registradora basada en reglas hasta que falle, escribe tu propio prompt y puntúalo contra veinte casos reales.",
    "track.2.meta": "40 minutos · tu propia clave API · alrededor de 1¢", "track.2.cta": "Abrir el laboratorio",
    "track.3.tag": "Parte 3 · Construir", "track.3.title": "El Curso de Python",
    "track.3.desc": "Cinco etapas más, en tu propia máquina. El bucle del agente escrito a mano, herramientas que fallan a propósito, una barrera de permisos, un revisor que no se puede saltar, y un correo que intenta dar órdenes a tu agente.",
    "track.3.meta": "2–3 horas · Python · alrededor de 2¢", "track.3.cta": "Abrir el curso",
    "home.learnTitle": "Lo que sabrás hacer",
    "home.learn1": "Distinguir qué problemas necesitan un modelo y cuáles no",
    "home.learn1d": "El criterio más valioso del campo, y el más barato de equivocar.",
    "home.learn2": "Escribir un prompt y demostrar que funciona",
    "home.learn2d": "No leyendo sus respuestas, sino puntuándolo contra casos y viendo mover un número.",
    "home.learn3": "Construir un bucle de agente que sobreviva a los fallos",
    "home.learn3d": "Las herramientas se rompen. El bucle debe leer el error y adaptarse, no caerse.",
    "home.learn4": "Poner una valla alrededor de lo que un modelo puede hacer",
    "home.learn4d": "Barreras de permisos, revisiones obligatorias y límites impuestos en el código.",
    "home.forTitle": "Para quién es", "home.for1": "Principiantes absolutos",
    "home.for1d": "Las partes 1 y 2 no presuponen nada de programación.",
    "home.for2": "Estudiantes y autodidactas", "home.for2d": "Un temario completo que cabe en una tarde.",
    "home.for3": "Docentes", "home.for3d": "Un plan de clase de 90 minutos, libre para reutilizar y traducir.",
    "home.progTitle": "Dónde estás",
    "home.progNone": "Nada todavía. Tu progreso se guarda solo en este navegador: sin cuenta y sin enviar nada a ningún sitio.",
    "home.progReset": "Reiniciar progreso",
    "home.faqTitle": "Preguntas frecuentes",
    "home.q1": "¿De verdad es gratis?",
    "home.a1": "Sí. Todo el curso tiene licencia MIT y no hay cuenta, ni captura de correo, ni rastreo de ningún tipo. Las partes 2 y 3 llaman a un modelo, así que traes tu propia clave API: el curso entero cuesta unos céntimos en tokens.",
    "home.q2": "¿Necesito saber programar?",
    "home.a2": "No para las partes 1 y 2. La parte 3 presupone que sabes leer y escribir Python básico: funciones, diccionarios, un bucle for. Si aún no, haz las partes 1 y 2 y vuelve.",
    "home.q3": "¿Qué modelo de IA usa?",
    "home.a3": "DeepSeek o Claude de Anthropic, tú eliges. El código está escrito para que ni una línea de los ejercicios cambie entre ellos, lo cual es en sí mismo una de las lecciones.",
    "home.q4": "¿Está segura mi clave API?",
    "home.a4": "Tu clave se guarda solo en la pestaña del navegador y se borra al cerrarla. Se envía al proveedor del modelo y a ningún otro sitio. Este sitio no tiene servidor, así que no hay adónde enviarla.",
    "foot.built": "Creado por", "foot.source": "Código en GitHub",
    "foot.licence": "Licencia MIT: úsalo, bifúrcalo, tradúcelo, enseña con él.",
    "foot.disclaim": "Sin afiliación con ningún proveedor de IA. El comportamiento mostrado corresponde al modelo con el que lo ejecutes.",
    "foot.translate": "Ayuda a traducir",
    "ui.back": "Atrás", "ui.next": "Siguiente", "ui.start": "Empezar", "ui.run": "Ejecutar",
    "ui.retry": "Reintentar", "ui.loading": "Trabajando…", "ui.done": "Hecho",
    "ui.locked": "Bloqueado", "ui.optional": "Opcional", "ui.minutes": "min",
    "ui.of": "de", "ui.close": "Cerrar",
    "lab.title": "El Laboratorio", "lab.sub": "Cuatro etapas, en este navegador",
    "lab.keyTitle": "Tu clave API", "lab.keySet": "guardada en esta pestaña", "lab.keyNone": "sin configurar",
    "lab.keySave": "Guardar", "lab.keyReplace": "Reemplazar", "lab.keyForget": "Olvidar",
    "lab.keyNote": "Guardada solo en esta pestaña y borrada al cerrarla. Se envía al proveedor del modelo y a ningún otro sitio: este sitio no tiene servidor ni analíticas.",
    "lab.noCalls": "sin llamadas todavía",
    "hb.start": "Empieza aquí",
    "hb.code": "Escribir código",
    "hb.prompt": "Ingeniería de prompts",
    "hb.context": "Ingeniería de contexto",
    "hb.loop": "Ingeniería de bucles",
    "hb.graph": "Ingeniería de grafos",
    "hb.harness": "Ingeniería del arnés",
    "hb.evals": "Ingeniería de evaluación",
    "hb.security": "Ingeniería de seguridad",
    "hb.compare": "Cuál y cuándo",
    "hb.play": "Juega",
    "note.englishOnly": "El texto didáctico de esta sección está por ahora solo en inglés. La interfaz está traducida a nueve idiomas; traducir los artículos largos es la siguiente tarea y se agradecen las contribuciones.",
    "note.langHelp": "¿Has visto una traducción mala? Las correcciones son bienvenidas: todas las cadenas están en un solo archivo."
  };

  /* ============================= FRANÇAIS ============================= */
  T.fr = {
    "brand.tag": "Le meilleur cours d'IA",
    "brand.sub": "Apprendre à construire avec l'IA, depuis les fondements",
    "nav.home": "Accueil", "nav.handbook": "Manuel", "nav.lab": "Atelier",
    "nav.course": "Cours Python", "nav.teach": "Pour les enseignants",
    "nav.lang": "Langue", "nav.theme": "Thème", "nav.menu": "Menu",
    "home.kicker": "Un cours libre et gratuit d'ingénierie agentique",
    "home.h1": "Tout programme est une liste d'étapes.",
    "home.h1b": "La seule question est de savoir qui les choisit.",
    "home.lede": "Un cours complet sur la construction de systèmes qui utilisent l'IA, écrit pour celles et ceux qui débutent en programmation. Trois parties, environ quatre heures, et vous repartez avec un agent fonctionnel et une suite de tests qui le note.",
    "home.cta": "Commencer — gratuit", "home.cta2": "Voir le programme",
    "home.free": "Sans compte. Sans traçage. Licence MIT.",
    "home.pathTitle": "Votre parcours",
    "home.pathLede": "Chaque partie exige un peu plus que la précédente. Commencez par le haut.",
    "track.1.tag": "Partie 1 · Lire", "track.1.title": "Le Manuel",
    "track.1.desc": "Onze sections illustrées sur qui décide de l'étape suivante à l'exécution : écrire du code, les prompts, le contexte, les boucles, les graphes, le harnais, l'évaluation et la sécurité. Vingt schémas interactifs.",
    "track.1.meta": "45 minutes · rien à installer", "track.1.cta": "Lire le manuel",
    "track.2.tag": "Partie 2 · Pratiquer", "track.2.title": "L'Atelier",
    "track.2.desc": "Quatre étapes pratiques dans ce navigateur. Faites un vrai appel à un modèle, étendez une caisse à base de règles jusqu'à ce qu'elle casse, écrivez votre prompt, puis notez-le sur vingt cas réels.",
    "track.2.meta": "40 minutes · votre propre clé API · environ 1¢", "track.2.cta": "Ouvrir l'atelier",
    "track.3.tag": "Partie 3 · Construire", "track.3.title": "Le Cours Python",
    "track.3.desc": "Cinq étapes de plus, sur votre machine. La boucle de l'agent écrite à la main, des outils qui échouent exprès, une barrière d'autorisation, un relecteur impossible à contourner, et un e-mail qui tente de donner des ordres à votre agent.",
    "track.3.meta": "2–3 heures · Python · environ 2¢", "track.3.cta": "Ouvrir le cours",
    "home.learnTitle": "Ce que vous saurez faire",
    "home.learn1": "Distinguer les problèmes qui exigent un modèle de ceux qui n'en ont pas besoin",
    "home.learn1d": "Le jugement le plus précieux du domaine, et le moins coûteux à acquérir.",
    "home.learn2": "Écrire un prompt et prouver qu'il fonctionne",
    "home.learn2d": "Non pas en lisant ses réponses, mais en le notant sur des cas et en regardant un chiffre bouger.",
    "home.learn3": "Construire une boucle d'agent qui survit aux pannes",
    "home.learn3d": "Les outils cassent. La boucle doit lire l'erreur et s'adapter, pas planter.",
    "home.learn4": "Poser une barrière autour de ce qu'un modèle peut faire",
    "home.learn4d": "Autorisations, étapes de relecture obligatoires et limites imposées dans le code.",
    "home.forTitle": "À qui cela s'adresse", "home.for1": "Grands débutants",
    "home.for1d": "Les parties 1 et 2 ne supposent aucune programmation.",
    "home.for2": "Étudiants et autodidactes", "home.for2d": "Un programme complet à finir en un après-midi.",
    "home.for3": "Enseignants", "home.for3d": "Un plan de cours de 90 minutes, libre de réutilisation et de traduction.",
    "home.progTitle": "Où vous en êtes",
    "home.progNone": "Rien pour l'instant. Votre progression est enregistrée dans ce navigateur uniquement : aucun compte, rien n'est envoyé nulle part.",
    "home.progReset": "Réinitialiser la progression",
    "home.faqTitle": "Questions fréquentes",
    "home.q1": "Est-ce vraiment gratuit ?",
    "home.a1": "Oui. Tout le cours est sous licence MIT : ni compte, ni collecte d'e-mail, ni traçage d'aucune sorte. Les parties 2 et 3 appellent un modèle, vous apportez donc votre clé API — le cours entier coûte quelques centimes de jetons.",
    "home.q2": "Faut-il savoir programmer ?",
    "home.a2": "Pas pour les parties 1 et 2. La partie 3 suppose que vous savez lire et écrire du Python simple : fonctions, dictionnaires, une boucle for. Sinon, faites les parties 1 et 2 puis revenez.",
    "home.q3": "Quel modèle d'IA est utilisé ?",
    "home.a3": "DeepSeek ou Claude d'Anthropic, au choix. Le code est écrit pour qu'aucune ligne des exercices ne change entre les deux, ce qui constitue en soi l'une des leçons.",
    "home.q4": "Ma clé API est-elle en sécurité ?",
    "home.a4": "Votre clé reste dans l'onglet du navigateur et disparaît à sa fermeture. Elle est envoyée au fournisseur du modèle et nulle part ailleurs. Ce site n'a pas de serveur, donc il n'existe aucun autre endroit où l'envoyer.",
    "foot.built": "Réalisé par", "foot.source": "Code sur GitHub",
    "foot.licence": "Licence MIT : utilisez-le, forkez-le, traduisez-le, enseignez avec.",
    "foot.disclaim": "Sans affiliation avec un fournisseur d'IA. Les comportements montrés valent pour le modèle que vous utilisez.",
    "foot.translate": "Aider à traduire",
    "ui.back": "Retour", "ui.next": "Suivant", "ui.start": "Commencer", "ui.run": "Lancer",
    "ui.retry": "Réessayer", "ui.loading": "En cours…", "ui.done": "Terminé",
    "ui.locked": "Verrouillé", "ui.optional": "Facultatif", "ui.minutes": "min",
    "ui.of": "sur", "ui.close": "Fermer",
    "lab.title": "L'Atelier", "lab.sub": "Quatre étapes, dans ce navigateur",
    "lab.keyTitle": "Votre clé API", "lab.keySet": "enregistrée pour cet onglet", "lab.keyNone": "non définie",
    "lab.keySave": "Enregistrer", "lab.keyReplace": "Remplacer", "lab.keyForget": "Oublier",
    "lab.keyNote": "Conservée dans cet onglet uniquement et effacée à sa fermeture. Envoyée au fournisseur du modèle et nulle part ailleurs : ce site n'a ni serveur ni analytique.",
    "lab.noCalls": "aucun appel pour l'instant",
    "hb.start": "Commencer ici",
    "hb.code": "Écrire du code",
    "hb.prompt": "Ingénierie des prompts",
    "hb.context": "Ingénierie du contexte",
    "hb.loop": "Ingénierie des boucles",
    "hb.graph": "Ingénierie des graphes",
    "hb.harness": "Ingénierie du harnais",
    "hb.evals": "Ingénierie de l'évaluation",
    "hb.security": "Ingénierie de la sécurité",
    "hb.compare": "Lequel, quand",
    "hb.play": "Jouer",
    "note.englishOnly": "Le texte pédagogique de cette section n'existe pour l'instant qu'en anglais. L'interface est traduite en neuf langues ; traduire les articles longs est le chantier suivant et les contributions sont bienvenues.",
    "note.langHelp": "Une traduction vous semble mauvaise ? Les corrections sont bienvenues : toutes les chaînes tiennent dans un seul fichier."
  };

  /* ============================== DEUTSCH ============================== */
  T.de = {
    "brand.tag": "Der beste KI-Kurs",
    "brand.sub": "Mit KI bauen lernen, von Grund auf",
    "nav.home": "Start", "nav.handbook": "Handbuch", "nav.lab": "Labor",
    "nav.course": "Python-Kurs", "nav.teach": "Für Lehrende",
    "nav.lang": "Sprache", "nav.theme": "Design", "nav.menu": "Menü",
    "home.kicker": "Ein freier, kostenloser Kurs über agentische Softwareentwicklung",
    "home.h1": "Jedes Programm ist eine Liste von Schritten.",
    "home.h1b": "Die einzige Frage ist, wer sie auswählt.",
    "home.lede": "Ein vollständiger Kurs über den Bau von Systemen, die KI nutzen — geschrieben für Menschen, die neu in der Softwareentwicklung sind. Drei Teile, etwa vier Stunden, und am Ende haben Sie einen funktionierenden Agenten gebaut und eine Testsuite, die ihn bewertet.",
    "home.cta": "Kostenlos starten", "home.cta2": "Lehrplan ansehen",
    "home.free": "Kein Konto. Kein Tracking. MIT-Lizenz.",
    "home.pathTitle": "Ihr Lernweg",
    "home.pathLede": "Jeder Teil verlangt etwas mehr als der vorige. Beginnen Sie oben.",
    "track.1.tag": "Teil 1 · Lesen", "track.1.title": "Das Handbuch",
    "track.1.desc": "Elf illustrierte Abschnitte darüber, wer zur Laufzeit den nächsten Schritt bestimmt: Code schreiben, Prompts, Kontext, Schleifen, Graphen, Harness, Evaluation und Sicherheit. Zwanzig interaktive Diagramme.",
    "track.1.meta": "45 Minuten · nichts zu installieren", "track.1.cta": "Handbuch lesen",
    "track.2.tag": "Teil 2 · Üben", "track.2.title": "Das Labor",
    "track.2.desc": "Vier praktische Stufen in diesem Browser. Machen Sie einen echten Modellaufruf, erweitern Sie eine regelbasierte Kasse bis sie scheitert, schreiben Sie einen eigenen Prompt und bewerten Sie ihn an zwanzig echten Fällen.",
    "track.2.meta": "40 Minuten · eigener API-Schlüssel · etwa 1 Cent", "track.2.cta": "Labor öffnen",
    "track.3.tag": "Teil 3 · Bauen", "track.3.title": "Der Python-Kurs",
    "track.3.desc": "Fünf weitere Stufen auf Ihrem eigenen Rechner. Die Agentenschleife von Hand geschrieben, Werkzeuge die absichtlich fehlschlagen, eine Genehmigungsschranke, ein Prüfschritt der sich nicht überspringen lässt, und eine E-Mail, die Ihrem Agenten Befehle erteilen will.",
    "track.3.meta": "2–3 Stunden · Python · etwa 2 Cent", "track.3.cta": "Kurs öffnen",
    "home.learnTitle": "Was Sie danach können",
    "home.learn1": "Erkennen, welche Probleme ein Modell brauchen und welche nicht",
    "home.learn1d": "Das wertvollste Urteil in diesem Feld — und das am leichtesten falsch getroffene.",
    "home.learn2": "Einen Prompt schreiben und beweisen, dass er funktioniert",
    "home.learn2d": "Nicht durch Lesen der Antworten, sondern durch Bewertung an Fällen und eine Zahl, die sich bewegt.",
    "home.learn3": "Eine Agentenschleife bauen, die Fehler übersteht",
    "home.learn3d": "Werkzeuge fallen aus. Die Schleife muss den Fehler lesen und sich anpassen, nicht abstürzen.",
    "home.learn4": "Einen Zaun um das ziehen, was ein Modell tun darf",
    "home.learn4d": "Genehmigungsschranken, verpflichtende Prüfschritte und Grenzen, die im Code durchgesetzt werden.",
    "home.forTitle": "Für wen das ist", "home.for1": "Absolute Anfänger",
    "home.for1d": "Teil 1 und 2 setzen keinerlei Programmierkenntnisse voraus.",
    "home.for2": "Studierende und Selbstlernende", "home.for2d": "Ein vollständiger Lehrplan für einen Nachmittag.",
    "home.for3": "Lehrende", "home.for3d": "Ein 90-Minuten-Stundenplan, frei zur Nutzung und Übersetzung.",
    "home.progTitle": "Wo Sie stehen",
    "home.progNone": "Noch nichts. Ihr Fortschritt wird nur in diesem Browser gespeichert — kein Konto, nichts wird irgendwohin gesendet.",
    "home.progReset": "Fortschritt zurücksetzen",
    "home.faqTitle": "Häufige Fragen",
    "home.q1": "Ist es wirklich kostenlos?",
    "home.a1": "Ja. Der gesamte Kurs steht unter MIT-Lizenz; es gibt kein Konto, keine E-Mail-Erfassung und kein Tracking. Teil 2 und 3 rufen ein Modell auf, dafür bringen Sie Ihren eigenen API-Schlüssel mit — der ganze Kurs kostet ein paar Cent an Tokens.",
    "home.q2": "Muss ich programmieren können?",
    "home.a2": "Für Teil 1 und 2 nicht. Teil 3 setzt voraus, dass Sie einfaches Python lesen und schreiben können: Funktionen, Dictionaries, eine for-Schleife. Falls noch nicht, machen Sie Teil 1 und 2 und kommen Sie zurück.",
    "home.q3": "Welches KI-Modell wird verwendet?",
    "home.a3": "DeepSeek oder Claude von Anthropic, ganz wie Sie möchten. Der Code ist so geschrieben, dass sich keine Zeile der Übungen zwischen beiden ändert — was selbst eine der Lektionen ist.",
    "home.q4": "Ist mein API-Schlüssel sicher?",
    "home.a4": "Ihr Schlüssel bleibt nur im Browser-Tab und wird beim Schließen gelöscht. Er geht an den Modellanbieter und sonst nirgendwohin. Diese Seite hat keinen Server, also gibt es gar keinen anderen Ort dafür.",
    "foot.built": "Erstellt von", "foot.source": "Quellcode auf GitHub",
    "foot.licence": "MIT-Lizenz — nutzen, forken, übersetzen, damit unterrichten.",
    "foot.disclaim": "Keine Verbindung zu einem KI-Anbieter. Alle gezeigten Modellverhalten gelten für das Modell, mit dem Sie es ausführen.",
    "foot.translate": "Beim Übersetzen helfen",
    "ui.back": "Zurück", "ui.next": "Weiter", "ui.start": "Start", "ui.run": "Ausführen",
    "ui.retry": "Erneut versuchen", "ui.loading": "Arbeitet…", "ui.done": "Fertig",
    "ui.locked": "Gesperrt", "ui.optional": "Optional", "ui.minutes": "Min.",
    "ui.of": "von", "ui.close": "Schließen",
    "lab.title": "Das Labor", "lab.sub": "Vier Stufen, in diesem Browser",
    "lab.keyTitle": "Ihr API-Schlüssel", "lab.keySet": "für diesen Tab gespeichert", "lab.keyNone": "nicht gesetzt",
    "lab.keySave": "Speichern", "lab.keyReplace": "Ersetzen", "lab.keyForget": "Verwerfen",
    "lab.keyNote": "Nur in diesem Browser-Tab gespeichert und beim Schließen gelöscht. Geht an den Modellanbieter und sonst nirgendwohin — diese Seite hat keinen Server und keine Analyse.",
    "lab.noCalls": "noch keine Aufrufe",
    "hb.start": "Hier starten",
    "hb.code": "Code schreiben",
    "hb.prompt": "Prompt-Engineering",
    "hb.context": "Kontext-Engineering",
    "hb.loop": "Schleifen-Engineering",
    "hb.graph": "Graph-Engineering",
    "hb.harness": "Harness-Engineering",
    "hb.evals": "Evaluations-Engineering",
    "hb.security": "Sicherheits-Engineering",
    "hb.compare": "Was wann",
    "hb.play": "Das Spiel",
    "note.englishOnly": "Der Lehrtext in diesem Abschnitt liegt bisher nur auf Englisch vor. Die Oberfläche ist in neun Sprachen übersetzt; die langen Artikel zu übersetzen ist der nächste Schritt, und Beiträge sind sehr willkommen.",
    "note.langHelp": "Eine schlechte Übersetzung entdeckt? Korrekturen sind willkommen — alle Texte stehen in einer einzigen Datei."
  };

  /* =========================== 简体中文 =========================== */
  T["zh-Hans"] = {
    "brand.tag": "顶级 AI 课程",
    "brand.sub": "从第一性原理出发，学会用 AI 构建系统",
    "nav.home": "首页", "nav.handbook": "手册", "nav.lab": "实验室",
    "nav.course": "Python 课程", "nav.teach": "教师专区",
    "nav.lang": "语言", "nav.theme": "主题", "nav.menu": "菜单",
    "home.kicker": "一门免费开源的智能体工程课程",
    "home.h1": "每个程序都是一串步骤。",
    "home.h1b": "唯一的问题是：谁来决定这些步骤。",
    "home.lede": "一门关于如何构建 AI 系统的完整课程，专为编程新手而写。三个部分，约四小时，学完后你会亲手做出一个可运行的智能体，以及一套为它打分的评测集。",
    "home.cta": "免费开始学习", "home.cta2": "查看课程大纲",
    "home.free": "无需注册，零追踪，MIT 许可。",
    "home.pathTitle": "你的学习路径",
    "home.pathLede": "每一部分都比上一部分要求更多。请从最上面开始。",
    "track.1.tag": "第一部分 · 阅读", "track.1.title": "手册",
    "track.1.desc": "十一个图解章节，讲清楚运行时到底由谁决定下一步：写代码、提示词、上下文、循环、图、运行框架、评测与安全。二十张可交互的流程图。",
    "track.1.meta": "45 分钟 · 无需安装", "track.1.cta": "阅读手册",
    "track.2.tag": "第二部分 · 练习", "track.2.title": "实验室",
    "track.2.desc": "在浏览器里完成四个动手关卡：发出一次真实的模型调用，把基于规则的点单机扩展到它撑不住为止，写出自己的提示词，然后用二十个真实案例给它打分。",
    "track.2.meta": "40 分钟 · 使用你自己的 API 密钥 · 约一分钱", "track.2.cta": "进入实验室",
    "track.3.tag": "第三部分 · 构建", "track.3.title": "Python 课程",
    "track.3.desc": "在你自己的电脑上再做五个关卡：手写智能体循环、故意会失败的工具、权限闸门、无法被跳过的审核环节，以及一封试图对你的智能体下命令的邮件。",
    "track.3.meta": "2–3 小时 · Python · 约两分钱", "track.3.cta": "进入课程",
    "home.learnTitle": "学完你将能够",
    "home.learn1": "判断哪些问题需要模型，哪些不需要",
    "home.learn1d": "这是这个领域最有价值的判断力，也是最容易判断错的地方。",
    "home.learn2": "写出提示词，并证明它确实有效",
    "home.learn2d": "不是靠读它的回答，而是用案例打分，看着那个数字变化。",
    "home.learn3": "构建能扛住失败的智能体循环",
    "home.learn3d": "工具一定会出错。循环要能读懂错误并调整，而不是直接崩溃。",
    "home.learn4": "给模型能做的事装上护栏",
    "home.learn4d": "权限闸门、强制审核环节，以及在代码里真正生效的限制。",
    "home.forTitle": "这门课适合谁", "home.for1": "零基础的初学者",
    "home.for1d": "第一、二部分完全不需要编程基础。",
    "home.for2": "学生与自学者", "home.for2d": "一个下午就能学完的完整大纲。",
    "home.for3": "教师", "home.for3d": "一份 90 分钟的教案，可自由使用与翻译。",
    "home.progTitle": "你的进度",
    "home.progNone": "还没有记录。进度只保存在这个浏览器里——不需要账号，也不会发送到任何地方。",
    "home.progReset": "清空进度",
    "home.faqTitle": "常见问题",
    "home.q1": "真的是免费的吗？",
    "home.a1": "是的。整门课程采用 MIT 许可，不需要注册、不收集邮箱、没有任何追踪。第二、三部分会调用模型，需要你自备 API 密钥——整门课的 token 花费大约几分钱。",
    "home.q2": "需要会编程吗？",
    "home.a2": "第一、二部分不需要。第三部分要求你能读写基础 Python：函数、字典、for 循环。如果还不会，先做完前两部分再回来。",
    "home.q3": "用的是哪个 AI 模型？",
    "home.a3": "DeepSeek 或 Anthropic 的 Claude，由你选择。代码经过设计，换模型时练习里没有一行需要改动——这本身就是课程的一课。",
    "home.q4": "我的 API 密钥安全吗？",
    "home.a4": "密钥只存在这个浏览器标签页里，关闭即清除。它只会发给模型服务商，不会去别处。本站没有服务器，因此根本不存在第二个去处。",
    "foot.built": "作者", "foot.source": "GitHub 源码",
    "foot.licence": "MIT 许可——随意使用、复刻、翻译、用于教学。",
    "foot.disclaim": "与任何 AI 服务商均无隶属关系。文中展示的模型行为，取决于你实际运行的模型。",
    "foot.translate": "帮忙改进翻译",
    "ui.back": "返回", "ui.next": "下一步", "ui.start": "开始", "ui.run": "运行",
    "ui.retry": "重试", "ui.loading": "处理中…", "ui.done": "完成",
    "ui.locked": "未解锁", "ui.optional": "选修", "ui.minutes": "分钟",
    "ui.of": "/", "ui.close": "关闭",
    "lab.title": "实验室", "lab.sub": "四个关卡，就在这个浏览器里",
    "lab.keyTitle": "你的 API 密钥", "lab.keySet": "已保存在本标签页", "lab.keyNone": "尚未设置",
    "lab.keySave": "保存", "lab.keyReplace": "更换", "lab.keyForget": "清除",
    "lab.keyNote": "只保存在这个浏览器标签页，关闭即清除。只会发送给模型服务商，不会去别处——本站没有服务器，也没有任何统计代码。",
    "lab.noCalls": "尚未调用",
    "hb.start": "从这里开始",
    "hb.code": "写代码",
    "hb.prompt": "提示词工程",
    "hb.context": "上下文工程",
    "hb.loop": "循环工程",
    "hb.graph": "图工程",
    "hb.harness": "运行框架工程",
    "hb.evals": "评测工程",
    "hb.security": "安全工程",
    "hb.compare": "什么时候用哪个",
    "hb.play": "来玩一局",
    "note.englishOnly": "本章节的正文目前仅有英文版。界面已翻译成九种语言；长文翻译是下一步的工作，欢迎参与贡献。",
    "note.langHelp": "发现翻译有问题？欢迎指正——所有文案都集中在同一个文件里。"
  };

  /* =========================== 繁體中文 =========================== */
  T["zh-Hant"] = {
    "brand.tag": "頂尖 AI 課程",
    "brand.sub": "從第一原理出發，學會用 AI 打造系統",
    "nav.home": "首頁", "nav.handbook": "手冊", "nav.lab": "實驗室",
    "nav.course": "Python 課程", "nav.teach": "教師專區",
    "nav.lang": "語言", "nav.theme": "主題", "nav.menu": "選單",
    "home.kicker": "一門免費開源的代理式工程課程",
    "home.h1": "每個程式都是一連串步驟。",
    "home.h1b": "唯一的問題是：由誰決定這些步驟。",
    "home.lede": "一門關於如何打造 AI 系統的完整課程，專為軟體開發新手而寫。三個部分，約四小時，學完後你會親手做出一個可運作的代理程式，以及一套為它評分的測試集。",
    "home.cta": "免費開始學習", "home.cta2": "查看課程大綱",
    "home.free": "免註冊、零追蹤、MIT 授權。",
    "home.pathTitle": "你的學習路徑",
    "home.pathLede": "每一部分都比前一部分要求更多。請從最上面開始。",
    "track.1.tag": "第一部分 · 閱讀", "track.1.title": "手冊",
    "track.1.desc": "十一個圖解章節，說清楚執行時究竟由誰決定下一步：寫程式、提示詞、脈絡、迴圈、圖、執行框架、評測與資安。二十張可互動的流程圖。",
    "track.1.meta": "45 分鐘 · 免安裝", "track.1.cta": "閱讀手冊",
    "track.2.tag": "第二部分 · 練習", "track.2.title": "實驗室",
    "track.2.desc": "在瀏覽器裡完成四個動手關卡：發出一次真正的模型呼叫，把規則式點餐機擴充到它撐不住為止，寫出自己的提示詞，再用二十個真實案例替它評分。",
    "track.2.meta": "40 分鐘 · 使用你自己的 API 金鑰 · 約新台幣三角", "track.2.cta": "進入實驗室",
    "track.3.tag": "第三部分 · 打造", "track.3.title": "Python 課程",
    "track.3.desc": "在你自己的電腦上再做五個關卡：手寫代理迴圈、故意失敗的工具、權限關卡、無法被略過的審核步驟，以及一封試圖對你的代理程式下指令的郵件。",
    "track.3.meta": "2–3 小時 · Python · 約新台幣六角", "track.3.cta": "進入課程",
    "home.learnTitle": "學完你將能夠",
    "home.learn1": "判斷哪些問題需要模型、哪些不需要",
    "home.learn1d": "這是本領域最有價值的判斷力，也是最容易弄錯的地方。",
    "home.learn2": "寫出提示詞，並證明它真的有效",
    "home.learn2d": "不是靠讀它的回答，而是用案例評分，盯著那個數字變化。",
    "home.learn3": "打造能撐過失敗的代理迴圈",
    "home.learn3d": "工具一定會出錯。迴圈要能讀懂錯誤並調整，而不是直接當掉。",
    "home.learn4": "為模型能做的事設下界線",
    "home.learn4d": "權限關卡、強制審核步驟，以及真正寫在程式碼裡的限制。",
    "home.forTitle": "這門課適合誰", "home.for1": "完全零基礎的初學者",
    "home.for1d": "第一、二部分完全不需要程式基礎。",
    "home.for2": "學生與自學者", "home.for2d": "一個下午就能讀完的完整大綱。",
    "home.for3": "教師", "home.for3d": "一份 90 分鐘的教案，可自由使用與翻譯。",
    "home.progTitle": "你的進度",
    "home.progNone": "還沒有紀錄。進度只存在這個瀏覽器裡——不需要帳號，也不會傳送到任何地方。",
    "home.progReset": "清除進度",
    "home.faqTitle": "常見問題",
    "home.q1": "真的完全免費嗎？",
    "home.a1": "是的。整門課程採用 MIT 授權，不必註冊、不蒐集電子郵件、沒有任何追蹤。第二、三部分會呼叫模型，需要你自備 API 金鑰——整門課的 token 花費大約只有幾角。",
    "home.q2": "需要會寫程式嗎？",
    "home.a2": "第一、二部分不需要。第三部分要求你能讀寫基礎 Python：函式、字典、for 迴圈。若還不會，先做完前兩部分再回來。",
    "home.q3": "使用哪一個 AI 模型？",
    "home.a3": "DeepSeek 或 Anthropic 的 Claude，由你決定。程式碼刻意寫成換模型時練習裡一行都不必改——這件事本身就是課程的一課。",
    "home.q4": "我的 API 金鑰安全嗎？",
    "home.a4": "金鑰只存在這個瀏覽器分頁，關閉即清除。它只會送到模型供應商，不會去別的地方。本站沒有伺服器，所以根本不存在第二個去處。",
    "foot.built": "作者", "foot.source": "GitHub 原始碼",
    "foot.licence": "MIT 授權——歡迎使用、分支、翻譯、用於教學。",
    "foot.disclaim": "與任何 AI 供應商均無隸屬關係。文中呈現的模型行為，取決於你實際執行的模型。",
    "foot.translate": "協助改進翻譯",
    "ui.back": "返回", "ui.next": "下一步", "ui.start": "開始", "ui.run": "執行",
    "ui.retry": "重試", "ui.loading": "處理中…", "ui.done": "完成",
    "ui.locked": "未解鎖", "ui.optional": "選修", "ui.minutes": "分鐘",
    "ui.of": "/", "ui.close": "關閉",
    "lab.title": "實驗室", "lab.sub": "四個關卡，就在這個瀏覽器裡",
    "lab.keyTitle": "你的 API 金鑰", "lab.keySet": "已存於本分頁", "lab.keyNone": "尚未設定",
    "lab.keySave": "儲存", "lab.keyReplace": "更換", "lab.keyForget": "清除",
    "lab.keyNote": "只存在這個瀏覽器分頁，關閉即清除。只會送往模型供應商，不會去別處——本站沒有伺服器，也沒有任何分析程式。",
    "lab.noCalls": "尚未呼叫",
    "hb.start": "從這裡開始",
    "hb.code": "寫程式",
    "hb.prompt": "提示詞工程",
    "hb.context": "脈絡工程",
    "hb.loop": "迴圈工程",
    "hb.graph": "圖工程",
    "hb.harness": "執行框架工程",
    "hb.evals": "評測工程",
    "hb.security": "資安工程",
    "hb.compare": "什麼時候用哪個",
    "hb.play": "來玩一局",
    "note.englishOnly": "本章節的內文目前僅有英文版。介面已翻譯成九種語言；長篇文章的翻譯是下一步工作，非常歡迎貢獻。",
    "note.langHelp": "發現翻譯有誤？歡迎指正——所有字串都集中在同一個檔案裡。"
  };

  /* ============================== 日本語 ============================== */
  T.ja = {
    "brand.tag": "最高峰のAI講座",
    "brand.sub": "原理から学ぶ、AIでつくる技術",
    "nav.home": "ホーム", "nav.handbook": "ハンドブック", "nav.lab": "ラボ",
    "nav.course": "Python講座", "nav.teach": "教える方へ",
    "nav.lang": "言語", "nav.theme": "テーマ", "nav.menu": "メニュー",
    "home.kicker": "エージェント開発の無料オープン講座",
    "home.h1": "プログラムとは、手順のリストである。",
    "home.h1b": "問題は、その手順を誰が選ぶのかだけだ。",
    "home.lede": "AIを使うシステムのつくり方を、ソフトウェア開発がはじめての方に向けて解説する完全な講座です。全3部、約4時間。学び終えるころには、動くエージェントと、それを採点する評価セットが手元に残ります。",
    "home.cta": "無料ではじめる", "home.cta2": "カリキュラムを見る",
    "home.free": "アカウント不要・追跡なし・MITライセンス",
    "home.pathTitle": "学習の道すじ",
    "home.pathLede": "各パートは前のパートより少しだけ多くを求めます。上から順にどうぞ。",
    "track.1.tag": "第1部 · 読む", "track.1.title": "ハンドブック",
    "track.1.desc": "実行時に次の一手を誰が決めるのか——コードを書く、プロンプト、コンテキスト、ループ、グラフ、ハーネス、評価、セキュリティ。図解11章と、操作できる20点の図。",
    "track.1.meta": "45分 · インストール不要", "track.1.cta": "ハンドブックを読む",
    "track.2.tag": "第2部 · 手を動かす", "track.2.title": "ラボ",
    "track.2.desc": "このブラウザで進める4つの実習。実際にモデルを呼び、ルールベースのレジを限界まで拡張し、自分でプロンプトを書き、20件の実例で採点します。",
    "track.2.meta": "40分 · ご自身のAPIキー · 約1円", "track.2.cta": "ラボを開く",
    "track.3.tag": "第3部 · つくる", "track.3.title": "Python講座",
    "track.3.desc": "ご自身のPCでさらに5段階。エージェントループを手書きし、わざと失敗するツール、承認ゲート、省略できないレビュー工程、そしてエージェントに命令しようとするメールを扱います。",
    "track.3.meta": "2〜3時間 · Python · 約3円", "track.3.cta": "講座を開く",
    "home.learnTitle": "身につくこと",
    "home.learn1": "モデルが要る問題と、要らない問題を見分ける",
    "home.learn1d": "この分野でもっとも価値のある判断であり、もっとも安く間違えられる判断でもあります。",
    "home.learn2": "プロンプトを書き、それが機能することを証明する",
    "home.learn2d": "回答を読んで判断するのではなく、事例で採点し、数字の変化を見る。",
    "home.learn3": "失敗に耐えるエージェントループをつくる",
    "home.learn3d": "ツールは壊れます。ループはエラーを読んで適応すべきで、落ちてはいけません。",
    "home.learn4": "モデルにできることへ柵を設ける",
    "home.learn4d": "承認ゲート、必須のレビュー工程、そしてコードで強制する上限。",
    "home.forTitle": "こんな方へ", "home.for1": "まったくの初心者",
    "home.for1d": "第1部と第2部はプログラミングの知識を一切前提としません。",
    "home.for2": "学生・独学の方", "home.for2d": "半日で終えられる完全なカリキュラム。",
    "home.for3": "教える方", "home.for3d": "90分の授業案。再利用も翻訳も自由です。",
    "home.progTitle": "現在地",
    "home.progNone": "まだ記録がありません。進捗はこのブラウザにのみ保存されます——アカウントも、外部への送信もありません。",
    "home.progReset": "進捗をリセット",
    "home.faqTitle": "よくある質問",
    "home.q1": "本当に無料ですか？",
    "home.a1": "はい。講座全体がMITライセンスで、アカウント登録もメール収集も一切の追跡もありません。第2部と第3部はモデルを呼ぶため、ご自身のAPIキーが必要です——講座全体でも数円程度です。",
    "home.q2": "プログラミングの知識は必要ですか？",
    "home.a2": "第1部と第2部には不要です。第3部は基本的なPython（関数、辞書、forループ）が読み書きできることを前提とします。まだであれば、第1部と第2部を終えてから戻ってきてください。",
    "home.q3": "どのAIモデルを使いますか？",
    "home.a3": "DeepSeekかAnthropicのClaude、お好きなほうを。どちらに切り替えても演習のコードは一行も変わらないように書かれており、それ自体が学びのひとつです。",
    "home.q4": "APIキーは安全ですか？",
    "home.a4": "キーはブラウザのタブ内にのみ保持され、閉じると消えます。送信先はモデル提供元だけです。本サイトにはサーバーがないため、そもそも他に送りようがありません。",
    "foot.built": "制作", "foot.source": "GitHubのソース",
    "foot.licence": "MITライセンス——利用・フォーク・翻訳・授業での使用、すべて自由です。",
    "foot.disclaim": "いかなるAI提供事業者とも関係はありません。示されているモデルの挙動は、実行するモデルに依存します。",
    "foot.translate": "翻訳に協力する",
    "ui.back": "戻る", "ui.next": "次へ", "ui.start": "開始", "ui.run": "実行",
    "ui.retry": "再試行", "ui.loading": "処理中…", "ui.done": "完了",
    "ui.locked": "未開放", "ui.optional": "任意", "ui.minutes": "分",
    "ui.of": "/", "ui.close": "閉じる",
    "lab.title": "ラボ", "lab.sub": "4つの実習を、このブラウザで",
    "lab.keyTitle": "APIキー", "lab.keySet": "このタブに保存済み", "lab.keyNone": "未設定",
    "lab.keySave": "保存", "lab.keyReplace": "変更", "lab.keyForget": "消去",
    "lab.keyNote": "このタブにのみ保存され、閉じると消えます。送信先はモデル提供元だけです——本サイトにはサーバーも解析ツールもありません。",
    "lab.noCalls": "まだ呼び出しなし",
    "hb.start": "ここから",
    "hb.code": "コードを書く",
    "hb.prompt": "プロンプト設計",
    "hb.context": "コンテキスト設計",
    "hb.loop": "ループ設計",
    "hb.graph": "グラフ設計",
    "hb.harness": "ハーネス設計",
    "hb.evals": "評価設計",
    "hb.security": "セキュリティ設計",
    "hb.compare": "どれをいつ使うか",
    "hb.play": "ゲームで腕試し",
    "note.englishOnly": "この章の本文は現在英語のみです。インターフェースは9言語に翻訳済みで、長文記事の翻訳が次の課題です。ご協力を歓迎します。",
    "note.langHelp": "訳がおかしい箇所を見つけましたか？修正を歓迎します——文言はすべて1つのファイルにまとまっています。"
  };

  /* ============================== 한국어 ============================== */
  T.ko = {
    "brand.tag": "최고의 AI 강의",
    "brand.sub": "원리부터 배우는 AI 개발",
    "nav.home": "홈", "nav.handbook": "핸드북", "nav.lab": "실습실",
    "nav.course": "파이썬 강의", "nav.teach": "교사용",
    "nav.lang": "언어", "nav.theme": "테마", "nav.menu": "메뉴",
    "home.kicker": "무료 오픈 에이전트 엔지니어링 강의",
    "home.h1": "모든 프로그램은 단계의 목록이다.",
    "home.h1b": "문제는 그 단계를 누가 고르느냐뿐이다.",
    "home.lede": "AI를 활용하는 시스템을 만드는 법을, 개발이 처음인 분을 위해 쓴 완결된 강의입니다. 3부 구성, 약 네 시간. 다 마치면 직접 만든 에이전트와 그것을 채점하는 평가 세트가 손에 남습니다.",
    "home.cta": "무료로 시작하기", "home.cta2": "커리큘럼 보기",
    "home.free": "계정 불필요 · 추적 없음 · MIT 라이선스",
    "home.pathTitle": "학습 경로",
    "home.pathLede": "각 부는 앞의 부보다 조금 더 많은 것을 요구합니다. 위에서부터 시작하세요.",
    "track.1.tag": "1부 · 읽기", "track.1.title": "핸드북",
    "track.1.desc": "실행 시점에 다음 단계를 누가 정하는가를 다루는 열한 개의 그림 설명: 코드 작성, 프롬프트, 컨텍스트, 루프, 그래프, 하네스, 평가, 보안. 조작 가능한 도해 스무 장.",
    "track.1.meta": "45분 · 설치 불필요", "track.1.cta": "핸드북 읽기",
    "track.2.tag": "2부 · 실습", "track.2.title": "실습실",
    "track.2.desc": "이 브라우저에서 진행하는 네 단계 실습. 실제로 모델을 호출하고, 규칙 기반 주문기를 한계까지 확장해 보고, 직접 프롬프트를 쓴 뒤 스무 개의 실제 사례로 채점합니다.",
    "track.2.meta": "40분 · 본인 API 키 · 약 15원", "track.2.cta": "실습실 열기",
    "track.3.tag": "3부 · 제작", "track.3.title": "파이썬 강의",
    "track.3.desc": "본인 컴퓨터에서 다섯 단계 더. 에이전트 루프를 직접 작성하고, 일부러 실패하는 도구, 권한 게이트, 건너뛸 수 없는 검토 단계, 그리고 에이전트에게 명령을 내리려는 이메일을 다룹니다.",
    "track.3.meta": "2~3시간 · 파이썬 · 약 30원", "track.3.cta": "강의 열기",
    "home.learnTitle": "배우고 나면 할 수 있는 일",
    "home.learn1": "모델이 필요한 문제와 필요 없는 문제를 가려내기",
    "home.learn1d": "이 분야에서 가장 값진 판단이자, 가장 값싸게 틀려 볼 수 있는 판단입니다.",
    "home.learn2": "프롬프트를 쓰고, 그것이 작동함을 증명하기",
    "home.learn2d": "답변을 읽어서가 아니라, 사례로 채점하고 숫자가 움직이는 것을 보면서.",
    "home.learn3": "실패를 견디는 에이전트 루프 만들기",
    "home.learn3d": "도구는 고장 납니다. 루프는 오류를 읽고 적응해야지, 멈춰서는 안 됩니다.",
    "home.learn4": "모델이 할 수 있는 일에 울타리 두르기",
    "home.learn4d": "권한 게이트, 필수 검토 단계, 그리고 코드로 강제하는 한도.",
    "home.forTitle": "이런 분께", "home.for1": "완전한 초보자",
    "home.for1d": "1부와 2부는 프로그래밍 지식을 전혀 전제하지 않습니다.",
    "home.for2": "학생과 독학자", "home.for2d": "하루 오후면 끝낼 수 있는 완결형 커리큘럼.",
    "home.for3": "교사", "home.for3d": "90분 수업 계획안, 자유롭게 재사용하고 번역하세요.",
    "home.progTitle": "현재 위치",
    "home.progNone": "아직 기록이 없습니다. 진행 상황은 이 브라우저에만 저장됩니다 — 계정도, 외부 전송도 없습니다.",
    "home.progReset": "진행 상황 초기화",
    "home.faqTitle": "자주 묻는 질문",
    "home.q1": "정말 무료인가요?",
    "home.a1": "네. 강의 전체가 MIT 라이선스이며 계정도, 이메일 수집도, 어떤 추적도 없습니다. 2부와 3부는 모델을 호출하므로 본인 API 키가 필요합니다 — 강의 전체를 다 해도 토큰 비용은 수십 원 수준입니다.",
    "home.q2": "프로그래밍을 알아야 하나요?",
    "home.a2": "1부와 2부는 필요 없습니다. 3부는 기본적인 파이썬(함수, 딕셔너리, for 루프)을 읽고 쓸 수 있다고 가정합니다. 아직이라면 1부와 2부를 마치고 돌아오세요.",
    "home.q3": "어떤 AI 모델을 쓰나요?",
    "home.a3": "DeepSeek 또는 Anthropic의 Claude 중 선택하시면 됩니다. 둘 사이를 바꿔도 실습 코드가 단 한 줄도 달라지지 않도록 작성되어 있으며, 그 자체가 하나의 교훈입니다.",
    "home.q4": "제 API 키는 안전한가요?",
    "home.a4": "키는 브라우저 탭 안에만 보관되고 탭을 닫으면 지워집니다. 모델 제공사 외에는 어디로도 전송되지 않습니다. 이 사이트에는 서버가 없어서 보낼 곳 자체가 없습니다.",
    "foot.built": "제작", "foot.source": "GitHub 소스",
    "foot.licence": "MIT 라이선스 — 사용, 포크, 번역, 수업 활용 모두 자유입니다.",
    "foot.disclaim": "어떤 AI 제공사와도 제휴 관계가 없습니다. 제시된 모델 동작은 실제로 실행하는 모델에 따라 달라집니다.",
    "foot.translate": "번역 돕기",
    "ui.back": "뒤로", "ui.next": "다음", "ui.start": "시작", "ui.run": "실행",
    "ui.retry": "다시 시도", "ui.loading": "처리 중…", "ui.done": "완료",
    "ui.locked": "잠김", "ui.optional": "선택", "ui.minutes": "분",
    "ui.of": "/", "ui.close": "닫기",
    "lab.title": "실습실", "lab.sub": "네 단계, 이 브라우저에서",
    "lab.keyTitle": "API 키", "lab.keySet": "이 탭에 저장됨", "lab.keyNone": "설정 안 됨",
    "lab.keySave": "저장", "lab.keyReplace": "교체", "lab.keyForget": "지우기",
    "lab.keyNote": "이 브라우저 탭에만 저장되며 탭을 닫으면 지워집니다. 모델 제공사 외에는 어디로도 가지 않습니다 — 이 사이트에는 서버도 분석 도구도 없습니다.",
    "lab.noCalls": "아직 호출 없음",
    "hb.start": "여기서 시작",
    "hb.code": "코드 작성",
    "hb.prompt": "프롬프트 엔지니어링",
    "hb.context": "컨텍스트 엔지니어링",
    "hb.loop": "루프 엔지니어링",
    "hb.graph": "그래프 엔지니어링",
    "hb.harness": "하네스 엔지니어링",
    "hb.evals": "평가 엔지니어링",
    "hb.security": "보안 엔지니어링",
    "hb.compare": "무엇을 언제",
    "hb.play": "게임으로 확인",
    "note.englishOnly": "이 장의 본문은 현재 영어만 제공됩니다. 인터페이스는 아홉 개 언어로 번역되어 있으며, 긴 글의 번역이 다음 작업입니다. 기여를 환영합니다.",
    "note.langHelp": "잘못된 번역을 발견하셨나요? 수정을 환영합니다 — 모든 문구는 파일 하나에 모여 있습니다."
  };

  /* ============================== العربية ============================== */
  T.ar = {
    "brand.tag": "أفضل دورة في الذكاء الاصطناعي",
    "brand.sub": "تعلّم البناء بالذكاء الاصطناعي من المبادئ الأولى",
    "nav.home": "الرئيسية", "nav.handbook": "الدليل", "nav.lab": "المختبر",
    "nav.course": "دورة بايثون", "nav.teach": "للمعلّمين",
    "nav.lang": "اللغة", "nav.theme": "المظهر", "nav.menu": "القائمة",
    "home.kicker": "دورة مجانية ومفتوحة في هندسة الوكلاء الذكيين",
    "home.h1": "كل برنامج هو قائمة من الخطوات.",
    "home.h1b": "والسؤال الوحيد هو: من يختار هذه الخطوات؟",
    "home.lede": "دورة متكاملة في بناء الأنظمة التي تستخدم الذكاء الاصطناعي، كُتبت لمن هم جدد على هندسة البرمجيات. ثلاثة أجزاء، نحو أربع ساعات، وتنتهي وقد بنيت وكيلًا يعمل فعلًا ومجموعة اختبارات تُقيّمه.",
    "home.cta": "ابدأ التعلّم — مجانًا", "home.cta2": "تصفّح المنهج",
    "home.free": "بلا حساب. بلا تتبّع. برخصة MIT.",
    "home.pathTitle": "مسار تعلّمك",
    "home.pathLede": "كل جزء يطلب منك أكثر قليلًا من سابقه. ابدأ من الأعلى.",
    "track.1.tag": "الجزء الأول · قراءة", "track.1.title": "الدليل",
    "track.1.desc": "أحد عشر فصلًا مصوّرًا حول من يقرّر الخطوة التالية أثناء التشغيل: كتابة الشيفرة، والمُوجّهات، والسياق، والحلقات، والرسوم البيانية، وإطار التشغيل، والتقييم، والأمان. عشرون رسمًا تفاعليًا.",
    "track.1.meta": "٤٥ دقيقة · دون تثبيت أي شيء", "track.1.cta": "اقرأ الدليل",
    "track.2.tag": "الجزء الثاني · تطبيق", "track.2.title": "المختبر",
    "track.2.desc": "أربع مراحل عملية داخل هذا المتصفح. أرسل طلبًا حقيقيًا إلى نموذج، ووسّع نظام طلبات قائمًا على القواعد حتى ينهار، ثم اكتب مُوجّهك الخاص وقيّمه على عشرين حالة حقيقية.",
    "track.2.meta": "٤٠ دقيقة · مفتاح API خاص بك · نحو سنت واحد", "track.2.cta": "افتح المختبر",
    "track.3.tag": "الجزء الثالث · بناء", "track.3.title": "دورة بايثون",
    "track.3.desc": "خمس مراحل إضافية على جهازك. حلقة الوكيل مكتوبة يدويًا، وأدوات تفشل عمدًا، وبوابة أذونات، وخطوة مراجعة لا يمكن تخطّيها، ورسالة بريد تحاول أن تُملي الأوامر على وكيلك.",
    "track.3.meta": "٢–٣ ساعات · بايثون · نحو سنتين", "track.3.cta": "افتح الدورة",
    "home.learnTitle": "ما ستصبح قادرًا عليه",
    "home.learn1": "تمييز المسائل التي تحتاج نموذجًا من تلك التي لا تحتاجه",
    "home.learn1d": "أثمن حُكم في هذا المجال، وأقلّها كلفة عند الخطأ.",
    "home.learn2": "كتابة مُوجّه وإثبات أنه يعمل",
    "home.learn2d": "لا بقراءة إجاباته، بل بتقييمه على حالات ومراقبة رقم يتحرّك.",
    "home.learn3": "بناء حلقة وكيل تصمد أمام الأعطال",
    "home.learn3d": "الأدوات تتعطّل. على الحلقة أن تقرأ الخطأ وتتكيّف، لا أن تنهار.",
    "home.learn4": "وضع سياج حول ما يستطيع النموذج فعله",
    "home.learn4d": "بوابات أذونات، وخطوات مراجعة إلزامية، وحدود مفروضة داخل الشيفرة.",
    "home.forTitle": "لمن هذه الدورة", "home.for1": "المبتدئون تمامًا",
    "home.for1d": "الجزءان الأول والثاني لا يفترضان أي خبرة برمجية.",
    "home.for2": "الطلاب والمتعلّمون ذاتيًا", "home.for2d": "منهج كامل يمكن إنهاؤه في فترة بعد الظهر.",
    "home.for3": "المعلّمون", "home.for3d": "خطة درس من ٩٠ دقيقة، حرّة الاستخدام والترجمة.",
    "home.progTitle": "أين وصلت",
    "home.progNone": "لا شيء بعد. يُحفظ تقدّمك في هذا المتصفح وحده — بلا حساب، ودون إرسال أي شيء إلى أي جهة.",
    "home.progReset": "إعادة ضبط التقدّم",
    "home.faqTitle": "أسئلة شائعة",
    "home.q1": "هل هي مجانية فعلًا؟",
    "home.a1": "نعم. الدورة كاملة برخصة MIT، بلا حساب ولا جمع لبريد إلكتروني ولا تتبّع من أي نوع. الجزءان الثاني والثالث يستدعيان نموذجًا، لذا تستخدم مفتاح API الخاص بك — وتكلفة الدورة كلها بضعة سنتات.",
    "home.q2": "هل أحتاج إلى معرفة البرمجة؟",
    "home.a2": "ليس للجزأين الأول والثاني. الجزء الثالث يفترض أنك تقرأ وتكتب بايثون أساسية: الدوال، والقواميس، وحلقة for. إن لم تكن كذلك بعد، أنهِ الجزأين الأول والثاني ثم عُد.",
    "home.q3": "أي نموذج ذكاء اصطناعي تستخدم الدورة؟",
    "home.a3": "DeepSeek أو Claude من Anthropic، الخيار لك. كُتبت الشيفرة بحيث لا يتغيّر سطر واحد من التمارين بين النموذجين، وهذا في حد ذاته أحد الدروس.",
    "home.q4": "هل مفتاح API الخاص بي آمن؟",
    "home.a4": "يبقى مفتاحك داخل تبويب المتصفح وحده ويُمحى عند إغلاقه. يُرسل إلى مزوّد النموذج ولا يذهب إلى أي مكان آخر. هذا الموقع بلا خادم، فلا وجود أصلًا لمكان آخر يذهب إليه.",
    "foot.built": "من إعداد", "foot.source": "الشيفرة على GitHub",
    "foot.licence": "برخصة MIT — استخدمها، وانسخها، وترجمها، ودرّس بها.",
    "foot.disclaim": "لا ارتباط بأي مزوّد للذكاء الاصطناعي. سلوك النموذج المعروض يخصّ النموذج الذي تشغّله أنت.",
    "foot.translate": "ساعد في الترجمة",
    "ui.back": "رجوع", "ui.next": "التالي", "ui.start": "ابدأ", "ui.run": "شغّل",
    "ui.retry": "أعد المحاولة", "ui.loading": "جارٍ العمل…", "ui.done": "تم",
    "ui.locked": "مقفل", "ui.optional": "اختياري", "ui.minutes": "دقيقة",
    "ui.of": "من", "ui.close": "إغلاق",
    "lab.title": "المختبر", "lab.sub": "أربع مراحل، داخل هذا المتصفح",
    "lab.keyTitle": "مفتاح API الخاص بك", "lab.keySet": "محفوظ في هذا التبويب", "lab.keyNone": "غير مُعيّن",
    "lab.keySave": "حفظ", "lab.keyReplace": "استبدال", "lab.keyForget": "مسح",
    "lab.keyNote": "يُحفظ في هذا التبويب وحده ويُمحى عند إغلاقه. يُرسل إلى مزوّد النموذج ولا يذهب إلى أي مكان آخر — هذا الموقع بلا خادم وبلا أدوات تحليل.",
    "lab.noCalls": "لا استدعاءات بعد",
    "hb.start": "ابدأ من هنا",
    "hb.code": "كتابة الشيفرة",
    "hb.prompt": "هندسة المُوجّهات",
    "hb.context": "هندسة السياق",
    "hb.loop": "هندسة الحلقات",
    "hb.graph": "هندسة الرسوم البيانية",
    "hb.harness": "هندسة إطار التشغيل",
    "hb.evals": "هندسة التقييم",
    "hb.security": "هندسة الأمان",
    "hb.compare": "أيّها ومتى",
    "hb.play": "جرّب اللعبة",
    "note.englishOnly": "النص التعليمي في هذا القسم متاح حاليًا بالإنجليزية فقط. الواجهة مترجمة إلى تسع لغات، وترجمة المقالات الطويلة هي المهمة التالية، والمساهمات مُرحّب بها.",
    "note.langHelp": "لاحظت ترجمة غير دقيقة؟ التصحيحات مُرحّب بها — كل النصوص في ملف واحد."
  };

  /* ========================= runtime ========================= */

  var STORE = "ae.lang";

  function pick() {
    /* ?lang=xx wins over everything — makes a language shareable by URL and
       gives screenshots and tests a way in. */
    try {
      var q = (global.location && /[?&]lang=([\w-]+)/.exec(global.location.search)) || null;
      if (q && T[q[1]]) return q[1];
    } catch (e) { /* no location */ }
    var saved;
    try { saved = localStorage.getItem(STORE); } catch (e) { /* private mode */ }
    if (saved && T[saved]) return saved;

    var wanted = (global.navigator && (navigator.languages || [navigator.language])) || [];
    for (var i = 0; i < wanted.length; i++) {
      var w = String(wanted[i] || "");
      // exact, then script-aware Chinese, then the bare language
      if (T[w]) return w;
      if (/^zh\b/i.test(w)) {
        if (/Hant|TW|HK|MO/i.test(w)) return "zh-Hant";
        return "zh-Hans";
      }
      var base = w.split("-")[0];
      if (T[base]) return base;
    }
    return "en";
  }

  var I18N = {
    langs: LANGS,
    current: "en",

    meta: function (code) {
      for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
      return LANGS[0];
    },

    /** Look up a key, falling back to English, then to the key itself. */
    t: function (key) {
      var d = T[I18N.current];
      if (d && d[key] != null) return d[key];
      if (T.en[key] != null) return T.en[key];
      return key;
    },

    /** True when this key has no translation in the current language. */
    missing: function (key) {
      var d = T[I18N.current];
      return I18N.current !== "en" && !(d && d[key] != null);
    },

    apply: function (root) {
      var scope = root || document;
      var m = I18N.meta(I18N.current);

      if (!root) {
        document.documentElement.setAttribute("lang", I18N.current);
        document.documentElement.setAttribute("dir", m.dir);
      }
      var i, els;
      els = scope.querySelectorAll("[data-i18n]");
      for (i = 0; i < els.length; i++) els[i].textContent = I18N.t(els[i].getAttribute("data-i18n"));
      els = scope.querySelectorAll("[data-i18n-html]");
      for (i = 0; i < els.length; i++) els[i].innerHTML = I18N.t(els[i].getAttribute("data-i18n-html"));
      els = scope.querySelectorAll("[data-i18n-ph]");
      for (i = 0; i < els.length; i++) els[i].setAttribute("placeholder", I18N.t(els[i].getAttribute("data-i18n-ph")));
      els = scope.querySelectorAll("[data-i18n-aria]");
      for (i = 0; i < els.length; i++) els[i].setAttribute("aria-label", I18N.t(els[i].getAttribute("data-i18n-aria")));
      els = scope.querySelectorAll("[data-i18n-title]");
      for (i = 0; i < els.length; i++) els[i].setAttribute("title", I18N.t(els[i].getAttribute("data-i18n-title")));

      if (!root && typeof I18N.onchange === "function") I18N.onchange(I18N.current, m);
    },

    set: function (code) {
      if (!T[code]) code = "en";
      I18N.current = code;
      try { localStorage.setItem(STORE, code); } catch (e) { /* private mode */ }
      I18N.apply();
    },

    /** Coverage, for the language menu and for anyone auditing a translation.
     *  Proper nouns are excluded — "aicourse.top" is the same in every
     *  language, and counting it as untranslated would understate the rest. */
    coverage: function (code) {
      var SKIP = { "brand.name": 1 };
      var total = 0, have = 0, d = T[code] || {};
      for (var k in T.en) {
        if (SKIP[k]) continue;
        total++;
        if (d[k] != null) have++;
      }
      return { have: have, total: total, pct: Math.round(have / total * 100) };
    },

    init: function () {
      I18N.current = pick();
      I18N.apply();
      return I18N.current;
    }
  };

  global.I18N = I18N;
})(typeof window !== "undefined" ? window : globalThis);
