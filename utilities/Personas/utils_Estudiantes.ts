import { Asignatura_alumno, Asignatura_alumno_DB } from "../../types/Asignaturas/Asignatura.ts";
import { TFM_alumno, TFM_alumno_DB } from "../../types/Asignaturas/TFM.ts";
import { Estudiante_Short, EstudianteDB } from "../../types/Personas/Estudiante.ts";
import { AsignaturasCollection, PersonasCollection } from "../../db/connection.ts";
import { ObjectId } from "mongodb";

export const Transform_Estudiante = (estudiante: EstudianteDB): Response => {
    const asignaturas_cursadas: (Asignatura_alumno | TFM_alumno)[] = [];
    const asignaturas_aprobadas: (Asignatura_alumno | TFM_alumno)[] = [];

    const alum_asig_cursadas: Asignatura_alumno_DB[] = [];
    const alum_TFM_cursados: TFM_alumno_DB[] = [];

    estudiante.asignaturas_aprobadas.forEach((asig) => {
        if(asig.tipo === "Asignatura"){
            alum_asig_cursadas.push(asig);
        }
        else{
            alum_TFM_cursados.push(asig);
        }
    });

    const alum_asig_cursadas_final: Asignatura_alumno_DB[] = [];

    alum_asig_cursadas.forEach(async (asig) => {
        const asignatura_exists = await AsignaturasCollection.findOne({_id: asig.asignatura});

        if(!asignatura_exists){
            return new Response(
                JSON.stringify({error: `Asignatura con id ${asig.asignatura} no encontrada`}),
                {
                    status: 404,
                }
            );
        }
        else if(asignatura_exists.tipo !== "Asignatura"){
            return new Response(
                JSON.stringify({error: `Bloque de TFMs con id ${asig.asignatura} encontrado en vez de `}),
                {
                    status: 406,
                }
            );
        }

        const asig_exists = asignatura_exists.cursos_academicos.find((asig_data) => {
            if(asig.id === asig_data.id){
                return asig_data;
            }
        });

        if(asig_exists === undefined){
            return new Response(
                JSON.stringify({error: `Asignatura con id ${asig.id} no encontrada`}),
                {
                    status: 404,
                }
            );
        }

        alum_asig_cursadas_final.push(
            {
                id: asig.id,
                asignatura: asig.asignatura,
                convocatoria_num: asig.convocatoria_num,
                convocatoria_name: asig.convocatoria_name,
                curso: asig.curso,
                nota: asig.nota,
                tipo: "Asignatura",
            }
        );
    });
    
    const alum_TFM_cursadas_final: TFM_alumno_DB[] = [];

    alum_TFM_cursados.forEach(async (tfm) => {
        const bloque_exists = await AsignaturasCollection.findOne({_id: tfm.bloque});

        if(!bloque_exists){
            return new Response(
                JSON.stringify({error: `Bloque de TFMs con id ${tfm.bloque} no encontrado`}),
                {
                    status: 404,
                }
            );
        }
        else if(bloque_exists.tipo !== "Bloque TFMs"){
            return new Response(
                JSON.stringify({error: `Asignatura con id ${tfm.bloque} encontrada en vez de bloque de TFMs`}),
                {
                    status: 406,
                }
            );
        }

        const tfm_exists = bloque_exists.TFMs.find((tfm_data) => {
            if(tfm.TFM === tfm_data._id){
                return tfm_data;
            }
        });

        if(tfm_exists === undefined){
            return new Response(
                JSON.stringify({error: `TFM con id ${tfm.TFM} no encontrado`}),
                {
                    status: 404,
                }
            );
        }

        alum_TFM_cursadas_final.push(
            {
                TFM: tfm_exists._id!,
                bloque: tfm_exists.bloque,
                titulo: tfm.titulo,
                convocatoria: tfm_exists.convocatoria,
                curso_academico: tfm_exists.curso_academico,
                fecha_defensa: tfm_exists.fecha_defensa,
                hora_defensa: tfm_exists.hora_defensa,
                tipo: "TFM",
            }
        );
    });

    if((alum_asig_cursadas_final.length + alum_TFM_cursadas_final.length) !== estudiante.asignaturas_cursadas.length){
        return new Response(
            JSON.stringify({error: `Asignaturas y TFMs cursados no encontrados`}),
            {
                status: 404,
            }
        );
    }

    alum_asig_cursadas_final.forEach((asig) => {
        asignaturas_cursadas.push(
            {
                id: asig.id.toString(),
                asignatura: asig.asignatura.toString(),
                convocatoria_num: asig.convocatoria_num,
                convocatoria_name: asig.convocatoria_name,
                curso: asig.curso,
                nota: asig.nota,
                tipo: "Asignatura",
            }
        );
    });

    alum_TFM_cursadas_final.forEach((asig) => {
        asignaturas_cursadas.push(
            {
                TFM: asig.TFM.toString(),
                bloque: asig.bloque.toString(),
                titulo: asig.titulo,
                curso_academico: asig.curso_academico,
                fecha_defensa: asig.fecha_defensa,
                convocatoria: asig.convocatoria,
                tipo: "TFM",
            }
        );
    });

    const alum_asig_aprobadas: Asignatura_alumno_DB[] = [];
    const alum_TFM_aprobados: TFM_alumno_DB[] = [];

    estudiante.asignaturas_cursadas.forEach((asig) => {
        if(asig.tipo === "Asignatura"){
            alum_asig_aprobadas.push(asig);
        }
        else{
            alum_TFM_aprobados.push(asig);
        }
    });

    const alum_asig_aprobadas_final: Asignatura_alumno_DB[] = [];

    alum_asig_aprobadas.forEach(async (asig) => {
        const asignatura_exists = await AsignaturasCollection.findOne({_id: asig.asignatura});

        if(!asignatura_exists){
            return new Response(
                JSON.stringify({error: `Asignatura con id ${asig.asignatura} no encontrada`}),
                {
                    status: 404,
                }
            );
        }
        else if(asignatura_exists.tipo !== "Asignatura"){
            return new Response(
                JSON.stringify({error: `Bloque de TFMs con id ${asig.asignatura} encontrado en vez de `}),
                {
                    status: 406,
                }
            );
        }

        const asig_exists = asignatura_exists.cursos_academicos.find((asig_data) => {
            if(asig.id === asig_data.id){
                return asig_data;
            }
        });

        if(asig_exists === undefined){
            return new Response(
                JSON.stringify({error: `Asignatura con id ${asig.id} no encontrada`}),
                {
                    status: 404,
                }
            );
        }

        alum_asig_aprobadas_final.push(
            {
                id: asig.id,
                asignatura: asig.asignatura,
                convocatoria_num: asig.convocatoria_num,
                convocatoria_name: asig.convocatoria_name,
                curso: asig.curso,
                nota: asig.nota,
                tipo: "Asignatura",
            }
        );
    });

    const alum_TFM_aprobados_final: TFM_alumno_DB[] = [];

    alum_TFM_aprobados.forEach(async (tfm) => {
        const bloque_exists = await AsignaturasCollection.findOne({_id: tfm.bloque});

        if(!bloque_exists){
            return new Response(
                JSON.stringify({error: `Bloque de TFMs con id ${tfm.bloque} no encontrado`}),
                {
                    status: 404,
                }
            );
        }
        else if(bloque_exists.tipo !== "Bloque TFMs"){
            return new Response(
                JSON.stringify({error: `Asignatura con id ${tfm.bloque} encontrada en vez de bloque de TFMs`}),
                {
                    status: 406,
                }
            );
        }

        const tfm_exists = bloque_exists.TFMs.find((tfm_data) => {
            if(tfm.TFM === tfm_data._id){
                return tfm_data;
            }
        });

        if(tfm_exists === undefined){
            return new Response(
                JSON.stringify({error: `TFM con id ${tfm.TFM} no encontrado`}),
                {
                    status: 404,
                }
            );
        }

        alum_TFM_aprobados_final.push(
            {
                TFM: tfm_exists._id!,
                bloque: tfm_exists.bloque,
                titulo: tfm.titulo,
                convocatoria: tfm_exists.convocatoria,
                curso_academico: tfm_exists.curso_academico,
                fecha_defensa: tfm_exists.fecha_defensa,
                hora_defensa: tfm_exists.hora_defensa,
                tipo: "TFM",
            }
        );
    });

    if((alum_asig_aprobadas_final.length + alum_TFM_aprobados_final.length) !== estudiante.asignaturas_aprobadas.length){
        return new Response(
            JSON.stringify({error: `Asignaturas y TFMs aprobados no encontrados`}),
            {
                status: 404,
            }
        );
    }
    
    alum_asig_aprobadas_final.forEach((asig) => {
        asignaturas_aprobadas.push(
            {
                id: asig.id.toString(),
                asignatura: asig.asignatura.toString(),
                convocatoria_num: asig.convocatoria_num,
                convocatoria_name: asig.convocatoria_name,
                curso: asig.curso,
                nota: asig.nota,
                tipo: "Asignatura",
            }
        );
    });

    alum_TFM_aprobados_final.forEach((asig) => {
        asignaturas_aprobadas.push(
            {
                TFM: asig.TFM.toString(),
                bloque: asig.bloque.toString(),
                titulo: asig.titulo,
                curso_academico: asig.curso_academico,
                fecha_defensa: asig.fecha_defensa,
                convocatoria: asig.convocatoria,
                tipo: "TFM",
            }
        );
    });

    return new Response(
        JSON.stringify(
            {
                id: estudiante._id!.toString(),
                nombre: estudiante.nombre,
                apellido_1: estudiante.apellido_1,
                apellido_2: estudiante.apellido_2,
                DNI: estudiante.DNI,
                prefijo_movil: estudiante.prefijo_movil,
                numero_movil: estudiante.numero_movil,
                email: estudiante.email,
                rol: "Estudiante",
                grado_academico: estudiante.grado_academico,
                universidad: estudiante.universidad,
                curso_admision: estudiante.curso_admision,
                asignaturas_cursadas: asignaturas_cursadas,
                asignaturas_aprobadas: asignaturas_aprobadas,
            }
        ),
        {
            status: 200,
        }
    );
}

export const Short_Estudiante_DB = (estudiante: EstudianteDB): Estudiante_Short => {
    return{
        id: estudiante._id!.toString(),
        nombre: estudiante.nombre,
        apellido_1: estudiante.apellido_1,
        apellido_2: estudiante.apellido_2,
        DNI: estudiante.DNI,
        email: estudiante.email,
        rol: "Estudiante",
    }
}

export const Short_Estudiante_ID = async (estudiante: ObjectId): Promise<Response> => {
    const estudiante_exists = await PersonasCollection.findOne({_id: estudiante});

    if(!estudiante_exists){
        return new Response(
            JSON.stringify({error: "Estudiante no encontrado"}),
            {
                status: 404,
            }
        );
    }

    return new Response(
        JSON.stringify(
            {
                id: estudiante_exists._id!.toString(),
                nombre: estudiante_exists.nombre,
                apellido_1: estudiante_exists.apellido_1,
                apellido_2: estudiante_exists.apellido_2,
                DNI: estudiante_exists.DNI,
                email: estudiante_exists.email,
                rol: "Estudiante",
            }
        ),
        {
            status: 200,
        }
    )
}