# Diseño e Implementación de una Plataforma Educativa para la Enseñanza de Programación Básica en la UPTC

Michael Esteban Chia Gil
Sebastian Adolfo Suarez Garces
Ingeniería de sistemas 

Universidad Pedagógica y Tecnológica de Colombia
Sogamoso, Boyacá

# GLOSARIO
### Algoritmo
Secuencia finita, ordenada y no ambigua de pasos lógicos que describen el procedimiento necesario para resolver un problema o realizar una tarea específica. Un algoritmo debe cumplir las propiedades de precisión, determinismo y efectividad, y puede representarse mediante pseudocódigo, diagramas de flujo u otros modelos formales.

### Programación
Proceso sistemático de análisis, diseño, codificación, prueba y mantenimiento de instrucciones escritas en un lenguaje de programación, con el fin de desarrollar software capaz de ejecutar tareas específicas en un sistema computacional. Involucra la aplicación de principios de lógica, estructuras de datos y paradigmas de desarrollo.

### Plataforma educativa
Sistema digital integrado que proporciona herramientas, recursos y funcionalidades orientadas a facilitar el proceso de enseñanza-aprendizaje. Incluye módulos de gestión de contenidos, evaluación, seguimiento del progreso y comunicación entre usuarios, permitiendo la interacción estructurada en entornos virtuales de aprendizaje.

### Sistema de Gestión del Aprendizaje (LMS)
Plataforma tecnológica que administra, distribuye y monitorea procesos formativos en entornos virtuales, integrando herramientas de contenido, evaluación y seguimiento académico.

### Lógica de programación
Conjunto de habilidades cognitivas y principios formales que permiten estructurar soluciones a problemas computacionales de manera coherente, secuencial y eficiente. Implica el uso de estructuras de control, variables, operadores y abstracciones para modelar procesos mediante algoritmos.

### Interfaz
Conjunto de elementos visuales y funcionales que permiten la interacción entre el usuario y un sistema informático. Puede incluir componentes gráficos, textuales y multimedia organizados bajo principios de usabilidad, accesibilidad y experiencia de usuario (UX).

### Aprendizaje autónomo
Proceso formativo en el cual el estudiante asume la responsabilidad de planificar, regular y evaluar su propio aprendizaje, gestionando recursos y tiempos de manera independiente, apoyado en herramientas tecnológicas que facilitan el acceso a contenidos y retroalimentación.

### Angular
Framework de desarrollo web de código abierto basado en TypeScript, mantenido por Google, orientado a la construcción de aplicaciones web dinámicas de una sola página (SPA). Se fundamenta en una arquitectura basada en componentes y en el patrón Modelo-Vista-Controlador (MVC), incorporando herramientas para el manejo de rutas, inyección de dependencias, enlace bidireccional de datos y consumo de servicios mediante HTTP. Facilita el desarrollo estructurado, modular y escalable de interfaces de usuario.

