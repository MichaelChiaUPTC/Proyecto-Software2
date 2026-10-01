import type { Lesson, LessonBlock } from '@/types'

interface Compact {
  title: string
  minutes: number
  intro: string
  concept: string
  code: string
  caption: string
  note: string
}

function build(moduleId: string, order: number, c: Compact): Lesson {
  const blocks: LessonBlock[] = [
    { type: 'p', text: c.intro },
    { type: 'h', id: 'concepto', text: 'La idea central' },
    { type: 'p', text: c.concept },
    { type: 'h', id: 'ejemplo', text: 'Un ejemplo' },
    { type: 'code', code: c.code, caption: c.caption },
    { type: 'callout', title: 'Para recordar', text: c.note },
  ]
  return { id: `${moduleId}-l${order}`, moduleId, order, title: c.title, minutes: c.minutes, published: true, blocks }
}

const compact: Record<string, Compact[]> = {
  m01: [
    { title: '¿Qué es un programa?', minutes: 6, intro: 'Un programa es una lista de instrucciones que un computador ejecuta en orden. No hay magia: cada línea le pide al equipo una acción concreta.', concept: 'El computador hace exactamente lo que escribes, no lo que quisiste decir. Por eso la precisión importa más que la velocidad al escribir.', code: 'print("Hola, UPTC")\nprint("Estoy aprendiendo a programar")', caption: 'Dos instrucciones, ejecutadas de arriba hacia abajo.', note: 'El orden de las líneas es parte del significado del programa.' },
    { title: 'Tu primer programa en Python', minutes: 8, intro: 'Python se lee casi como inglés, lo que lo vuelve un buen primer lenguaje. Vamos a escribir y ejecutar una instrucción real.', concept: 'La función print() muestra un valor en pantalla. El texto va entre comillas porque Python debe distinguir un mensaje de un nombre de variable.', code: 'print("Hola, mundo")\nprint(2 + 3)', caption: 'El primer print muestra texto; el segundo muestra el resultado de una suma.', note: 'Si olvidas cerrar las comillas o el paréntesis, Python no ejecutará nada y te mostrará un error de sintaxis.' },
    { title: 'Errores comunes y cómo leerlos', minutes: 7, intro: 'Equivocarse es parte del oficio. La diferencia entre un principiante y alguien con práctica es que el segundo sabe leer el mensaje de error.', concept: 'Un SyntaxError significa que la instrucción está mal escrita. Un NameError significa que usaste un nombre que Python no conoce todavía.', code: 'print("Hola)        # falta cerrar comillas -> SyntaxError\nprint(nombre)       # nombre no existe -> NameError', caption: 'Dos errores típicos de la primera semana.', note: 'Lee el error de abajo hacia arriba: la última línea dice qué pasó y la anterior dónde.' },
  ],
  m02: [
    { title: 'Pensar en pasos', minutes: 7, intro: 'Antes de programar hay que saber resolver el problema a mano. Un algoritmo es esa solución escrita como una secuencia de pasos sin ambigüedad.', concept: 'Un buen algoritmo es preciso (cada paso se entiende de una sola manera), finito (termina) y efectivo (se puede ejecutar de verdad).', code: '1. Pedir las tres notas\n2. Sumar las tres notas\n3. Dividir la suma entre 3\n4. Mostrar el resultado', caption: 'Algoritmo en lenguaje natural para calcular un promedio.', note: 'Si no puedes explicar el problema en pasos, todavía no estás listo para codificarlo.' },
    { title: 'Pseudocódigo', minutes: 8, intro: 'El pseudocódigo está a medio camino entre el español y un lenguaje de programación. No tiene reglas estrictas, pero sí estructura.', concept: 'Se usan palabras como LEER, ESCRIBIR, SI y MIENTRAS para describir qué hace el algoritmo sin preocuparse por la sintaxis de un lenguaje.', code: 'LEER base\nLEER altura\narea <- base * altura\nESCRIBIR area', caption: 'Cálculo del área de un rectángulo en pseudocódigo.', note: 'Traducir pseudocódigo a Python es mecánico cuando el algoritmo está bien pensado.' },
    { title: 'Entradas, procesos y salidas', minutes: 6, intro: 'Casi todo programa se puede descomponer en tres partes: lo que recibe, lo que hace con eso y lo que entrega.', concept: 'Identificar entradas y salidas antes de escribir código te dice qué parámetros necesita tu función y qué debe devolver.', code: '# Entradas: base, altura\n# Proceso: multiplicar\n# Salida: área\ndef area_rectangulo(base, altura):\n    return base * altura', caption: 'Las tres partes mapeadas a una función.', note: 'Escribe entradas y salidas como comentario antes de empezar; te ahorra media hora de dudas.' },
  ],
  m03: [
    { title: 'Variables: cajas con nombre', minutes: 7, intro: 'Una variable guarda un valor en la memoria para poder usarlo después. El nombre es la etiqueta con la que lo recuperas.', concept: 'El signo = no significa igualdad matemática: significa «guarda el valor de la derecha en el nombre de la izquierda».', code: 'edad = 19\nnombre = "Camila"\nedad = edad + 1\nprint(nombre, edad)', caption: 'Una variable puede cambiar de valor durante el programa.', note: 'Usa nombres que expliquen el contenido: nota_final es mejor que x.' },
    { title: 'Tipos de datos básicos', minutes: 9, intro: 'No todos los valores se comportan igual. Python distingue entre números enteros, decimales, texto y valores lógicos.', concept: 'int, float, str y bool son los cuatro tipos con los que vas a trabajar todo el semestre. El tipo determina qué operaciones tienen sentido.', code: 'a = 7          # int\nb = 7.5        # float\nc = "7"        # str\nd = True       # bool\nprint(type(c))', caption: 'El 7 entero y el "7" de texto son cosas distintas.', note: 'Si "7" + 1 falla, no es un error de Python: es que sumaste texto con número.' },
    { title: 'Conversión de tipos', minutes: 6, intro: 'Los datos que llegan de un teclado o un archivo casi siempre son texto. Hay que convertirlos antes de calcular.', concept: 'int(), float() y str() convierten entre tipos. Si el texto no representa un número, la conversión falla con ValueError.', code: 'texto = "12"\nnumero = int(texto)\nprint(numero * 2)   # 24', caption: 'Convertir antes de operar.', note: 'Convierte al recibir el dato, no cuando ya lo estás usando en cuatro sitios.' },
  ],
  m04: [
    { title: 'Operadores aritméticos', minutes: 6, intro: 'Python resuelve las operaciones habituales y agrega dos muy útiles para programar: la división entera y el residuo.', concept: 'Los operadores + - * / ** // y % siguen la precedencia matemática: primero potencias, luego multiplicación y división, al final suma y resta.', code: 'print(7 / 2)    # 3.5\nprint(7 // 2)   # 3\nprint(7 % 2)    # 1\nprint(2 ** 5)   # 32', caption: 'El residuo (%) responde «¿cuánto sobra?».', note: 'Usa paréntesis cuando la precedencia no sea evidente para quien lea tu código.' },
    { title: 'Operadores de comparación', minutes: 6, intro: 'Comparar dos valores produce un resultado de tipo bool: True o False. Es la base de cualquier decisión.', concept: 'Los operadores == != < > <= >= no modifican nada: solo preguntan. Confundir = con == es el error más frecuente al empezar.', code: 'nota = 3.4\nprint(nota >= 3.0)   # True\nprint(nota == 5.0)   # False', caption: 'Una comparación es una pregunta cuya respuesta es True o False.', note: '= asigna, == compara.' },
    { title: 'Operadores lógicos', minutes: 7, intro: 'Cuando una decisión depende de más de una condición, los operadores lógicos las combinan.', concept: 'and exige que ambas condiciones sean verdaderas; or, que al menos una lo sea; not invierte el resultado.', code: 'edad = 20\ntiene_carnet = True\nprint(edad >= 18 and tiene_carnet)   # True\nprint(not tiene_carnet)              # False', caption: 'Combinar condiciones con and, or y not.', note: 'Si dudas del resultado, escribe una tabla de verdad con los casos posibles.' },
  ],
  m06: [
    { title: 'El ciclo for', minutes: 8, intro: 'Cuando sabes cuántas veces repetir algo, for es la herramienta. Evita escribir diez veces la misma línea.', concept: 'for recorre una secuencia y ejecuta el bloque indentado una vez por elemento. range(n) genera los números de 0 a n-1.', code: 'for i in range(1, 6):\n    print(i * i)', caption: 'Imprime los cuadrados de 1 a 5.', note: 'range(1, 6) incluye el 1 pero no el 6.' },
    { title: 'El ciclo while', minutes: 8, intro: 'while repite mientras una condición sea verdadera. Es útil cuando no sabes de antemano cuántas vueltas habrá.', concept: 'Dentro del ciclo debe cambiar algo que acerque la condición a False; si no, el programa nunca termina.', code: 'saldo = 100\nwhile saldo > 0:\n    saldo = saldo - 30\nprint(saldo)', caption: 'Termina cuando el saldo deja de ser positivo.', note: 'Un ciclo infinito casi siempre es una variable que olvidaste actualizar.' },
    { title: 'Acumuladores y contadores', minutes: 7, intro: 'Muchos problemas de ciclos se resuelven con una variable que va acumulando un resultado vuelta tras vuelta.', concept: 'Un contador suma 1 cada vez que algo ocurre; un acumulador suma el valor de cada elemento. Ambos se inicializan antes del ciclo.', code: 'total = 0\nfor n in [4, 8, 15]:\n    total += n\nprint(total)   # 27', caption: 'Acumulador clásico.', note: 'Inicializa dentro del ciclo y perderás el valor en cada vuelta.' },
  ],
  m07: [
    { title: 'Definir y llamar funciones', minutes: 8, intro: 'Una función es un bloque de código con nombre. Se define una vez y se usa tantas veces como se necesite.', concept: 'def crea la función; el nombre seguido de paréntesis la ejecuta. Lo que va dentro de los paréntesis son los parámetros.', code: 'def saludar(nombre):\n    print("Hola,", nombre)\n\nsaludar("Camila")', caption: 'Definición y llamada.', note: 'Define primero, llama después.' },
    { title: 'Retorno de valores', minutes: 8, intro: 'Mostrar en pantalla y devolver un valor son cosas distintas. Una función útil casi siempre devuelve su resultado.', concept: 'return entrega un valor a quien llamó la función y termina su ejecución. print solo lo muestra y no se puede reutilizar.', code: 'def cuadrado(x):\n    return x * x\n\nresultado = cuadrado(6)\nprint(resultado + 4)   # 40', caption: 'El valor devuelto se puede seguir usando.', note: 'Si tu función imprime en lugar de devolver, no podrás componerla con otras.' },
    { title: 'Parámetros por defecto', minutes: 6, intro: 'Un parámetro puede traer un valor por defecto para que quien llame la función no esté obligado a darlo.', concept: 'Se declara con = en la definición. Los parámetros con valor por defecto van siempre al final.', code: 'def saludo(nombre="estudiante"):\n    return "Hola, " + nombre\n\nprint(saludo())\nprint(saludo("Camila"))', caption: 'Una misma función, dos formas de llamarla.', note: 'Usa valores por defecto simples e inmutables (números, texto, None).' },
  ],
  m08: [
    { title: 'Listas', minutes: 8, intro: 'Una lista guarda varios valores en un orden, bajo un solo nombre.', concept: 'Se accede por posición empezando en 0. Se pueden agregar, quitar y recorrer elementos.', code: 'notas = [3.5, 4.0, 2.8]\nnotas.append(4.5)\nprint(notas[0], len(notas))', caption: 'Crear, agregar y consultar.', note: 'El último elemento está en la posición len(lista) - 1.' },
    { title: 'Recorrer y filtrar listas', minutes: 8, intro: 'Combinar listas con ciclos y condiciones cubre buena parte de los problemas de un primer curso.', concept: 'Recorres con for, decides con if y guardas lo que cumple en una lista nueva.', code: 'aprobadas = []\nfor nota in [3.5, 2.1, 4.0]:\n    if nota >= 3.0:\n        aprobadas.append(nota)\nprint(aprobadas)', caption: 'Filtrar notas aprobadas.', note: 'No modifiques una lista mientras la recorres; construye una nueva.' },
    { title: 'Conjuntos', minutes: 6, intro: 'Un conjunto es una colección sin orden ni elementos repetidos.', concept: 'Convertir una lista en set elimina los duplicados. Sirve para preguntar rápido si algo pertenece a un grupo.', code: 'codigos = [101, 102, 101, 103, 102]\nunicos = set(codigos)\nprint(len(unicos))   # 3', caption: 'Eliminar duplicados con set.', note: 'Un set no conserva el orden original.' },
  ],
}

