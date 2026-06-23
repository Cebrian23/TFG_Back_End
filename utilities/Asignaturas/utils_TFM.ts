import { ObjectId } from "npm:mongodb";
import { AsignaturasCollection, PersonasCollection, TitulacionesCollection } from "../../db/connection.ts";
import { TFM, TFM_alumno, TFM_alumno_DB, TFM_Block_Curso_DB, TFM_Block_DB, TFM_DB } from "../../types/Asignaturas/TFM.ts";
import { Profesor_Short, ProfesorDB } from "../../types/Personas/Profesor.ts";
import { Short_Profesor_DB } from "../Personas/utils_Profesores.ts";
import { Short_Estudiante_DB } from "../Personas/utils_Estudiantes.ts";
import { Short_Coordinador_DB } from "../Personas/utils_Coordinadores.ts";
import { Coordinador_Short, CoordinadorDB } from "../../types/Personas/Coordinador.ts";
import { EstudianteDB } from "../../types/Personas/Estudiante.ts";

export const Transform_Curso_TFM = async (curso: TFM_Block_Curso_DB): Promise<Response> => {
    const alumnosDB = await PersonasCollection.find({_id: {$in: curso.alumnos}}).toArray();

    if(curso.alumnos.length !== alumnosDB.length){
        return new Response(
            JSON.stringify({error: `${curso.alumnos.length - alumnosDB.length} alumnos no encontrados`}),
            {
                status: 404,
            }
        );
    }

    const rol_error = alumnosDB.find((alumno) => {
        if(alumno.rol !== "Estudiante"){
            return alumno;
        }
    });

    if(rol_error !== undefined){
        return new Response(
            JSON.stringify({error: `Se ha encontrado un ${rol_error.rol.toLowerCase()} en vez de un estudiante`}),
            {
                status: 406,
            }
        );
    }

    const TFM_transform = await Promise.all(curso.TFM.map(async (tfm) => await Transform_TFM(tfm)));

    const TFMs: TFM[] = [];

    const tfm_error = TFM_transform.find(async (response) => {
        if(response.status === 200){
            const data = await response.json();

            TFMs.push(data);
        }
        else{
            return response;
        }
    });

    if(tfm_error !== undefined){
        return new Response(
            JSON.stringify(await tfm_error.json()),
            {
                status: tfm_error.status,
            }
        );
    }

    return new Response(
        JSON.stringify({
            id: curso.id.toString(),
            nombre: curso.nombre,
            alumnos: alumnosDB.map((alumno) => Short_Estudiante_DB(alumno as EstudianteDB)),
            TFM: TFMs,
            tipo: curso.tipo,
        }),
        {
            status: 200,
        }
    );
}

export const Transform_TFM = async (tfm: TFM_DB): Promise<Response> => {
    const estudianteDB = tfm.estudiante;
    const directorDB = tfm.director;
    const tribunalDB = tfm.miembros_tribunal;

    const estudiante_exists = await PersonasCollection.findOne({_id: new ObjectId(estudianteDB)});

    if(!estudiante_exists){
        return new Response(
            JSON.stringify({error: `Alumno con id ${estudianteDB} no encontrado`}),
            {
                status: 404,
            }
        );
    }
    else if(estudiante_exists.rol !== "Estudiante"){
        return new Response(
            JSON.stringify({error: `Persona con id ${estudianteDB} no tiene rol de 'Estudiante', sino de '${estudiante_exists.rol}'`}),
            {
                status: 406,
            }
        );
    }

    const director_exists = await PersonasCollection.find({_id: {$in: directorDB}}).toArray();

    if(directorDB.length !== director_exists.length){
        return new Response(
            JSON.stringify({error: `${directorDB.length - director_exists.length} director/es no encontrados`}),
            {
                status: 404,
            }
        );
    }

    director_exists.forEach((docente) => {
        if(docente.rol !== "Profesor" && docente.rol !== "Coordinador" && docente.rol !== "Coordinador general"){
            return new Response(
                JSON.stringify({error: `Persona con id ${docente._id} no tiene rol de 'Profesor' ni de 'Coordinador', sino de '${docente.rol}'`}),
                {
                    status: 406,
                }
            );
        }
    });
    
    const tribunal_exists = await PersonasCollection.find({_id: {$in: tribunalDB}}).toArray();

    if(tribunalDB.length !== tribunal_exists.length){
        return new Response(
            JSON.stringify({error: `${tribunalDB.length - tribunal_exists.length} miembro/s del tribunal no encontrados`}),
            {
                status: 404,
            }
        );
    }

    const tribunal: (CoordinadorDB | ProfesorDB)[] = [];
    tribunal_exists.forEach((docente) => {
        if(docente.rol !== "Profesor" && docente.rol !== "Coordinador" && docente.rol !== "Coordinador general"){
            return new Response(
                JSON.stringify({error: `Persona con id ${docente._id} no tiene rol de 'Profesor' ni de 'Coordinador', sino ${docente.rol}`}),
                {
                    status: 406,
                }
            );
        }
        else{
            tribunal.push(docente);
        }
    });

    const tribunal_short: (Coordinador_Short | Profesor_Short)[] = [];
    tribunal.forEach((docente) => {
        if(docente.rol === "Profesor"){
            tribunal_short.push(Short_Profesor_DB(docente));
        }
        else if(docente.rol === "Coordinador" || docente.rol === "Coordinador general"){
            tribunal_short.push(Short_Coordinador_DB(docente));
        }
    });

    return new Response(
        JSON.stringify(
            {
                id: tfm._id!.toString(),
                titulo: tfm.titulo,
                estudiante: Short_Estudiante_DB(estudiante_exists),
                director: director_exists.map((director) => Short_Profesor_DB(director as ProfesorDB)),
                miembros_tribunal: tribunal_short,
                curso_academico: tfm.curso_academico,
                fecha_defensa: tfm.fecha_defensa,
                hora_defensa: tfm.hora_defensa,
                convocatoria: tfm.convocatoria,
            }
        ),
        {
            status: 200,
        }
    );
}

