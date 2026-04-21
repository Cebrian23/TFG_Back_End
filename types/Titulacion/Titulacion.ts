import { ObjectId, OptionalId } from "npm:mongodb";
import { Asignatura_Short } from "../Asignaturas/Asignatura.ts";
import { TFM_Block_Short } from "../Asignaturas/TFM.ts";
import { Administrativo_Short } from "../Personas/Administrativo.ts";
import { Coordinador_Short } from "../Personas/Coordinador.ts";
import { Profesor_Short } from "../Personas/Profesor.ts";
import { Estudiante_Short } from "../Personas/Estudiante.ts";

export type TitulacionDB = OptionalId<{
    nombre: string,
    universidades: string[],
    grados_aptos: string[],
    cursos: number,
    convocatorias_disponibles: number,
    asignaturas: ObjectId[],
    TFM: ObjectId,
    administrativos: ObjectId[],
    docentes: ObjectId[],
    alumnos: ObjectId[],
}>

export type Titulacion = {
    id: string,
    nombre: string,
    universidades: string[],
    grados_aptos: string[],
    cursos: number,
    convocatorias_disponibles: number,
    asignaturas: Asignatura_Short[],
    TFM: TFM_Block_Short,
    administrativos: Administrativo_Short[],
    docentes: (Coordinador_Short | Profesor_Short)[],
    alumnos: Estudiante_Short[],
}

export type Titulacion_Short = {
    id: string,
    nombre: string,
    TFM: string
}