const m05: Lesson[] = [
  {
    id: 'm05-l1', moduleId: 'm05', order: 1, title: 'Decidir con if', minutes: 8, published: true,
    blocks: [
      { type: 'p', text: 'Hasta ahora tus programas ejecutaban todas las líneas, siempre en el mismo orden. Un programa útil necesita decidir: hacer una cosa si se cumple una condición y otra si no.' },
      { type: 'h', id: 'condicion', text: 'La condición' },
      { type: 'p', text: 'Una condición es una expresión que se evalúa como True o False. Si es verdadera, se ejecuta el bloque indentado debajo del if; si es falsa, ese bloque se omite.' },
      { type: 'code', code: 'temperatura = 31\n\nif temperatura > 30:\n    print("Hace calor, hidrátate")\n\nprint("Fin del programa")', caption: 'La segunda línea de salida aparece siempre; la primera, solo si la condición se cumple.', lang: 'python' },
      { type: 'callout', title: 'La indentación es sintaxis', text: 'En Python, los cuatro espacios debajo del if marcan qué instrucciones pertenecen al bloque. Sin ellas, el programa falla o hace algo distinto a lo que querías.' },
      { type: 'h', id: 'flujo', text: 'El flujo de ejecución' },
      { type: 'flow', caption: 'Un if con una sola rama: si la condición no se cumple, el programa continúa sin hacer nada.', steps: [
        { kind: 'start', label: 'Inicio' },
        { kind: 'decision', label: 'temperatura > 30', yes: 'Mostrar aviso', no: 'Continuar' },
        { kind: 'end', label: 'Fin' },
      ] },
      { type: 'h', id: 'errores', text: 'Errores frecuentes' },
      { type: 'list', items: ['Olvidar los dos puntos al final de la línea del if.', 'Usar = (asignación) cuando querías == (comparación).', 'Escribir el bloque sin indentar.'] },
    ],
  },
  {
    id: 'm05-l2', moduleId: 'm05', order: 2, title: 'if, elif y else', minutes: 10, published: true,
    blocks: [
      { type: 'p', text: 'Con un if solo puedes reaccionar a un caso. Cuando hay varias salidas posibles, necesitas encadenar condiciones y decidir qué hacer si ninguna se cumple.' },
      { type: 'h', id: 'else', text: 'else: el camino alternativo' },
      { type: 'p', text: 'else se ejecuta cuando la condición del if fue falsa. No lleva condición propia porque cubre «todo lo demás».' },
      { type: 'code', code: 'def es_par(n):\n    if n % 2 == 0:\n        return True\n    else:\n        return False', caption: 'Dos caminos mutuamente excluyentes.', lang: 'python' },
      { type: 'h', id: 'elif', text: 'elif: varias condiciones en cadena' },
      { type: 'p', text: 'Python evalúa las condiciones de arriba hacia abajo y ejecuta solo el primer bloque cuya condición sea verdadera. Por eso el orden importa.' },
      { type: 'code', code: 'def categoria(nota):\n    if nota >= 4.5:\n        return "Excelente"\n    elif nota >= 3.5:\n        return "Bueno"\n    elif nota >= 3.0:\n        return "Aprobado"\n    else:\n        return "Reprobado"', caption: 'Una nota de 4.7 cumple las tres primeras condiciones, pero solo se ejecuta la primera.', lang: 'python' },
      { type: 'callout', title: 'Ordena de lo más específico a lo más general', text: 'Si escribes primero nota >= 3.0, ninguna nota alta llegará a las ramas siguientes.' },
      { type: 'flow', caption: 'Cadena if / elif / else sobre una nota.', steps: [
        { kind: 'start', label: 'Inicio' },
        { kind: 'decision', label: 'nota >= 4.5', yes: '«Excelente»', no: 'Siguiente' },
        { kind: 'decision', label: 'nota >= 3.0', yes: '«Aprobado»', no: '«Reprobado»' },
        { kind: 'end', label: 'Fin' },
      ] },
    ],
  },
  {
    id: 'm05-l3', moduleId: 'm05', order: 3, title: 'Condiciones compuestas', minutes: 9, published: true,
    blocks: [
      { type: 'p', text: 'Muchas decisiones reales dependen de más de un dato. Para combinarlos usas los operadores lógicos que viste en el módulo anterior.' },
      { type: 'h', id: 'and-or', text: 'and, or y not dentro de un if' },
      { type: 'code', code: 'def puede_inscribirse(edad, tiene_documento):\n    if edad >= 16 and tiene_documento:\n        return True\n    return False', caption: 'Ambas condiciones deben cumplirse.', lang: 'python' },
      { type: 'p', text: 'También puedes anidar un if dentro de otro, pero suele ser más legible combinar las condiciones en una sola línea con and.' },
      { type: 'code', code: '# Anidado: más difícil de leer\nif edad >= 16:\n    if tiene_documento:\n        print("Puede inscribirse")\n\n# Equivalente, más claro\nif edad >= 16 and tiene_documento:\n    print("Puede inscribirse")', lang: 'python' },
      { type: 'callout', title: 'Evaluación en cortocircuito', text: 'En una condición con and, si la primera parte es falsa, Python ya no evalúa la segunda. Con or ocurre lo contrario cuando la primera es verdadera.' },
    ],
  },
  build('m05', 4, { title: 'Resumen y buenas prácticas', minutes: 5, intro: 'Para cerrar el módulo, repasa cómo escribir condicionales que otra persona (o tú dentro de un mes) pueda entender.', concept: 'Condiciones claras, un solo nivel de anidación cuando sea posible y nombres que describan la pregunta: es_par, tiene_saldo, puede_votar.', code: 'def puede_votar(edad, es_ciudadano):\n    return edad >= 18 and es_ciudadano', caption: 'Una condición compuesta puede devolverse directamente, sin if.', note: 'Si un if solo devuelve True o False, puedes devolver la condición misma.' }),
]

export const lessonsSeed: Lesson[] = [
  ...(['m01', 'm02', 'm03', 'm04'] as const).flatMap((m) => compact[m].map((c, i) => build(m, i + 1, c))),
  ...m05,
  ...(['m06', 'm07', 'm08'] as const).flatMap((m) => compact[m].map((c, i) => build(m, i + 1, c))),
]
