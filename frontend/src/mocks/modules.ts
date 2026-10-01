import type { Module } from '@/types'

export const modulesSeed: Module[] = [
  { id: 'm01', order: 1, code: '01', title: 'Introducción a la programación', summary: 'Qué es un programa, cómo se ejecuta y cómo se ve una instrucción en Python.', published: true },
  { id: 'm02', order: 2, code: '02', title: 'Algoritmos y pseudocódigo', summary: 'Describir una solución en pasos ordenados antes de escribir una sola línea de código.', published: true },
  { id: 'm03', order: 3, code: '03', title: 'Variables y tipos de datos', summary: 'Guardar información en memoria, nombrarla bien y saber qué tipo de dato estás manejando.', published: true },
  { id: 'm04', order: 4, code: '04', title: 'Operadores y expresiones', summary: 'Aritmética, comparación y lógica: cómo combinar valores para producir uno nuevo.', published: true },
  { id: 'm05', order: 5, code: '05', title: 'Estructuras condicionales', summary: 'Hacer que el programa decida: if, elif y else para tomar caminos distintos según los datos.', published: true },
  { id: 'm06', order: 6, code: '06', title: 'Ciclos y repetición', summary: 'Repetir instrucciones con for y while sin copiar y pegar código.', published: true },
  { id: 'm07', order: 7, code: '07', title: 'Funciones', summary: 'Agrupar instrucciones con nombre, recibir parámetros y devolver resultados reutilizables.', published: true },
  { id: 'm08', order: 8, code: '08', title: 'Estructuras de datos básicas', summary: 'Listas y conjuntos para manejar varios valores a la vez de forma ordenada.', published: true },
]