export const Short_TFM_Block = async (tfm: TFM_Block_DB): Promise<Response> => {
    const titulacion = await TitulacionesCollection.findOne({TFM: tfm._id!});

    if(!titulacion){
        return new Response(
            JSON.stringify({error: `Titulación del bloque de TFMs con id ${tfm._id} no encontrada`}),
            {
                status: 404,
            }
        );
    }

    return new Response(
        JSON.stringify(
            {
                id: tfm._id!.toString(),
                titulacion: titulacion.nombre,
                creditos: tfm.creditos,
                curso: tfm.curso,
                optatividad: tfm.optatividad,
                tipo: "Bloque TFMs",
            }
        ),
        {
            status: 200,
        }
    );
}

export const Transform_TFM_alumno_DB = async (tfm: TFM_alumno_DB) => {
    const block_exists = await AsignaturasCollection.findOne({_id: tfm.bloque});

    if(!block_exists){
        return new Response(
            JSON.stringify({error: `Bloque de TFMs no encontrado`}),
            {
                status: 404,
            }
        );
    }
    else if(block_exists.tipo !== "Bloque TFMs"){
        return new Response(
            JSON.stringify({error: "Se ha encontrado una asignatura en vez de un bloque de TFMs"}),
            {
                status: 406,
            }
        );
    }

    const curso_exists = block_exists.cursos.find((cursito) => {
        if(cursito.nombre === tfm.curso_academico){
            return cursito;
        }
    });

    if(!curso_exists){
        return new Response(
            JSON.stringify({error: `${curso_exists} no ha sido encontrado en el bloque con id ${block_exists._id}`}),
            {
                status: 404,
            }
        );
    }

    const tfm_exists = curso_exists.TFM.find((tfm_data) => {
        if(tfm_data._id!.toString() === tfm.TFM.toString()){
            return tfm_data;
        }
    });

    if(!tfm_exists){
        return new Response(
            JSON.stringify({error: `No se ha podido encontrar el tfm "${tfm.titulo}"`}),
            {
                status: 404,
            }
        );
    }

    const newTFM: TFM_alumno = {
        TFM: tfm_exists._id!.toString(),
        bloque: tfm_exists.bloque.toString(),
        titulo: tfm_exists.titulo,
        curso_academico: tfm_exists.curso_academico,
        fecha_defensa: tfm_exists.fecha_defensa,
        convocatoria: tfm_exists.convocatoria,
        tipo: tfm_exists.tipo,
    }

    return new Response(
        JSON.stringify(newTFM),
        {
            status: 200,
        }
    );
}

export const Transform_TFM_MatriculadosPresentados = async (tfm: {asignatura: ObjectId, curso_academico: string, tipo: "TFM"}) => {
    const asignatura = await AsignaturasCollection.findOne({_id: tfm.asignatura});
    
    if(!asignatura){
        return new Response(
            JSON.stringify({error: `Asignatura con id ${tfm.asignatura} no encontrada`}),
            {
                status: 404,
            }
        );
    }
    else if(asignatura.tipo !== "Bloque TFMs"){
        return new Response(
            JSON.stringify({error: `Se ha encontrado una asignatura en vez de un bloque de TFMs`}),
            {
                status: 406,
            }
        );
    }

    const new_tfm: {
        asignatura: string,
        curso_academico: string,
        tipo: "TFM"
    } = {
        asignatura: asignatura._id.toString(),
        curso_academico: tfm.curso_academico,
        tipo: tfm.tipo,
    }

    return new Response(
        JSON.stringify(new_tfm),
        {
            status: 200,
        }
    );
}