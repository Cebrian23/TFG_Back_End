import { ObjectId } from "mongodb";
import { PersonasCollection, TitulacionesCollection } from "../../db/connection.ts";
import { TFM_Block_DB, TFM_DB } from "../../types/Asignaturas/TFM.ts";
import { Profesor_Short, ProfesorDB } from "../../types/Personas/Profesor.ts";
import { Short_Profesor_DB } from "../Personas/utils_Profesores.ts";
import { Short_Estudiante_DB } from "../Personas/utils_Estudiantes.ts";
import { Short_Coordinador_DB } from "../Personas/utils_Coordinadores.ts";
import { Coordinador_Short, CoordinadorDB } from "../../types/Personas/Coordinador.ts";

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
        if(docente.rol !== "Profesor" && docente.rol !== "Coordinador"){
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
        if(docente.rol !== "Profesor" && docente.rol !== "Coordinador"){
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
        else if(docente.rol === "Coordinador"){
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
            }
        ),
        {
            status: 200,
        }
    );
}