[1. INTRODUCCIÓN	4](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.vwgq2p19hf4e)
[**1.1. Descripción del problema	4**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.i2srsms67i06)
[1.2. Formulación	4](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.n2rrwcr43fby)
[1.3. Justificación	5](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.rl6w67y9nli4)
[1.4. Estado del Arte	5](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.m4cqw9sibldh)
[1.5 Objetivos	7](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.6sj7t6gijrpb)
[1.5.1 Objetivo general	7](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.damzvbubccvu)
[1.5.2 Objetivos específicos	7](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.yr1xtev06nia)
[**2. MARCO REFERENCIAL	7**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.rzo5rshxq767)
[2.1. Marco Teórico	8](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.7taz9s555fv1)
[2.2 Marco Conceptual	9](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.vofhnd9quu5z)
[**3. METODOLOGÍAS	9**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.3lhmg1ay2yvl)
[3.1 Metodología de Software	9](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.u1qfnxt4vbfb)
[3.2 Modelo - método	10](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.vw1d8i95uynf)
[3.3 Sistema Actual	10](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.1dvxc1iiqizw)
[3.4 Sistema propuesto	10](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.77rjo91n9p4e)
[**4. Requisitos	11**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.d1vm258i75fc)
[Requisitos funcionales	11](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.bp68u15pggwy)
[Requisitos no funcionales	11](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.w37yyoyu43aa)
[4.1 Historias de Usuario	11](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.p3ckmxt0442z)
[**5. Diseño de software	12**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.ioqeg6cda93n)
[5.1 Modelo entidad relación Físico, Lógico	14](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.c1lutdvei1c)
[5.2 Diccionario de datos	14](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.kj9anh2pgw07)
[**6. Prototipo del Software	14**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.nsgzhi8a3gao)
[6.1 Prototipos de administrador	14](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.vm9xvm788m9o)
[6.2 Prototipos de usuario (estudiante)	15](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.enly61uf2fw9)
[**7. Uml2	15**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.wi4vayw0db80)
[**8. Arquitectura de Software	17**](https://docs.google.com/document/d/1od7B9GpARIYsrxNJFyv24KIUFVLqUPjIIZx2zr1R78w/edit?tab=t.0#heading=h.juk3b996nfpg)

##

1.

# **INTRODUCCIÓN**

La programación es una competencia esencial en la enseñanza de Ingeniería de Sistemas, e incluso más en los primeros semestres académicos, donde se fundamentan los conocimientos conceptuales y lógicos del desarrollo de software; no obstante, la enseñanza inicial a menudo presenta dificultades, bien sea por nivel de abstracción al que se debe llegar, la rigidez lógica en que se basa, o por la necesidad de practicar continuamente.
En la Universidad Pedagógica y Tecnológica de Colombia (UPTC), la programación básica representa un desafío para los alumnos por las dificultades que se presentan al intentar entender sus conceptos fundamentales, en la resolución de problemas y también en la práctica de estos conocimientos. La dificultad en la programación puede desembocar en desinterés por aprender, o en un escaso rendimiento académico e incluso en la deserción.
El objetivo general del proyecto es reforzar las competencias lógicas y técnicas de los estudiantes, para poder llevar a cabo un aprendizaje autónomo, dinámico y significativo que sirva de apoyo al rendimiento académico en programación básica.

## 1.1. Descripción del problema

En los semestres iniciales del programa de Ingeniería de Sistemas de la UPTC, los estudiantes tienen dificultades para aprender programación básica y desarrollar su lógica. Estas dificultades se relacionan con la poca práctica y la complejidad de los conceptos, la escasez de recursos interactivos y la falta de soporte adicional.
La carencia de una herramienta digital institucional orientada inequívocamente al refuerzo práctico de fundamentos de programación básica reduce las posibilidades de aprendizaje autodidacta y práctico. De este modo, hay un grupo de alumnos que muestra bajo rendimiento académico, frustración hacia la asignatura y problemas para avanzar en las asignaturas siguientes.

## 1.2. Formulación

**Problema central:**
Los semestres iniciales del programa de Ingeniería de Sistemas en la UPTC han sido víctimas de contrariedades muy notorias a la hora de aprender programación básica, en especial en el desarrollo del pensamiento lógico, en la construcción de algoritmos y en la correcta aplicación de las estructuras fundamentales. Las contrariedades se encuentran ligadas a la complejidad propia de los conceptos iniciales, al nivel de abstracción necesario y a la práctica, entre otras cosas, de modo a lograr interiorizar el conocimiento.
**Pregunta de Investigación:**
¿Cómo puede el diseño e implementación de una plataforma educativa contribuir al fortalecimiento del aprendizaje de programación básica en los estudiantes de Ingeniería de Sistemas de la UPTC?

## 1.3. Justificación

El perfil de entrada a la ingeniería en sistemas de la UPTC indica que la programación básica es una materia que se enseña para que el estudiante pueda adquirir los fundamentos de conceptos más complejos del plan de estudios. En este caso, el contexto refleja que durante el primer semestre se evidencia ciertas dificultades por parte de los estudiantes en cuanto a la lógica, la construcción de algoritmos y la resolución de ejercicios de programación relacionados con los aspectos más elementales de los conceptos.
En respuesta a ello se plantea el diseño y la implementación de una plataforma para aprender, entendida como un recurso complementario a la enseñanza presencial que permitirá reforzar los contenidos utilizando recursos organizados que integren el trabajo práctico para propiciar el aprendizaje autónomo y un refuerzo de las competencias básicas de programación en el contexto académico de la UPTC.

## 1.4. Estado del Arte

A continuación, se presenta un estado del arte sobre sistemas de evaluación formativa y andamiaje tecnológico para la enseñanza de programación. Esto no es más que una revisión organizada de lo que se ha publicado académicamente sobre el tema, con el fin de identificar en qué coinciden los autores, qué herramientas han documentado y hacia dónde va la investigación en este momento.
Para armar esta revisión se usaron 20 referencias con ISSN, centradas en tres ejes: evaluación automática con retroalimentación semántica, asistentes inteligentes para resolución de dudas y estrategias de gamificación aplicadas a la educación en ciencias de la computación. El análisis se divide en dos partes: primero un cuadro donde cada referencia se resume en su aporte técnico o metodológico, y después una síntesis que extrae los puntos en común: componentes del andamiaje, herramientas típicas y limitaciones que varios autores señalan.

| **N°** | **Referencia (Autor, Año)**                                                                      | **Título**                                                                                                            | **ISSN**             | **Aportes técnicos y metodológicos (versión corta)**                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Cipriano, B. P.; Fachada, N.; Alves, P. (2022)                                                   | Drop Project: An automatic assessment tool for programming assignments                                                | 2352-7110            | Herramienta de evaluación automática con pruebas unitarias y compilación. Retroalimentación rápida y soporte para múltiples actividades. Base para implementar ejercicios prácticos y corrección automática.                                              |
| 2      | Leytón-Yela, G. V.; Bucheli-Guerrero, V. A.; Ordoñez-Erazo, H. A. (2022)                         | Herramientas usadas para la evaluación formativa automatizada en cursos de programación asistidos por computadora     | 0124-2253; 2344-8350 | Analiza UNCode, Ask-Elle y Nbgrader. Diferencia evaluación sumativa y formativa, destacando la retroalimentación con sugerencias de mejora. Criterios para diseñar mecanismos de retroalimentación efectiva.                                              |
| 3      | Barczak, A. L. C.; Mathrani, A.; Han, B.; Reyes, N. H. et al. (2023)                             | Automated assessment system for programming courses: a case study for teaching data structures and algorithms         | 1042-1629; 1556-6501 | Sistema con niveles de prueba y control de errores (ciclos infinitos). Integra aprendizaje experiencial. Elementos para diseñar ejercicios progresivos alineados con objetivos.                                                                           |
| 4      | Coelho, R. C.; Marques, M. F. P.; Oliveira, T. (2023)                                            | Mobile Learning Tools to Support in Teaching Programming Logic and Design: A Systematic Literature Review             | 1648-5831; 2335-8971 | Revisión sistemática de herramientas móviles para lógica y diseño. Identifica herramientas gratuitas que mejoran aprendizaje, participación y motivación. Evidencia el valor de recursos interactivos como complemento presencial.                        |
| 5      | Malik, S. I.; Ashfque, M. W.; Tawafak, R. M.; Alfarsi, G. M. et al. (2022)                       | A Chatbot to Facilitate Student Learning in a Programming 1 Course                                                    | 1947-8518; 1947-8526 | Chatbot de apoyo para sintaxis, semántica, resolución de problemas y errores frecuentes. Modelo de asistencia automatizada integrable en plataformas educativas.                                                                                          |
| 6      | Cheang, B.; Kurnia, A.; Lim, A.; Oon, W. C. (2003)                                               | On automated grading of programming assignments in an academic institution                                            | 0360-1315; 1873-782X | Implementación de Online Judge para calificación automática. Evidencia que aumenta la práctica y reduce la carga docente, permitiendo más envíos.                                                                                                         |
| 7      | Hao, Q.; Smith, D. H.; Ding, L.; Ko, A.; Ottaway, C.; Wilson, J. et al. (2022)                   | Towards Understanding the Effective Design of Automated Formative Feedback for Programming Assignments                | 0899-3408; 1744-5175 | Estudia la retroalimentación formativa automática y su interacción con estudiantes. Criterios metodológicos para diseñar mensajes de error y recomendaciones claras para principiantes.                                                                   |
| 8      | Ribeiro, R. B. S.; Carvalho, L. S. G.; Oliveira, D. B. F.; Oliveira, E. H. T.; Pessoa, M. (2020) | Investigação Empírica sobre os Efeitos da Gamificação de um Juiz Online em uma Disciplina de Introdução à Programação | 2319-5104            | Juez online con gamificación para principiantes. Analiza desempeño, motivación y experiencia. Estrategias para incorporar gamificación en sistemas de evaluación y aumentar la participación.                                                             |
| 9      | García-Mateos, G.; Fernández-Alemán, J. L. (2009)                                                | Apañando el aprendizaje de programación mediante un juez online                                                       | 1137-3601            | Juez online para resolver problemas con retroalimentación automática. Aporta el concepto de múltiples oportunidades de práctica y evaluación como complemento a la enseñanza tradicional.                                                                 |
| 10     | Bellas, A. D. (2021)                                                                             | Codeo - Learning support research: use of automated feedback within undergraduate programming education, a case study | 1754-6692            | Prototipo web con pruebas unitarias y retroalimentación automática. Usa encuestas, entrevistas y desarrollo iterativo para evaluar la herramienta. Metodología que combina desarrollo de software educativo con evaluación de la experiencia del usuario. |

## 1.5 Objetivos

### 1.5.1 Objetivo general

Crear una plataforma educativa que sustenta el proceso de enseñanza-aprendizaje de programación básica a los estudiantes de Ingeniería de Sistemas de la UPTC, reforzando sus habilidades lógicas y técnicas a través de la utilización de recursos interactivos y espacios de práctica autónoma

### 1.5.2 Objetivos específicos

1. Analizar las principales dificultades que presentan los estudiantes en el aprendizaje de programación básica para definir los requerimientos funcionales de la plataforma.
2. Diseñar la arquitectura y la estructura funcional de la plataforma educativa, definiendo sus módulos, interfaz y organización de contenidos.
3. Desarrollar los módulos principales de la plataforma, incluyendo gestión de contenidos, ejercicios prácticos y mecanismos de retroalimentación.
4. Implementar una interfaz intuitiva y accesible que facilite la interacción del usuario y promueva la usabilidad del sistema.
5. Evaluar el funcionamiento de la plataforma mediante pruebas básicas que permitan verificar el cumplimiento de los requerimientos definidos.

# 2. MARCO REFERENCIAL

El presente proyecto es desarrollado en el contexto del programa de Ingeniería de Sistemas de la Universidad Pedagógica y Tecnológica de Colombia (UPTC). En dicho contexto de su plan de estudios, la programación básica es una materia determinante en los primeros semestres académicos, ya que proporciona las bases conceptuales que serán útiles en las materias posteriores relacionadas con estructuras de datos, desarrollo de aplicaciones e ingeniería de software.
En el contexto académico del programa, se ha podido evidenciar que los estudiantes que empiezan su formación docente presentan dificultades en conocer lo relacionado con los fundamentos de programación, sobre todo en lo concerniente a la lógica, la estructuración de algoritmos y la puesta en la práctica de los conceptos que teóricamente se entienden. Estas dificultades pueden ser consideradas como parte del contexto educativo en el que se ubica la propuesta de este proyecto.
En un contexto tecnológico, el uso de plataformas educativas digitales se puede considerar como una estrategia que se usa con mucha frecuencia en los procesos de enseñanza presencial, ya que estas plataformas permiten mezclar contenidos, ejercicios prácticos y mecanismo de seguimiento, en una estructura virtual enmarcada por el uso específico de soporte educativo. En este sentido, cabe situar el proyecto en la tendencia que incorpora soluciones tecnológicas al proceso de reforzar el aprendizaje.
Desde el punto de vista académico e institucional, el desarrollo de esta plataforma se alinea con el propósito de mejorar los procesos formativos mediante el uso de herramientas digitales que faciliten el acceso a recursos organizados y fomenten el aprendizaje autónomo. El proyecto se ubica, por tanto, en la intersección entre la educación en programación y el desarrollo de sistemas informáticos, aplicando principios de ingeniería de software en un contexto universitario real.

## 2.1. Marco Teórico

El presente proyecto se fundamenta en tres ejes conceptuales principales: la enseñanza de la programación, el aprendizaje autónomo en entornos digitales y los principios de la ingeniería de software aplicados al desarrollo de plataformas educativas.

- **Aprendizaje autónomo y entornos virtuales**

El aprendizaje autónomo y los entornos virtuales
El aprendizaje autónomo es entendido como la habilidad que debe tener un alumno para manejar su formación, controlando tiempos, recursos y estrategias de estudio. En la actualidad, las plataformas digitales de educación han pasado a ser medios que permiten la práctica del aprendizaje autónomo, en el sentido de que son capaces de facilitar el acceso permanente a contenidos, ejercicios o actividades interactivas.
Un entorno virtual de aprendizaje permite la enseñanza cara a cara (o presencial), pero contempla espacios de práctica estructurada, pero muy organizada, que permiten mejorar la comprensión progresiva de los temas. Permite la práctica de actividades, favoreciendo la repetición, la experimentación y la conceptualización.

- **Ingeniería de software aplicada a plataformas educativas**

Desde una perspectiva de ingeniería de software, en el desarrollo de una plataforma educativa hay que seguir un proceso sistemático de análisis de requerimientos, diseño arquitectónico y desarrollo estructurado, por medio del que se llevan a cabo conceptos como la modularidad, la usabilidad, la escalabilidad y la mantenibilidad, para garantizar que el sistema cumpla su función y que pueda introducir evoluciones a lo largo del tiempo.
La arquitectura del software establece la organización de los componentes del sistema y las relaciones que van a darse entre ellos, permitiendo estructurar correctamente módulos como la gestión de los contenidos, ejercicios prácticos o el seguimiento del progreso, así como la aplicación de los principios de diseño centrado en el usuario para ayudar a conseguir una mejora en la experiencia de la interacción y la efectividad del sistema.

## 2.2 Marco Conceptual

Para que el proyecto tenga sentido y todos hablemos el mismo idioma, vale la pena aclarar algunos términos clave que van apareciendo a lo largo del documento. No es un glosario cerrado, sino más bien un conjunto de definiciones operativas que ayudan a entender qué significa cada cosa en el contexto de la plataforma que estamos construyendo.

**Algoritmo**
Básicamente, es una receta: una secuencia de pasos bien definidos, en orden y sin ambigüedades, que resuelve un problema o ejecuta una tarea. Tiene que ser precisa, determinista y efectiva. Puede escribirse en pseudocódigo, dibujarse en un diagrama de flujo o representarse de otras formas. En la plataforma, es el corazón de lo que los estudiantes van a practicar.
**Plataforma educativa**
Un sistema digital que reúne herramientas, contenidos y funcionalidades para facilitar la enseñanza y el aprendizaje. Tiene módulos para organizar materiales, evaluar, hacer seguimiento y comunicarse. En este caso, la plataforma no pretende reemplazar al profesor ni a la clase presencial, sino complementarlos con un espacio donde el estudiante pueda practicar y equivocarse sin presión.
**Sistema de Gestión del Aprendizaje (LMS)**
Es el tipo de plataforma que usan las universidades para administrar cursos virtuales: subir contenidos, hacer quizzes, llevar notas, etc. Lo que estamos construyendo no es exactamente un LMS, pero toma prestadas algunas de sus funcionalidades, como la organización de contenidos y el seguimiento del progreso.
**Gamificación**
Agarrar elementos de los juegos —puntos, niveles, insignias, retos— y meterlos en un contexto que no es un juego, como una plataforma educativa. La idea es que el estudiante se enganche, que quiera seguir practicando y que vea el aprendizaje como un reto, no como una obligación.
**Aprendizaje autónomo**
Que el estudiante sea dueño de su propio proceso: que planifique, que regule sus tiempos, que busque recursos y que evalúe su propio progreso. La plataforma está pensada para facilitar esto, dando acceso a contenidos y devoluciones en cualquier momento, para que cada quien avance a su ritmo.

# 3. METODOLOGÍAS

## 3.1 Metodología de Software

Para el desarrollo de la plataforma se definió Scrum como marco de trabajo ágil, principalmente porque nos permite movernos rápido sin tener que atar todos los requisitos desde el arranque. En proyectos de este tipo, donde las necesidades pueden ir ajustándose sobre la marcha y donde es vital recibir impresiones de los usuarios en etapas tempranas, trabajar con sprints cortos y revisiones periódicas nos da una flexibilidad que metodologías más predictivas no nos ofrecen. Además, poder entregar incrementos funcionales en ciclos de dos a tres semanas nos permite validar con estudiantes y docentes que lo que estamos construyendo realmente responde a lo que se necesita, y no darnos cuenta tarde de que nos desviamos del objetivo.
Por otro lado, Scrum se adapta bien al tamaño del equipo de desarrollo y a su capacidad de autoorganización sin necesidad de procesos pesados. Las ceremonias propias del marco —planificación del sprint, daily stand-ups, revisiones y retrospectivas— nos ayudan a mantener la alineación, a destapar riesgos con anticipación y a ajustar el rumbo de manera continua. Al final del día, la apuesta no es solo entregar una plataforma que funcione, sino hacerlo con un proceso que nos permita aprender mientras avanzamos y responder de manera efectiva a las dinámicas propias del contexto académico de la UPTC.
**Arquitectura Scrum**
**Roles: **

| **Rol**          | **Quién lo asume**              | **Qué hace en el proyecto**                                                                                                            |
| ---------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Product Owner    | El docente asesor               | Decide qué funcionalidades van primero. Valida lo que el equipo entrega en cada avance.                                                |
| Scrum Master     | Un estudiante del equipo        | Se asegura de que las reuniones se hagan. Se comunica directamente con el docente para coordinar las actividades de cada sprint.       |
| Development Team | Los estudiantes desarrolladores | Programan el frontend en React, configuran n8n, diseñan la base de datos MySQL. Se organizan para repartirse el trabajo de cada sprint |

## 3.2 Modelo - método 

El ciclo de trabajo sigue el modelo estándar de Scrum: un Product Backlog priorizado por el Product Owner alimenta cada Sprint Backlog, que el Development Team ejecuta en sprints de una a dos semanas cerrados con un incremento funcional. La priorización usa criterios de valor académico (qué tanto reduce la dificultad reportada por los estudiantes) y de dependencia técnica (qué módulos habilitan a los demás, por ejemplo autenticación antes que seguimiento de progreso). Cada incremento debe ser desplegable de forma independiente, lo que obliga a mantener los módulos razonablemente desacoplados desde el diseño.

## 3.3 Sistema Actual

La UPTC por el momento carece de una herramienta institucional destinada al soporte práctico en programación básica. En efecto, el soporte para el estudiante es único y exclusivamente propio de la clase presencial, guías de ejercicios en PDF y recursos externos sueltos (YouTube, plataformas genéricas como Codecademy o HackerRank), por tanto no hay integración de la misma con el curso ni con el avance del estudiante. Cuando ocurre esto, no habrá retroalimentación inmediata de los ejercicios, ausencia de seguimiento del avance por parte del docente fuera de las evaluaciones formales y, por supuesto, ningún recurso de soporte motivacional alternativo (gamificación).

## 3.4 Sistema propuesto

La propuesta de esta plataforma integra cuatro módulos: el módulo de gestión de contenidos (unidades y lecciones definidas por el docente), el módulo de ejercicios prácticos con retroalimentación automática, el módulo de recapitulación de progreso por estudiante y un módulo de gamificación (puntos, insignias) para promover la práctica autónoma. La solución técnica propuesta plantea un frontend en React, un backend de automatización de flujos y notificaciones en n8n y la persistencia en el formato de MySQL. El sistema no hace que se pierda la clase presencial de forma presencial, sino que es una actividad que complementa dicho espacio de práctica libre.

# 4. Requisitos

A partir de los objetivos específicos y del diagnóstico de la sección 3.4 se derivan los siguientes requerimientos funcionales y no funcionales.

### Requisitos funcionales

| **ID**    | **Requerimiento**                                                                     |
| --------- | ------------------------------------------------------------------------------------- |
| **RF-01** | Registro y autenticación de usuarios con roles Estudiante y Administrador/Docente.    |
| **RF-02** | Gestión (crear, editar, publicar) de módulos y lecciones de contenido por el docente. |
| **RF-03** | Creación y resolución de ejercicios prácticos con validación automática de respuesta. |
| **RF-04** | Registro y visualización del progreso individual del estudiante por módulo.           |
| **RF-05** | Asignación de puntos e insignias según avance y desempeño (gamificación).             |
| **RF-06** | Generación de reportes de avance para el docente por estudiante y por grupo.          |

### Requisitos no funcionales

| **ID**     | **Requerimiento**                                                                        |
| ---------- | ---------------------------------------------------------------------------------------- |
| **RNF-01** | Usabilidad: interfaz navegable sin capacitación previa (máx. 3 clics a un ejercicio).    |
| **RNF-02** | Disponibilidad: acceso vía navegador, sin instalación de software adicional.             |
| **RNF-03** | Tiempo de respuesta de corrección automática inferior a 3 segundos por ejercicio simple. |
| **RNF-04** | Escalabilidad modular: nuevos módulos de contenido sin modificar el núcleo del sistema.  |

## 4.1 Historias de Usuario 

| **Rol**        | **Historia**                                                                                                                             | **Criterio de aceptación**                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Estudiante** | Como estudiante quiero registrarme e iniciar sesión para acceder a mi progreso personal.                                                 | El sistema valida credenciales y redirige al panel del estudiante.                             |
| **Estudiante** | Como estudiante quiero resolver ejercicios prácticos y recibir retroalimentación inmediata para corregir errores sin esperar al docente. | Al enviar una solución, el sistema responde correcto/incorrecto con una pista en menos de 3 s. |
| **Estudiante** | Como estudiante quiero ver mi progreso y mis insignias para mantenerme motivado.                                                         | El panel muestra % de avance por módulo y las insignias obtenidas.                             |
| **Docente**    | Como docente quiero crear y organizar módulos de contenido para estructurar el curso.                                                    | Puedo crear, ordenar y publicar/despublicar un módulo con al menos una lección.                |
| **Docente**    | Como docente quiero definir ejercicios con su solución esperada para habilitar la corrección automática.                                 | El ejercicio queda validado por al menos un caso de prueba antes de publicarse.                |
| **Docente**    | Como docente quiero ver reportes de avance de mis estudiantes para identificar quién necesita refuerzo.                                  | El reporte lista estudiantes con % de avance y última actividad.                               |

# 5. Diseño de software

Se describe la estructura arquitectónica de la plataforma, la organización de sus componentes y su relación, en este caso a manera de módulos.

**Modularidad**

| **Dominio**               | **Responsabilidades**                                                                                         | **Interfaces expuestas**                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Estudiante**            | Gestión de acceso a contenidos, realización de actividades y seguimiento del progreso académico del usuario.  | Consulta de contenidos, acceso a actividades, visualización de resultados y progreso.        |
| **Gestión de Contenidos** | Administración de materiales educativos: ejercicios, tareas, documentos y recursos de aprendizaje.            | Creación, actualización, eliminación y consulta de contenidos educativos.                    |
| **Administración**        | Gestión global del sistema, control de usuarios, configuración de módulos y supervisión de la plataforma.     | Gestión de usuarios, configuración del sistema, control de permisos y monitoreo de módulos.  |
| **Evaluación**            | Administración de evaluaciones, registro de calificaciones y generación de resultados académicos.             | Creación de evaluaciones, registro de notas, consulta de resultados y reportes de desempeño. |
| **Tutor**                 | Gestión de contenidos y actividades destinadas a los estudiantes; supervisión del progreso y apoyo académico. | Publicación de contenidos, asignación de actividades, consulta de progreso de estudiantes.   |
| **Foros y Discusión**     | Facilitación de la interacción entre usuarios mediante debates, comentarios y discusión sobre los contenidos. | Creación de temas, publicación de comentarios, respuesta a discusiones y consulta de foros.  |

### image

En esta imagen se pueden apreciar de manera gráfica los módulos del sistema descritos de forma sencilla para una mejor comprensión.

**Matriz de relación entre módulos**

| **Origen**         | **Destino**           | **Tipo**      | **Descripción**                                                                      |
| ------------------ | --------------------- | ------------- | ------------------------------------------------------------------------------------ |
| **Estudiante**     | Gestión de Contenidos | Consulta      | El estudiante accede y visualiza los contenidos educativos disponibles.              |
| **Estudiante**     | Evaluación            | Solicitud     | El estudiante realiza actividades, evaluaciones o tareas asignadas.                  |
| **Tutor**          | Gestión de Contenidos | Gestión       | El tutor crea, actualiza o elimina contenidos educativos para los estudiantes.       |
| **Tutor**          | Evaluación            | Registro      | El tutor registra o revisa calificaciones y resultados de las actividades.           |
| **Estudiante**     | Foros y Discusión     | Participación | Los estudiantes publican preguntas, comentarios o responden en discusiones.          |
| **Tutor**          | Foros y Discusión     | Moderación    | El tutor guía, responde dudas y modera las discusiones académicas.                   |
| **Administración** | Todos los módulos     | Control       | Gestión y supervisión del funcionamiento general del sistema y permisos de usuarios. |
| **Evaluación**     | Estudiante            | Notificación  | Publicación de resultados, calificaciones y retroalimentación para el estudiante.    |

## 5.1 Modelo entidad relación Físico, Lógico

A nivel lógico el modelo gira en torno a seis entidades: Usuario (con un Rol asociado: estudiante o docente), Módulo, Lección, Ejercicio, Intento (la entrega de un estudiante a un ejercicio, con resultado y retroalimentación asociada) e Insignia (con una tabla intermedia Usuario_Insignia por ser relación muchos-a-muchos). Las relaciones principales son: un Módulo tiene muchas Lecciones; una Lección tiene muchos Ejercicios; un Usuario genera muchos Intentos; y un Intento pertenece a un único Ejercicio y a un único Usuario. A nivel físico el modelo se implementa en MySQL en tercera forma normal, con claves foráneas e índices sobre usuario_id y ejercicio_id en la tabla Intento, que es la de mayor volumen de escritura.

## 5.2 Diccionario de datos 

| **Entidad**   | **Atributo**      | **Tipo**     | **Descripción**                    |
| ------------- | ----------------- | ------------ | ---------------------------------- |
| **Usuario**   | id_usuario (PK)   | INT          | Identificador único.               |
| **Usuario**   | correo            | VARCHAR(120) | Correo institucional, único.       |
| **Usuario**   | rol               | ENUM         | 'estudiante' o 'docente'.          |
| **Modulo**    | id_modulo (PK)    | INT          | Identificador único.               |
| **Modulo**    | titulo            | VARCHAR(100) | Nombre del módulo.                 |
| **Ejercicio** | id_ejercicio (PK) | INT          | Identificador único.               |
| **Ejercicio** | id_leccion (FK)   | INT          | Lección a la que pertenece.        |
| **Ejercicio** | enunciado         | TEXT         | Descripción del problema.          |
| **Intento**   | id_intento (PK)   | INT          | Identificador único.               |
| **Intento**   | id_usuario (FK)   | INT          | Estudiante que realiza el intento. |
| **Intento**   | resultado         | BOOLEAN      | Correcto / incorrecto.             |
| **Insignia**  | id_insignia (PK)  | INT          | Identificador único.               |

# 6. Prototipo del Software 

Los prototipos siguientes corresponden a wireframes de baja fidelidad (a validar con el docente asesor en el sprint review correspondiente); no son capturas de un sistema ya construido.

## 6.1 Prototipos de administrador

●	Panel de control: resumen de módulos activos y número de estudiantes por módulo.
●	Gestión de contenidos: formulario para crear/editar módulos, lecciones y ejercicios, con campo de caso de prueba para la corrección automática.
●	Reportes: tabla filtrable por grupo con % de avance y alertas de estudiantes inactivos.

## 6.2 Prototipos de usuario (estudiante)

●	Catálogo de módulos: tarjetas con % de avance por módulo.
●	Vista de ejercicio: enunciado, editor de respuesta y zona de retroalimentación inmediata.
●	Perfil: progreso general, historial de intentos e insignias obtenidas.

# 7. Uml2 

Se plantean cuatro diagramas UML como artefactos de diseño; su representación gráfica se desarrollará en la herramienta de modelado del equipo (draw\.io) y se anexará como figura en la versión final del documento:

**Diagrama de casos de uso** 
Actores Estudiante y Docente; casos principales "resolver ejercicio", "consultar progreso", "gestionar contenido", "generar reporte".
image
**Diagrama de clases** 
Refleja el modelo entidad-relación de la sección 5.1 (Usuario, Módulo, Lección, Ejercicio, Intento, Insignia) con sus relaciones y multiplicidades.
**image**
**Diagrama de secuencia**
Flujo "resolver ejercicio", desde el envío de la respuesta por el estudiante hasta la respuesta de retroalimentación  automática.
**image**
**Diagrama de despliegue**
Cliente (React) – automatización/API (n8n) – base de datos (MySQL), sobre la infraestructura descrita en la sección 8.
image

# 8. Arquitectura de Software
