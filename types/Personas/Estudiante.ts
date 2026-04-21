import { OptionalId } from "npm:mongodb";
import { Asignatura_alumno, Asignatura_alumno_DB } from "../Asignaturas/Asignatura.ts";
import { TFM_alumno, TFM_alumno_DB } from "../Asignaturas/TFM.ts";

export type EstudianteDB = OptionalId<{
    nombre: string,
    apellido_1: string,
    apellido_2?: string,
    DNI: string,
    prefijo_movil?: string,
    numero_movil?: string,
    email: string,
    password?: string,
    rol: "Estudiante",
    grado_academico: string,
    universidad: string,
    curso_admision: string,
    asignaturas_cursadas: (TFM_alumno_DB | Asignatura_alumno_DB)[],
    asignaturas_aprobadas: (TFM_alumno_DB | Asignatura_alumno_DB)[],
}>

export type Estudiante = {
    id: string,
    nombre: string,
    apellido_1: string,
    apellido_2?: string,
    DNI: string,
    prefijo_movil?: string,
    numero_movil?: string,
    email: string,
    rol: "Estudiante",
    grado_academico: string,
    universidad: string,
    curso_admision: string,
    asignaturas_cursadas: (TFM_alumno | Asignatura_alumno)[],
    asignaturas_aprobadas: (TFM_alumno | Asignatura_alumno)[],
}

export type Estudiante_Short = {
    id: string,
    nombre: string,
    apellido_1: string,
    apellido_2?: string,
    DNI: string,
    email: string,
    rol: "Estudiante",
}