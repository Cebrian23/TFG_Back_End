import { ObjectId } from "npm:mongodb";
import { AsignaturasCollection, PersonasCollection, TitulacionesCollection } from "./db/connection.ts";
import { TFM, TFM_alumno_DB, TFM_DB } from "./types/Asignaturas/TFM.ts";
import { Short_Coordinador_DB, Transform_Coordinador } from "./utilities/Personas/utils_Coordinadores.ts";
import { Short_Profesor_DB, Transform_Profesor } from "./utilities/Personas/utils_Profesores.ts";
import { Transform_Administrativo } from "./utilities/Personas/utils_Administrativos.ts";
import { Short_Estudiante_DB, Transform_Estudiante } from "./utilities/Personas/utils_Estudiantes.ts";
import { EstudianteDB } from "./types/Personas/Estudiante.ts";
import { Profesor_Short, ProfesorDB } from "./types/Personas/Profesor.ts";
import { Coordinador_Short, CoordinadorDB } from "./types/Personas/Coordinador.ts";
import { Administrativo_Short, AdministrativoDB } from "./types/Personas/Administrativo.ts";
import { Validate_Phone } from "./utilities/Validaciones/Validate_Phone.ts";
import { Validate_Email } from "./utilities/Validaciones/Validate_Email.ts";
import { Persona_To_Short_DB } from "./utilities/Personas/utils_Persona.ts";
import { Transform_TFM } from "./utilities/Asignaturas/utils_TFM.ts";
import { Asignatura_curso_DB, Asignatura_curso_docs_short, Asignatura_curso, AlumnoDB, Asignatura_alumno_DB } from "./types/Asignaturas/Asignatura.ts";
import { Short_Asignatura_Curso_Docs_DB, Transform_Curso, Transform_Alumno } from "./utilities/Asignaturas/utils_Asignaturas.ts";
import { Short_Titulacion, Transform_Titulacion } from "./utilities/Titulacion/utils_Titulacion.ts";
import { Error_info } from "./types/Messages/Errors.ts";

const handler = async (req: Request): Promise<Response> => {
	const method = req.method;
	const url = new URL(req.url);
	const path = url.pathname;
    const searchParams = url.searchParams;

    const headers = new Headers();
	headers.set("Access-Control-Allow-Origin", "*");
	headers.set("Access-Control-Allow-Headers", "*");
	headers.set("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");

    if(method === "OPTIONS"){
       return new Response(null,{
    		status: 204,
    		headers,
    	});
	}
	else if(method === "GET"){
        if(path === "/login"){
            const email = searchParams.get("email");
            const password = searchParams.get("password");

            if(!email || !password){
                return new Response(
                    JSON.stringify({error: "Email o contraseña no encontrada"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const email_validation = await Validate_Email(email);

            if(email_validation.status !== 200){
                return new Response(
                    JSON.stringify(await email_validation.json()),
                    {
                        status: email_validation.status,
                        headers: headers,
                    }
                );
            }

            const persona: (EstudianteDB | ProfesorDB | CoordinadorDB | AdministrativoDB | null) = await PersonasCollection.findOne({email: email});

            if(!persona || persona.password !== password){
                return new Response(
                    JSON.stringify({error: `Email o contraseña equivocada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            if(persona.rol === "Estudiante"){
                const data = Transform_Estudiante(persona as EstudianteDB);

                if(data.status !== 200){
                    return new Response(
                        JSON.stringify(await data.json()),
                        {
                            status: 200,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(await data.json()),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(persona.rol === "Administrativo"){
                const data = await Transform_Administrativo(persona as AdministrativoDB);
                if(data.status !== 200){
                    return new Response(
                        JSON.stringify(await data.json()),
                        {
                            status: 200,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(await data.json()),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(persona.rol === "Coordinador"){
                return new Response(
                    JSON.stringify(Transform_Coordinador(persona as CoordinadorDB)),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(persona.rol === "Profesor"){
                return new Response(
                    JSON.stringify(Transform_Profesor(persona as ProfesorDB)),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({error: "Error al loguearse"}),
                {
                    status: 406,
                    headers: headers,
                }
            );
        }
        else if(path === "/persona/id"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "Falta algún dato para buscar a la persona"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const personDB = await PersonasCollection.findOne({_id: new ObjectId(id)});

            if(!personDB){
                return new Response(
                    JSON.stringify({error: `Persona con id ${id} no encontrada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            if(personDB.rol === "Administrativo"){
                const person = await Transform_Administrativo(personDB);

                if(person.status !== 200){
                    return new Response(
                        JSON.stringify(await person.json()),
                        {
                            status: person.status,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(await person.json()),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(personDB.rol === "Coordinador"){
                const person = Transform_Coordinador(personDB);

                return new Response(
                    JSON.stringify(person),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(personDB.rol === "Profesor"){
                const person = Transform_Profesor(personDB);

                return new Response(
                    JSON.stringify(person),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(personDB.rol === "Estudiante"){
                const person = Transform_Estudiante(personDB);

                if(person.status !== 200){
                    return new Response(
                        JSON.stringify(await person.json()),
                        {
                            status: person.status,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(await person.json()),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({error: "No se ha podido transformar correctamente los datos de la persona"}),
                {
                    status: 406,
                    headers: headers,
                }
            );
        }
        else if(path === "/personas/alumnos"){
            const titulacion = searchParams.get("titulacion");

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: "Falta algún dato para buscar a la persona o las personas"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const titulacion_exists = await TitulacionesCollection.findOne({_id: new ObjectId(titulacion)});

            if(!titulacion_exists){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${titulacion} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const estudiantes = titulacion_exists.alumnos;

            const peopleDB = await PersonasCollection.find({_id: {$in: estudiantes}}).toArray();

            const people_error = peopleDB.find((person) => {
                if(person.rol !== "Estudiante"){
                    return person;
                }
            });

            if(people_error !== undefined){
                return new Response(
                    JSON.stringify({error: `Persona con id ${people_error._id.toString()} tiene el rol de '${people_error.rol}', no el de 'Estudiante'`}),
                    {
                        status: 406,
                    }
                );
            }

            const people = peopleDB.map((person) => Short_Estudiante_DB(person as EstudianteDB));

            return new Response(
                JSON.stringify(people),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/personas/docentes"){
            const titulacion = searchParams.get("titulacion");

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: "Falta algún dato para buscar a la persona o las personas"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const titulacion_exists = await TitulacionesCollection.findOne({_id: new ObjectId(titulacion)});

            if(!titulacion_exists){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${titulacion} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const docentes = titulacion_exists.docentes;

            const peopleDB = await PersonasCollection.find({_id: {$in: docentes}}).toArray();

            const people_error = peopleDB.find((person) => {
                if(person.rol !== "Coordinador" && person.rol !== "Profesor"){
                    return person;
                }
            });

            if(people_error){
                return new Response(
                    JSON.stringify({error: `Persona con id ${people_error._id.toString()} tiene el rol de '${people_error.rol}', no el de 'Profesor' ni el de 'Coordinador'`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const people: (Coordinador_Short | Profesor_Short)[] = [];
            
            peopleDB.forEach((person) => {
                if(person.rol === "Coordinador"){
                    people.push(Short_Coordinador_DB(person as CoordinadorDB));
                }
                else if(person.rol === "Profesor"){
                    people.push(Short_Profesor_DB(person as ProfesorDB));
                }
            });

            return new Response(
                JSON.stringify(people),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/persona/email"){
            const email = searchParams.get("email");

            if(!email){
                return new Response(
                    JSON.stringify({error: "Falta algún dato para buscar a la persona"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const email_validation = await Validate_Email(email);

            if(email_validation.status !== 200){
                return new Response(
                    JSON.stringify(await email_validation.json()),
                    {
                        status: email_validation.status,
                        headers: headers,
                    }
                );
            }

            const personDB = await PersonasCollection.findOne({email: email});

            if(!personDB){
                return new Response(
                    JSON.stringify({error: `Persona con email ${email} no encontrada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const person = Persona_To_Short_DB(personDB);

            return new Response(
                JSON.stringify(person),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/docente/titulaciones"){
            const docente = searchParams.get("docente");

            if(!docente){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacionesDB = await TitulacionesCollection.find({docentes: new ObjectId(docente)}).toArray();

            const titulaciones = titulacionesDB.map((titulacion) => Short_Titulacion(titulacion));

            return new Response(
                JSON.stringify(titulaciones),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/docente/asignaturas"){
            const docente = searchParams.get("docente");
            const titulacion = searchParams.get("titulacion");

            if(!docente || !titulacion){
                return new Response(
                    JSON.stringify({error: "IDs no encontrados"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion_exists = await TitulacionesCollection.findOne({_id: new ObjectId(titulacion)});

            if(!titulacion_exists){
                return new Response(
                    JSON.stringify({error: "Titulación no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const asignaturasDB = titulacion_exists.asignaturas;

            const asignaturas_exists = await AsignaturasCollection.find({_id: {$in: asignaturasDB}}).toArray();

            if(asignaturasDB.length !== asignaturas_exists.length){
                return new Response(
                    JSON.stringify({error: `${asignaturasDB.length !== asignaturas_exists.length} asignaturas no encontradas`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                )
            }

            const asig_error = asignaturas_exists.find((asig) => {
                if(asig.tipo !== "Asignatura"){
                    return asig;
                }
            });

            if(asig_error){
                return new Response(
                    JSON.stringify({error: `Bloque de TFMs encontrado entre las asignaturas`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }
            
            const cursosDB: {
                id: string,
                nombre: string,
                curso: Asignatura_curso_DB
            }[] = [];

            asignaturas_exists.forEach((asignatura) => {
                if(asignatura.tipo === "Asignatura"){
                    asignatura.cursos_academicos.forEach((curso) => {
                        curso.profesores.forEach((profesor) => {
                            if(profesor.toString() === docente){
                                cursosDB.push(
                                    {
                                        nombre: asignatura.nombre,
                                        id: asignatura._id.toString(),
                                        curso: curso,
                                    }
                                );
                            }
                        });
                    });
                }
            });

            const cursos_response = await Promise.all(cursosDB.map(async (curso) => await Short_Asignatura_Curso_Docs_DB(curso.curso, curso.id, curso.nombre)));

            const curso_error = cursos_response.find((curso) => {
                if(curso.status !== 200){
                    return curso;
                }
            });

            if(curso_error !== undefined){
                return new Response(
                    JSON.stringify(await curso_error.json()),
                    {
                        status: curso_error.status,
                        headers: headers,
                    }
                );
            }

            const cursos: Asignatura_curso_docs_short[] = await Promise.all(cursos_response.map(async (response) => await response.json()));

            return new Response(
                JSON.stringify(cursos),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/administrativo/titulaciones"){
            const admin = searchParams.get("admin");

            if(!admin){
                return new Response(
                    JSON.stringify({error: "ID del administrativo no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacionesDB = await TitulacionesCollection.find({administrativos: new ObjectId(admin)}).toArray();

            const titulaciones_info = titulacionesDB.map((titulacion) => Short_Titulacion(titulacion));

            return new Response(
                JSON.stringify(titulaciones_info),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/asignatura"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const asignatura = await AsignaturasCollection.findOne({_id: new ObjectId(id)});

            if(!asignatura){
                return new Response(
                    JSON.stringify({error: `Asignatura con id ${id} no encontrada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(asignatura.tipo !== "Asignatura"){
                return new Response(
                    JSON.stringify({error: `Bloque de TFMs con id ${asignatura._id} encontrada en vez de asignatura`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const titulacion = await TitulacionesCollection.findOne({asignaturas: asignatura._id});

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: "Titulacion de la asignatura no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const asignatura_cursos_data = await Promise.all(asignatura.cursos_academicos.map(async (curso) => await Transform_Curso(curso)));
            const asignatura_curso: Asignatura_curso[] = [];

            const data: (Asignatura_curso | Error_info)[] = await Promise.all(asignatura_cursos_data.map(async (curso) => {
                if(curso.status !== 200){
                    const error = await curso.json();

                    return {
                        tipo: "error",
                        status: curso.status,
                        error: error.error,
                    }
                }
                else{
                    return await curso.json();
                }
            }));

            data.forEach((data_info) => {
                if(data_info.tipo === "error"){
                    const status = data_info.status;

                    return new Response(
                        JSON.stringify(data_info.error),
                        {
                            status: status,
                            headers: headers,
                        }
                    );
                }
                else{
                    asignatura_curso.push(data_info as Asignatura_curso);
                }
            });

            if(asignatura.cursos_academicos.length !== asignatura_curso.length){
                return new Response(
                    JSON.stringify({error: `${asignatura.cursos_academicos.length - asignatura_curso.length} cursos no encontrados`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(
                    {
                        id: asignatura._id!.toString(),
                        nombre: asignatura.nombre,
                        curso: asignatura.curso,
                        cursos_academicos: asignatura_curso,
                        creditos: asignatura.creditos,
                        optatividad: asignatura.optatividad,
                        titulacion: titulacion._id.toString(),
                        tipo: "Asignatura",
                    }
                ),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/curso"){
            const asignatura = searchParams.get("asignatura");
            const curso = searchParams.get("curso");

            if(!asignatura || !curso){
                return new Response(
                    JSON.stringify({error: "IDs no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const asignaturaDB = await AsignaturasCollection.findOne({_id: new ObjectId(asignatura)});

            if(!asignaturaDB){
                return new Response(
                    JSON.stringify({error: "Asignatura no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(asignaturaDB.tipo !== "Asignatura"){
                return new Response(
                    JSON.stringify({error: "Bloque de TFM encontrado en vez de una asignatura"}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const curso_exists = asignaturaDB.cursos_academicos.find((cursito) => {
                if(cursito.id.toString() === curso){
                    return curso;
                }
            });

            if(curso_exists === undefined){
                return new Response(
                    JSON.stringify({error: "Curso no encontrado"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const curso_response = await Transform_Curso(curso_exists);

            if(curso_response.status !== 200){
                return new Response(
                    JSON.stringify(await curso_response.json()),
                    {
                        status: curso_response.status,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(await curso_response.json()),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/convocatoria"){
            const asignatura = searchParams.get("asignatura");
            const curso = searchParams.get("curso");
            const convocatoria = searchParams.get("curso");

            if(!asignatura || !curso || !convocatoria){
                return new Response(
                    JSON.stringify({error: "Falta algún dato para hacer la búsqueda"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const asignatura_exists = await AsignaturasCollection.findOne({_id: new ObjectId(asignatura)});

            if(!asignatura_exists){
                return new Response(
                    JSON.stringify({error: "Asignatura no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(asignatura_exists.tipo !== "Asignatura"){
                return new Response(
                    JSON.stringify({error: "Bloque de TFM encontrado en vez de una asignatura"}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const curso_exists = asignatura_exists.cursos_academicos.find((cursito) => {
                if(cursito.curso_academico === curso){
                    return cursito;
                }
            });

            if(curso_exists === undefined){
                return new Response(
                    JSON.stringify({error: `${curso} no encontrado en la asignatura ${asignatura_exists.nombre}`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const alumnosDB = curso_exists.alumnos_ordinaria;

            const alumnos_response = await Promise.all(alumnosDB.map(async (alumno) => await Transform_Alumno(alumno)));

            const error = alumnos_response.find((response) => {
                if(response.status !== 200){
                    return response;
                }
            });

            if(error !== undefined){
                return new Response(
                    JSON.stringify(await error.json()),
                    {
                        status: error.status,
                        headers: headers,
                    }
                );
            }

            const alumnos = await Promise.all(alumnos_response.map(async (response) => {
                const data = await response.json();

                return data;
            }));

            return new Response(
                JSON.stringify(alumnos),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/bloque_TFM"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const bloque_exists = await AsignaturasCollection.findOne({_id: new ObjectId(id)});

            if(!bloque_exists){
                return new Response(
                    JSON.stringify({error: `Bloque de TFMs con id ${id} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(bloque_exists.tipo !== "Bloque TFMs"){
                return new Response(
                    JSON.stringify({error: `Asignatura con id ${bloque_exists} encontrada en vez de bloque de TFMs `}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const TFMs_data = await Promise.all(bloque_exists.TFMs.map(async (tfm) => await Transform_TFM(tfm)));
            const TFMs: TFM[] = [];
            
            const data: (TFM | Error_info)[] = await Promise.all(TFMs_data.map(async (tfm) => {
                if(tfm.status !== 200){
                    const error = await tfm.json();

                    return {
                        tipo: "error",
                        status: tfm.status,
                        error: error.error,
                    }
                }
                else{
                    return await tfm.json();
                }
            }));

            data.forEach((data_info) => {
                if(data_info.tipo === "error"){
                    const status = data_info.status;

                    return new Response(
                        JSON.stringify(data_info.error),
                        {
                            status: status,
                            headers: headers,
                        }
                    );
                }
                else{
                    TFMs.push(data_info as TFM);
                }
            });

            if(bloque_exists.TFMs.length !== TFMs.length){
                return new Response(
                    JSON.stringify({error: `${bloque_exists.TFMs.length - TFMs.length} TFMs no encontrados`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(
                    {
                        id: bloque_exists._id.toString(),
                        curso: bloque_exists.curso,
                        creditos: bloque_exists.creditos,
                        TFMs: TFMs
                    }
                ),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/TFM"){
            const TFM_group = searchParams.get("group");
            const id = searchParams.get("id");

            if(!id || !TFM_group){
                return new Response(
                    JSON.stringify({error: "IDS no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const TFM_data = await AsignaturasCollection.findOne({_id: new ObjectId(TFM_group)});

            if(!TFM_data){
                return new Response(
                    JSON.stringify({error: `Grupo de TFMs con id ${TFM_group} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(TFM_data.tipo !== "Bloque TFMs"){
                return new Response(
                    JSON.stringify({error: `Asignatura con id ${TFM_group} encontrada en vez de bloque de TFMs`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const TFM = TFM_data.TFMs.find((trabajo) => {
                if(trabajo._id!.toString() === id){
                    return trabajo;
                }
            });

            if(TFM === undefined){
                return new Response(
                    JSON.stringify({error: `TFM con id ${id} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const TFM_Info = await Transform_TFM({
                _id: TFM._id!,
                bloque: TFM.bloque,
                titulo: TFM.titulo,
                estudiante: TFM.estudiante,
                director: TFM.director,
                miembros_tribunal: TFM.miembros_tribunal,
                convocatoria: TFM.convocatoria,
                curso_academico: TFM.curso_academico,
                fecha_defensa: TFM.fecha_defensa,
                hora_defensa: TFM.hora_defensa,
                tipo: "TFM",
            });

            if(TFM_Info.status !== 200){
                return new Response(
                    JSON.stringify(TFM_Info.json()),
                    {
                        status: TFM_Info.status,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(await TFM_Info.json()),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/titulaciones/num"){
            const titulaciones = await TitulacionesCollection.find().toArray();

            return new Response(
                JSON.stringify({titulaciones_number: titulaciones.length}),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/titulacion"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion = await TitulacionesCollection.findOne({_id: new ObjectId(id)});

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${id} no encontrada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const titulacion_info = await Transform_Titulacion(titulacion);

            if(titulacion_info.status !== 200){
                return new Response(
                    JSON.stringify(await titulacion_info.json()),
                    {
                        status: titulacion_info.status,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(await titulacion_info.json()),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/titulacion/convocatorias"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "Falta el ID de la asignatura"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion = await TitulacionesCollection.findOne({_id: new ObjectId(id)});

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${id} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(titulacion.convocatorias_disponibles),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/titulacion/cursos"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "Falta el ID de la titulación"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion = await TitulacionesCollection.findOne({_id: new ObjectId(id)});

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${id} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({cursos: titulacion.cursos}),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/titulacion/universidades"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "Falta el ID de la asignatura"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion = await TitulacionesCollection.findOne({_id: new ObjectId(id)});

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${id} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(titulacion.universidades),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/titulacion/cursos_aptos"){
            const id = searchParams.get("id");

            if(!id){
                return new Response(
                    JSON.stringify({error: "Falta el ID de la asignatura"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion = await TitulacionesCollection.findOne({_id: new ObjectId(id)});

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${id} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(titulacion.grados_aptos),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
	}
    else if(method === "POST"){
        if(path === "/persona"){
            const data = await req.json();
            const nombre: string | undefined = data.nombre;
            const apellido_1: string | undefined = data.apellido_1;
            const apellido_2: string | undefined = data.apellido_2;
            const DNI: string | undefined = data.DNI;
            const prefijo_movil: string | undefined = data.prefijo_movil;
            const numero_movil: string | undefined = data.numero_movil;
            const email: string | undefined = data.email;
            const password: string | undefined = data.password;
            const grado_academico: string | undefined = data.grado_academico;
            const universidad: string | undefined = data.universidad;
            const curso_admision: string | undefined = data.curso_admision;
            const rol: "Estudiante" | "Administrativo" | "Coordinador" | "Profesor" | undefined = data.rol;
            const titulacion: string | undefined = data.titulacion;

            if(!nombre || !apellido_1 || !DNI || !email || !rol || !titulacion){
                return new Response(
                    JSON.stringify({error: "Falta información de la persona"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            let surname_2: string | undefined = ""

            if(!apellido_2){
                surname_2 = undefined;
            }
            else{
                surname_2 = apellido_2;
            }

            const persona_email = await PersonasCollection.findOne({email: email});
            const persona_DNI = await PersonasCollection.findOne({DNI: DNI});

            if(persona_email){
                return new Response(
                    JSON.stringify({error: `Persona con email ${email} ya existe`}),
                    {
                        status: 409,
                        headers: headers,
                    }
                );
            }
            else if(persona_DNI){
                return new Response(
                    JSON.stringify({error: `Persona con DNI ${DNI} ya existe`}),
                    {
                        status: 409,
                        headers: headers,
                    }
                );
            }
            
            const email_validation = await Validate_Email(email);

            if(email_validation.status !== 200){
                return new Response(
                    JSON.stringify(await email_validation.json()),
                    {
                        status: email_validation.status,
                        headers: headers,
                    }
                );
            }

            let phone_prefix: string | undefined = "";
            let phone_number: string | undefined = "";

            if(!prefijo_movil || !numero_movil){
                phone_prefix = undefined;
                phone_number = undefined;
            }
            else{
                const validation = await Validate_Phone(prefijo_movil, numero_movil);

                if(validation.status !== 200){
                    return new Response(
                        JSON.stringify(await validation.json()),
                        {
                            status: validation.status,
                            headers: headers,
                        }
                    );
                }
                else{
                    const phone_error = await PersonasCollection.findOne({prefijo_movil: prefijo_movil, numero_movil: numero_movil});

                    if(phone_error){
                        return new Response(
                            JSON.stringify({error: `Persona con teléfono ${prefijo_movil} ${numero_movil} ya existe`}),
                            {
                                status: 409,
                                headers: headers,
                            }
                        );
                    }

                    phone_prefix = prefijo_movil.replaceAll(" ","+");
                    phone_number = numero_movil;
                }
            }

            const titulacion_exists = await TitulacionesCollection.findOne({_id: new ObjectId(titulacion)});

            if(!titulacion_exists){
                return new Response(
                    JSON.stringify({error: "Titulación no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            if(rol === "Administrativo"){
                if(!password){
                    return new Response(
                        JSON.stringify({error: "Falta información de la persona"}),
                        {
                            status: 400,
                            headers: headers,
                        }
                    );
                }

                const { insertedId } = await PersonasCollection.insertOne(
                    {
                        nombre: nombre,
                        apellido_1: apellido_1,
                        apellido_2: surname_2,
                        DNI: DNI,
                        prefijo_movil: phone_prefix,
                        numero_movil: phone_number,
                        email: email,
                        password: password,
                        rol: "Administrativo",
                    }
                );

                const admins = titulacion_exists.administrativos;
                admins.push(insertedId);

                const { modifiedCount } = await TitulacionesCollection.updateOne(
                    {_id: titulacion_exists._id},
                    {
                        $set: {
                            administrativos: admins,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: "Titulacion no encotrada"}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(
                        {
                            message: `Administrativo exitosamente añadido`,
                        }
                    ),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(rol === "Coordinador"){
                if(!universidad || !password){
                    return new Response(
                        JSON.stringify({error: "Falta información de la persona"}),
                        {
                            status: 400,
                            headers: headers,
                        }
                    );
                }
                const coordinador_universidad = await PersonasCollection.findOne({universidad: universidad, rol: "Coordinador"});

                if(coordinador_universidad){
                    return new Response(
                        JSON.stringify({error: `Coordinador de la universidad ${universidad} ya existe`}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }

                const { insertedId } = await PersonasCollection.insertOne(
                    {
                        nombre: nombre,
                        apellido_1: apellido_1,
                        apellido_2: surname_2,
                        DNI: DNI,
                        prefijo_movil: phone_prefix,
                        numero_movil: phone_number,
                        email: email,
                        password: password,
                        universidad: universidad,
                        rol: "Coordinador",
                    }
                );

                const coords = titulacion_exists.docentes;
                coords.push(insertedId);

                const { modifiedCount } = await TitulacionesCollection.updateOne(
                    {_id: titulacion_exists._id},
                    {
                        $set: {
                            docentes: coords,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: "Titulacion no encotrada"}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(
                        {
                            message: `Coordinador exitosamente añadido`,
                        }
                    ),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(rol === "Estudiante"){
                if(!curso_admision || !grado_academico || !universidad){
                    return new Response(
                        JSON.stringify({error: "Falta información de la persona"}),
                        {
                            status: 400,
                            headers: headers,
                        }
                    );
                }

                const { insertedId } = await PersonasCollection.insertOne(
                    {
                        nombre: nombre,
                        apellido_1: apellido_1,
                        apellido_2: surname_2,
                        DNI: DNI,
                        prefijo_movil: phone_prefix,
                        numero_movil: phone_number,
                        email: email,
                        password: password,
                        universidad: universidad,
                        grado_academico: grado_academico,
                        curso_admision: curso_admision,
                        asignaturas_cursadas: [],
                        asignaturas_aprobadas: [],
                        rol: "Estudiante",
                    }
                );

                const alumns = titulacion_exists.alumnos;
                alumns.push(insertedId);

                const { modifiedCount } = await TitulacionesCollection.updateOne(
                    {_id: titulacion_exists._id},
                    {
                        $set: {
                            alumnos: alumns,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: "Titulacion no encotrada"}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(
                        {
                            message: `Estudiante exitosamente añadido`,
                        }
                    ),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(rol === "Profesor"){
                if(!universidad || !password){
                    return new Response(
                        JSON.stringify({error: "Falta información de la persona"}),
                        {
                            status: 400,
                            headers: headers,
                        }
                    );
                }

                const { insertedId } = await PersonasCollection.insertOne(
                    {
                        nombre: nombre,
                        apellido_1: apellido_1,
                        apellido_2: surname_2,
                        DNI: DNI,
                        prefijo_movil: phone_prefix,
                        numero_movil: phone_number,
                        email: email,
                        password: password,
                        universidad: universidad,
                        rol: "Profesor",
                    }
                );

                const profs = titulacion_exists.docentes;
                profs.push(insertedId);

                const { modifiedCount } = await TitulacionesCollection.updateOne(
                    {_id: titulacion_exists._id},
                    {
                        $set: {
                            docentes: profs,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: "Titulacion no encotrada"}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify(
                        {
                            message: `Profesor exitosamente añadido`,
                        }
                    ),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({error: "Persona no encontrada, rol inexistente"}),
                {
                    status: 404,
                    headers: headers,
                }
            );
        }
        else if(path === "/register"){
            const data = await req.json();
            const nombre: string | undefined = data.nombre;
            const apellido_1: string | undefined = data.apellido_1;
            const apellido_2: string | undefined = data.apellido_2;
            const DNI: string | undefined = data.DNI;
            const prefijo_movil: string | undefined = data.prefijo_movil;
            const numero_movil: string | undefined = data.numero_movil;
            const email: string | undefined = data.email;
            const password: string | undefined = data.password;
            const rol: "Administrativo" | undefined = data.rol;

            if(!nombre || !apellido_1 || !DNI || !email || !rol){
                return new Response(
                    JSON.stringify({error: "Falta información de la persona"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            if(rol !== "Administrativo"){
                return new Response(
                    JSON.stringify({error: "El rol de la persona tiene que ser el de 'Administrativo'"}),
                );
            }

            let surname_2: string | undefined = ""

            if(!apellido_2){
                surname_2 = undefined;
            }
            else{
                surname_2 = apellido_2;
            }

            const persona_email = await PersonasCollection.findOne({email: email});
            const persona_DNI = await PersonasCollection.findOne({DNI: DNI});

            if(persona_email || persona_DNI){
                return new Response(
                    JSON.stringify({error: "Persona ya existente"}),
                    {
                        status: 409,
                        headers: headers,
                    }
                );
            }
            
            const email_validation = await Validate_Email(email);

            if(email_validation.status !== 200){
                return new Response(
                    JSON.stringify(await email_validation.json()),
                    {
                        status: email_validation.status,
                        headers: headers,
                    }
                );
            }

            let phone_prefix: string | undefined = "";
            let phone_number: string | undefined = "";

            if(!prefijo_movil || !numero_movil){
                phone_prefix = undefined;
                phone_number = undefined;
            }
            else{
                const validation = await Validate_Phone(prefijo_movil, numero_movil);

                if(validation.status === 200){
                    phone_prefix = prefijo_movil.replaceAll(" ","+");
                    phone_number = numero_movil;
                }
                else{
                    return new Response(
                        JSON.stringify(await validation.json()),
                        {
                            status: validation.status,
                            headers: headers,
                        }
                    );
                }
            }

            if(!password){
                return new Response(
                    JSON.stringify({error: "Falta información de la persona"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const { insertedId } = await PersonasCollection.insertOne(
                {
                    nombre: nombre,
                    apellido_1: apellido_1,
                    apellido_2: surname_2,
                    DNI: DNI,
                    prefijo_movil: phone_prefix,
                    numero_movil: phone_number,
                    email: email,
                    password: password,
                    rol: rol,
                }
            );

            return new Response(
                JSON.stringify(
                    {
                        message: `Administrativo exitosamente añadido`,
                        id: insertedId,
                    }
                ),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/titulacion"){
            const data = await req.json();
            const nombre: string | undefined = data.nombre;
            const universidades: string[] | undefined = data.universidades;
            const grados_aptos: string[] | undefined = data.grados_aptos;
            const cursos: number | undefined = data.cursos;
            const convocatorias: number | undefined = data.convocatorias;
            const administrativo: string | undefined = data.administrativo;
            const creditos_TFM: number | undefined = data.creditos_TFM;
            const asignaturas: {nombre: string, curso: string, creditos: number, optatividad: string}[] | undefined = data.asignaturas;

            if(!nombre || !universidades || !grados_aptos || !cursos || !convocatorias || !administrativo || !creditos_TFM){
                return new Response(
                    JSON.stringify({error: "Falta información de la titulación"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion_exists = await TitulacionesCollection.findOne({nombre: nombre});

            if(titulacion_exists){
                return new Response(
                    JSON.stringify({error: `Titulación con nombre ${nombre} ya existente`}),
                    {
                        status: 409,
                        headers: headers,
                    }
                );
            }

            const TFM_Info = await AsignaturasCollection.insertOne(
                {
                    curso: `${cursos}º`,
                    creditos: creditos_TFM,
                    TFMs: [],
                    tipo: "Bloque TFMs",
                }
            );

            const administrativo_exists = await PersonasCollection.findOne({_id: new ObjectId(administrativo)});

            if(!administrativo_exists){
                return new Response(
                    JSON.stringify({error: `Administrativo con id ${administrativo} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(administrativo_exists.rol !== "Administrativo"){
                return new Response(
                    JSON.stringify({error: `Persona con id ${administrativo} no tiene el rol de 'Coordinador', sino el de '${administrativo_exists.rol}'`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const administrativos: ObjectId[] = [];
            administrativos.push(administrativo_exists._id);

            const admin: Administrativo_Short[] = [];
            admin.push(
                {
                    id: administrativo_exists._id.toString(),
                    nombre: administrativo_exists.nombre,
                    apellido_1: administrativo_exists.apellido_1,
                    apellido_2: administrativo_exists.apellido_2,
                    email: administrativo_exists.email,
                    rol: administrativo_exists.rol,
                }
            );

            let new_asignaturas: ObjectId[] = [];

            if(asignaturas){
                new_asignaturas = await Promise.all(asignaturas.map(async (asignatura) => {
                    const new_asig = await AsignaturasCollection.insertOne({
                        nombre: asignatura.nombre,
                        curso: asignatura.curso,
                        creditos: asignatura.creditos,
                        cursos_academicos: [],
                        optatividad: asignatura.optatividad,
                        tipo: "Asignatura",
                    });

                    return new_asig.insertedId;
                }));
            }

            const { insertedId } = await TitulacionesCollection.insertOne(
                {
                    nombre: nombre,
                    universidades: universidades,
                    grados_aptos: grados_aptos,
                    cursos: cursos,
                    convocatorias_disponibles: convocatorias,
                    asignaturas: new_asignaturas,
                    TFM: TFM_Info.insertedId,
                    administrativos: administrativos,
                    docentes: [],
                    alumnos: [],
                }
            );

            return new Response(
                JSON.stringify(
                    {
                        message: `Titulación exitosamente añadido`,
                        id: insertedId,
                        TFM: TFM_Info.insertedId,
                    }
                ),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/asignatura"){
            const data = await req.json();
            const nombre: string | undefined = data.nombre;
            const titulacion: string | undefined = data.titulacion;
            const curso: string | undefined = data.curso;
            const creditos: number | undefined = data.creditos;
            const optatividad: string | undefined = data.optatividad;

            if(!nombre || !curso || !creditos || !titulacion || !optatividad){
                return new Response(
                    JSON.stringify({error: "Falta información de la asignatura"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion_exists = await TitulacionesCollection.findOne({_id: new ObjectId(titulacion)});

            if(!titulacion_exists){
                return new Response(
                    JSON.stringify({error: `Titulación con id ${titulacion} no encontrada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const asignaturas: ObjectId[] = titulacion_exists.asignaturas;

            const asig_response = await Promise.all(asignaturas.map(async (asig) => {
                const asigDB = await AsignaturasCollection.findOne({_id: asig});

                if(!asigDB){
                    return new Response(
                        JSON.stringify({error: `Asignatura con id ${asig} no encotrada`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }
                else if(asigDB.tipo !== "Asignatura"){
                    return new Response(
                        JSON.stringify({error: `Bloque de TFM con id ${asig} encontrado`}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }
                else if(asigDB.nombre === nombre){
                    return new Response(
                        JSON.stringify({error: `${nombre} ya existe en la titulación`}),
                        {
                            status: 409,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify({message: "Todo correcto"}),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }));
            
            const bad_response = asig_response.find((response) => {
                if(response.status !== 200){
                    return response;
                }
            });

            if(bad_response !== undefined){
                return new Response(
                    JSON.stringify(await bad_response.json()),
                    {
                        status: bad_response.status,
                        headers: headers,
                    }
                );
            }

            const curso_rep = Number(curso.replace("º",""));
            if(titulacion_exists.cursos < curso_rep){
                return new Response(
                    JSON.stringify({error: "El curso en el que se cursa la asignatura no puede ser superior a los que tiene la titulación"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const { insertedId } = await AsignaturasCollection.insertOne(
                {
                    nombre: nombre,
                    curso: curso,
                    cursos_academicos: [],
                    creditos: creditos,
                    optatividad: optatividad,
                    tipo: "Asignatura",
                }
            );

            asignaturas.push(insertedId);

            const { modifiedCount } = await TitulacionesCollection.updateOne(
                {
                    _id: titulacion_exists._id,
                },
                {
                    $set: {
                        asignaturas: asignaturas,
                    }
                }
            );

            if(modifiedCount === 0){
                return new Response(
                    JSON.stringify({error: "No se ha podido insertar la asignatura"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(
                    {
                        message: `Asignatura exitosamente añadida`,
                        id: insertedId,
                    }
                ),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/curso"){
            const data = await req.json();
            const asignatura: string | undefined = data.asignatura;
            const curso: string | undefined = data.curso;

            if(!asignatura || !curso){
                return new Response(
                    JSON.stringify({error: "Falta algún dato de la asignatura"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const asignatura_exists = await AsignaturasCollection.findOne({_id: new ObjectId(asignatura)});

            if(!asignatura_exists){
                return new Response(
                    JSON.stringify({error: `Asignatura con id ${asignatura} no encontrada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(asignatura_exists.tipo !== "Asignatura"){
                return new Response(
                    JSON.stringify({error: `Bloque de TFMs con id ${asignatura_exists._id} encontrada en vez de asignatura`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const curso_exists = asignatura_exists.cursos_academicos.find((academico) => {
                if(academico.curso_academico === curso){
                    return academico
                }
            });

            if(curso_exists !== undefined){
                return new Response(
                    JSON.stringify({error: `${curso} ya existe en la asignatura`}),
                    {
                        status: 409,
                        headers: headers,
                    }
                );
            }

            const profesores: string[] | undefined = data.profesores;
            const docentes: ObjectId[] = [];

            if(profesores){                
                const docentes_exists = await PersonasCollection.find({email: {$in: profesores}}).toArray();

                if(profesores.length !== docentes_exists.length){
                    return new Response(
                        JSON.stringify({error: `${profesores.length - docentes_exists.length} docentes no encontrados`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                const persona = docentes_exists.find((docente) => {
                    if(docente.rol !== "Coordinador" && docente.rol !== "Profesor"){
                        return docente;
                    }
                });

                if(persona !== undefined){
                    return new Response(
                        JSON.stringify({error: `Persona con id ${persona._id} tiene el rol de '${persona.rol}', no el de 'Profesor' o el de 'Coordinador'`}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }

                docentes_exists.forEach((docente) => docentes.push(docente._id));
            }

            const estudiantes: string[] | undefined = data.estudiantes;
            const alumnos: ObjectId[] = [];
            const conv_ordinaria: AlumnoDB[] = [];

            if(estudiantes){
                const estudiantes_exists = await PersonasCollection.find({email: {$in: estudiantes}}).toArray();

                estudiantes_exists.forEach((alumno) => {
                    if(alumno.rol !== "Estudiante"){
                        return new Response(
                            JSON.stringify({error: `Persona con email ${alumno.email} no tiene rol de 'Estudiante', sino de '${alumno.rol}'`}),
                            {
                                status: 406,
                                headers: headers,
                            }
                        );
                    }
                    
                    alumnos.push(alumno._id);

                    const asig_cursadasDB: Asignatura_alumno_DB[] = [];
                    alumno.asignaturas_cursadas.forEach((curso) => {
                        if((curso.tipo === "Asignatura") && (curso.asignatura === new ObjectId(asignatura) && (curso.convocatoria_name === "Extraordinaria"))){
                            asig_cursadasDB.push(curso);
                        }
                    });

                    let conv_dinamica: number = 0;

                    if(asig_cursadasDB.length === 0){
                        conv_dinamica = 1;
                    }
                    else{
                        asig_cursadasDB.forEach((asig) => {
                            const asig_split = asig.convocatoria_num.split("º");

                            if(Number(asig_split[0]) > conv_dinamica){
                                conv_dinamica = Number(asig_split[0]);
                            }
                            else if((Number(asig_split[0]) === conv_dinamica) && (asig.nota === "No presentado")){
                                conv_dinamica = Number(asig_split[0]);
                            }
                            else if((Number(asig_split[0]) === conv_dinamica) && (Number(asig.nota) < 5.0)){
                                conv_dinamica = Number(asig_split[0])+1;
                            }
                        });
                    }

                    conv_ordinaria.push(
                        {
                            estudiante: alumno._id,
                            convocatoria_num: `${conv_dinamica}º`,
                            convocatoria_name: "Ordinaria",
                            nota: "Sin calificar",
                            tipo: "Alumno",
                        }
                    );
                });
            }

            if(alumnos.length !== conv_ordinaria.length){
                return new Response(
                    JSON.stringify({error: `${alumnos.length - conv_ordinaria.length} alumnos no se han podido insertar en la convocatoria ordinaria`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const new_curso_id: ObjectId = new ObjectId();

            const new_curso: Asignatura_curso_DB = {
                id: new_curso_id,
                curso_academico: curso,
                profesores: docentes,
                estudiantes: alumnos,
                alumnos_ordinaria: conv_ordinaria,
                ordinaria_firmada: false,
                alumnos_extraordinaria: [],
                extraordinaria_firmada: false,
                tipo: "Curso",
            }

            asignatura_exists.cursos_academicos.push(new_curso);

            const { modifiedCount } = await AsignaturasCollection.updateOne(
                {
                    _id: new ObjectId(asignatura),
                },
                {
                    $set: {cursos_academicos: asignatura_exists.cursos_academicos}
                }
            );

            if(modifiedCount === 0){
                return new Response(
                    JSON.stringify({error: "No se ha insertado en curso en la asignatura"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(
                    {
                        message: `Curso exitosamente añadido`,
                        id: new_curso_id.toString(),
                    }
                ),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        /*else if(path === "/curso/notas"){
            const data = await req.json();
            const asignatura: string | undefined = data.asignatura;
            const curso: string | undefined = data.curso;
            const convocatoria: "Ordinaria" | "Extraordinaria" | undefined = data.convocatoria;
            const notas: {DNI: string, nota: number | "No presentado"}[] | undefined = data.notas;

            if(!asignatura || !curso || !convocatoria || !notas){
                return new Response(
                    JSON.stringify({error: "Falta información de las notas"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            let nota_count = 0;
            const nota_error = notas.find((calificacion) => {
                if((typeof calificacion.nota === "string") && (calificacion.nota !== "No presentado")){
                    return calificacion;
                }
                else if(nota_count === notas.length - 1){
                    return undefined;
                }

                nota_count += 1;
            });

            if(nota_error){
                return new Response(
                    JSON.stringify({error: `Calificación del alumno con DNI ${nota_error.DNI} tiene que ser un número o 'No presentado'`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const asignatura_exists = await AsignaturasCollection.findOne({_id: new ObjectId(asignatura)});

            if(!asignatura_exists){
                return new Response(
                    JSON.stringify({error: `Asignatura con id ${asignatura} no encontrada`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(asignatura_exists.tipo !== "Asignatura"){
                return new Response(
                    JSON.stringify({error: `Bloque de TFMs con id ${asignatura_exists._id} encontrada en vez de asignatura`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            let index: number = 0;
            const curso_academico = asignatura_exists.cursos_academicos.find((cursito) => {
                if(cursito.curso_academico === curso){
                    return cursito;
                }
                else if(index === asignatura_exists.cursos_academicos.length){
                    return undefined;
                }

                index += 1;
            });

            if(curso_academico === undefined){
                return new Response(
                    JSON.stringify({error: `${curso} no encontrado en la asignatura con id ${asignatura}`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const new_cursos: Asignatura_curso_DB[] = [];
            const curso_alumnos: Alumno[] = [];

            const curso_final: Asignatura_curso_DB = {
                id: curso_academico.id,
                curso_academico: curso_academico.curso_academico,
                profesores: curso_academico.profesores,
                estudiantes: curso_academico.estudiantes,
                alumnos_ordinaria: [],
                ordinaria_firmada: curso_academico.ordinaria_firmada,
                alumnos_extraordinaria: [],
                extraordinaria_firmada: curso_academico.extraordinaria_firmada,
                tipo: "Curso",
            }

            if(convocatoria === "Ordinaria"){
                const curso_alumnosDB: Response[] = await Promise.all(curso_academico.alumnos_ordinaria.map(async (person) => await Transform_Alumno(person)));

                const data: (Alumno | Error_info)[] = await Promise.all(curso_alumnosDB.map(async (curso) => {
                    if(curso.status !== 200){
                        const error = await curso.json();

                        return {
                            tipo: "error",
                            status: curso.status,
                            error: error.error,
                        }
                    }
                    else{
                        return await curso.json();
                    }
                }));

                data.forEach((data_info) => {
                    if(data_info.tipo === "error"){
                        const status = data_info.status;

                        return new Response(
                            JSON.stringify(data_info.error),
                            {
                                status: status,
                                headers: headers,
                            }
                        );
                    }
                    else{
                        curso_alumnos.push(data_info as Alumno);
                    }
                });

                if(curso_academico.alumnos_ordinaria.length !== curso_alumnos.length){
                    return new Response(
                        JSON.stringify({error: `${curso_academico.alumnos_ordinaria.length - curso_alumnos.length} alumnos en ordinaria no encontrados`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                notas.forEach((calificacion) => {
                    curso_alumnos.forEach((alumno) => {
                        if((calificacion.DNI === alumno.estudiante.DNI) && (alumno.nota === "Sin calificar")){
                            curso_final.alumnos_ordinaria.push(
                                {
                                    estudiante: new ObjectId(alumno.estudiante.id),
                                    convocatoria_name: alumno.convocatoria_name,
                                    convocatoria_num: alumno.convocatoria_num,
                                    nota: calificacion.nota,
                                    tipo: "Alumno",
                                }
                            );

                            if(calificacion.nota === "No presentado" || calificacion.nota < 5){
                                curso_final.alumnos_extraordinaria.push(
                                    {
                                        estudiante: new ObjectId(alumno.estudiante.id),
                                        convocatoria_name: alumno.convocatoria_name,
                                        convocatoria_num: alumno.convocatoria_num,
                                        nota: "Sin calificar",
                                        tipo: "Alumno",
                                    }
                                );
                            }
                        }
                    });
                });

                let count = 0;
                const alumno_sin_nota = curso_final.alumnos_ordinaria.find((alumno) => {
                    if(alumno.nota === "Sin calificar"){
                        return alumno;
                    }
                    else if(count === curso_final.alumnos_ordinaria.length - 1){
                        return undefined;
                    }

                    count += 1;
                });

                if(alumno_sin_nota !== undefined){
                    return new Response(
                        JSON.stringify({error: `Nota del alumno con id ${alumno_sin_nota.estudiante} no ha sido modificada`}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }
            }
            else if(convocatoria === "Extraordinaria"){
                curso_academico.alumnos_ordinaria.forEach((alumno) => {
                    curso_final.alumnos_ordinaria.push(alumno);
                });

                const curso_alumnosDB: Response[] = await Promise.all(curso_academico.alumnos_extraordinaria.map(async (person) => await Transform_Alumno(person)));

                const data: (Alumno | Error_info)[] = await Promise.all(curso_alumnosDB.map(async (curso) => {
                    if(curso.status !== 200){
                        const error = await curso.json();
                        
                        return {
                            tipo: "error",
                            status: curso.status,
                            error: error.error,
                        }
                    }
                    else{
                        return await curso.json();
                    }
                }));

                data.forEach((data_info) => {
                    if(data_info.tipo === "error"){
                        const status = data_info.status;

                        return new Response(
                            JSON.stringify(data_info.error),
                            {
                                status: status,
                                headers: headers,
                            }
                        );
                    }
                    else{
                        curso_alumnos.push(data_info as Alumno);
                    }
                });

                if(curso_academico.alumnos_extraordinaria.length !== curso_alumnos.length){
                    return new Response(
                        JSON.stringify({error: `${curso_academico.alumnos_extraordinaria.length - curso_alumnos.length} alumnos en extraordinaria no encontrados`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                notas.forEach((calificacion) => {
                    curso_alumnos.forEach((alumno) => {
                        if((calificacion.DNI === alumno.estudiante.DNI) && (alumno.nota === "Sin calificar")){
                            curso_final.alumnos_extraordinaria.push(
                                {
                                    estudiante: new ObjectId(alumno.estudiante.id),
                                    convocatoria_name: alumno.convocatoria_name,
                                    convocatoria_num: alumno.convocatoria_num,
                                    nota: calificacion.nota,
                                    tipo: "Alumno",
                                }
                            );
                        }
                    });
                });

                let count = 0;
                const alumno_sin_nota = curso_final.alumnos_extraordinaria.find((alumno) => {
                    if(alumno.nota === "Sin calificar"){
                        return alumno;
                    }
                    else if(count === curso_final.alumnos_extraordinaria.length - 1){
                        return undefined;
                    }

                    count += 1;
                });

                if(alumno_sin_nota !== undefined){
                    return new Response(
                        JSON.stringify({error: `Nota del alumno con id ${alumno_sin_nota.estudiante} no ha sido modificada`}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }
            }
            else{
                return new Response(
                    JSON.stringify({error: "Hay que definir la convocatoria"}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            asignatura_exists.cursos_academicos.forEach((curso) => {
                if(curso.id !== curso_final.id){
                    new_cursos.push(curso);
                }
                else{
                    new_cursos.push(curso_final);
                };
            });

            const { modifiedCount } = await AsignaturasCollection.updateOne(
                {_id: new ObjectId(asignatura)},
                {$set: {cursos_academicos: new_cursos}}
            );

            if(modifiedCount === 0){
                return new Response(
                    JSON.stringify({error: "No se han podido actualizar las notas"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({message: "Notas actualizadas"}),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }*/
        else if(path === "/curso/convocatoria/notas"){
            const data = await req.json();
            const asignatura = data.asignatura;
            const curso = data.curso;
            const convocatoria = data.curso;
            const notas: {alumno: string, nota: "Sin calificar" | "No presentado" | number} | undefined = data.notas;

            if(!asignatura || !curso || !convocatoria || !notas){
                return new Response(
                    JSON.stringify({error: `Faltan datos para actualizar las notas de la convocatoria ${convocatoria.toLowerCase()} de ${asignatura.toLowerCase()}`}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const asignatura_exists = await AsignaturasCollection.findOne({_id: new ObjectId(asignatura)});

            if(!asignatura_exists){
                return new Response(
                    JSON.stringify({error: "Asignatura no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(asignatura_exists.tipo !== "Asignatura"){
                return new Response(
                    JSON.stringify({error: "Bloque de TFM encontrado en vez de una asignatura"}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const curso_exists = asignatura_exists.cursos_academicos.find((cursito) => {
                if(cursito.id.toString() === curso){
                    return cursito;
                }
            });

            if(curso_exists === undefined){
                return new Response(
                    JSON.stringify({error: `Curso no encontrado en ${asignatura_exists.nombre}`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            if(convocatoria === "Ordinaria"){}
            else if(convocatoria === "Extraordinaria"){}

            return new Response(
                JSON.stringify({error: "La convocatoria tiene que ser ordinaria o extraordinaria"}),
                {
                    status: 406,
                    headers: headers,
                }
            );
        }
        else if(path === "/TFM"){
            const data = await req.json();
            const titulacion: string | undefined = data.titulacion;
            const titulo: string | undefined = data.titulo;
            const alumno: string | undefined = data.alumno;
            const director: string[] | undefined = data.director;
            const tribunal: string[] | undefined = data.tribunal;
            const curso: string | undefined = data.curso;
            const fecha_def: string | undefined = data.fecha_def;
            const hora_def: string | undefined  = data.hora_def;
            const convocatoria: string | undefined = data.convocatoria;
            const nota: number | "No presentado" | undefined = data.nota;

            if(!titulacion || !titulo || !alumno || !director || !tribunal || !curso || !fecha_def || !hora_def || !convocatoria || !nota){
                return new Response(
                    JSON.stringify({error: "Falta información del TFM"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion_exists = await TitulacionesCollection.findOne({_id:  new ObjectId(titulacion)});

            if(!titulacion_exists){
                return new Response(
                    JSON.stringify({error: "La titulación del TFM no ha sido encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const TFM_block = await AsignaturasCollection.findOne({_id: titulacion_exists.TFM});

            if(!TFM_block){
                return new Response(
                    JSON.stringify({error: `Bloque de TFM de la titulación ${titulacion_exists.nombre} no ha sido encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(TFM_block.tipo !== "Bloque TFMs"){
                return new Response(
                    JSON.stringify({error: `Asignatura con id ${TFM_block._id} encontrada en vez de bloque de TFMs`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const alumno_exists = await PersonasCollection.findOne({DNI: alumno});

            if(!alumno_exists){
                return new Response(
                    JSON.stringify({error: `Alumno con DNI ${alumno} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(alumno_exists.rol !== "Estudiante"){
                return new Response(
                    JSON.stringify({error: `Persona con DNI ${alumno} no tiene rol de 'Estudiante', sino de '${alumno_exists.rol}'`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const director_id = director.map((docente) => new ObjectId(docente));            
            const director_exists = await PersonasCollection.find({_id: {$in: director_id}}).toArray();

            if(director.length !== director_exists.length){
                return new Response(
                    JSON.stringify({error: `${director.length - director_exists.length} director/es no encontrados`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const director_rol = director_exists.find((docente) => {
                if(docente.rol !== "Profesor" && docente.rol !== "Coordinador"){
                    return docente
                }
            });

            if(director_rol !== undefined){
                return new Response(
                    JSON.stringify({error: `Persona con rol de '${director_rol.rol}' debería tener el rol de 'Profesor' ni de 'Coordinador'`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }
            
            const id_director: ObjectId[] = director_exists.map((docente) => docente._id);

            const tribunal_id = tribunal.map((miembro) => new ObjectId(miembro));

            const tribunal_exists = await PersonasCollection.find({_id: {$in: tribunal_id}}).toArray();

            if(tribunal.length !== tribunal_exists.length){
                return new Response(
                    JSON.stringify({error: `${tribunal.length - tribunal_exists.length} miembro/s del tribunal no encontrados`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const tribunal_rol = tribunal_exists.find((docente) => {
                if(docente.rol !== "Profesor" && docente.rol !== "Coordinador"){
                    return docente;
                }
            });

            if(tribunal_rol !== undefined){
                return new Response(
                    JSON.stringify({error: `Persona con rol de '${tribunal_rol.rol}' debería tener el rol de 'Profesor' ni de 'Coordinador'`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const id_tribunal: ObjectId[] = tribunal_exists.map((miembro) => miembro._id);

            if(typeof nota === "string" && nota !== "No presentado"){
                return new Response(
                    JSON.stringify({error: `La nota tiene que ser un número o 'No presentado', no '${nota}'`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const TFM_new_ID = new ObjectId();

            const new_TFM: TFM_DB = {
                _id: TFM_new_ID,
                bloque: TFM_block._id,
                titulo: titulo,
                curso_academico: curso,
                estudiante: alumno_exists._id,
                director: id_director,
                miembros_tribunal: id_tribunal,
                fecha_defensa: fecha_def,
                hora_defensa: hora_def,
                convocatoria: {
                    nombre: convocatoria,
                    nota: nota,
                },
                tipo: "TFM",
            }

            TFM_block.TFMs.push(new_TFM);

            const { modifiedCount } = await AsignaturasCollection.updateOne(
                {
                    _id: TFM_block._id,
                },
                {
                    $set: {
                        TFMs: TFM_block.TFMs
                    }
                }
            );

            if(modifiedCount === 0){
                return new Response(
                    JSON.stringify({error: "Bloque de TFMs no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            const TFM_curso_exists = alumno_exists.asignaturas_cursadas.find((asig) => {
                if((asig.tipo === "TFM") && (asig.curso_academico === curso) && (asig.convocatoria.nombre === convocatoria)){
                    return asig;
                }
            });

            if(TFM_curso_exists !== undefined){
                return new Response(
                    JSON.stringify({error: `Alumno con DNI ${alumno} ya se presentó en el ${curso.toLowerCase()} en la convocatoria ${convocatoria}`}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            const new_TFM_data: TFM_alumno_DB = {
                TFM: TFM_new_ID,
                bloque: TFM_block._id,
                titulo: titulo,
                curso_academico: curso,
                fecha_defensa: fecha_def,
                hora_defensa: hora_def,
                convocatoria: {
                    nombre: convocatoria,
                    nota: nota,
                },
                tipo: "TFM",
            }

            alumno_exists.asignaturas_cursadas.push(new_TFM_data);

            if((nota !== "No presentado") && (nota >= 5.0)){
                alumno_exists.asignaturas_aprobadas.push(new_TFM_data);
            }

            const alumno_update = await PersonasCollection.updateOne(
                {_id: alumno_exists._id},
                {
                    $set: {
                        asignaturas_cursadas: alumno_exists.asignaturas_cursadas,
                        asignaturas_aprobadas: alumno_exists.asignaturas_aprobadas,
                    }
                }
            );

            if(alumno_update.modifiedCount === 0){
                return new Response(
                    JSON.stringify({error: `Alumno con id ${alumno_exists._id.toString()} no actualizado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify(
                    {
                        message: `TFM ha sido exitosamente insertado`,
                        id: TFM_new_ID.toString(),
                    }
                ),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
    }
    else if(method === "PUT"){
        if(path === "/datos_persona"){
            const data = await req.json();
            const id: string | undefined = data.id;
            const rol: "Estudiante" | "Profesor" | "Coordinador" | "Administrativo" | undefined = data.rol;
            const nombre: string | undefined = data.nombre;
            const apellido_1: string | undefined = data.apellido_1;
            const apellido_2: string | undefined = data.apellido_2;
            const email: string | undefined = data.email;
            const password: string | undefined = data.password;
            const prefix: string | undefined = data.prefix;
            const phone: string | undefined = data.phone;

            if(!id && !rol){
                return new Response(
                    JSON.stringify({error: "ID y rol no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                )
            }
            
            let pass = "";
            if(password === undefined || password === null || password === ""){
                const user = await PersonasCollection.findOne({_id: new ObjectId(id)});

                if(!user){
                    return new Response(
                        JSON.stringify({error: "Persona no encontrada"}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }
                else if(user.rol !== "Estudiante"){
                    pass = user.password;
                }
            }
            else{
                pass = password;
            }

            if(!nombre && !apellido_1 && !email){
                return new Response(
                    JSON.stringify({error: "Tienes que aportar algún dato para actualizar"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            if(email){
                const data = await Validate_Email(email);

                if(data.status !== 200){
                    return new Response(
                        JSON.stringify(await data.json()),
                        {
                            status: data.status,
                            headers: headers,
                        }
                    );
                }

                const email_error = await PersonasCollection.findOne({email: email});

                if(email_error && email_error._id.toString() !== id){
                    return new Response(
                        JSON.stringify({error: `Email ${email} ya pertenece a otra persona`}),
                        {
                            status: 409,
                            headers: headers,
                        }
                    );
                }
            }
            
            if(prefix && phone){
                const data = await Validate_Phone(prefix, phone);

                if(data.status !== 200){
                    return new Response(
                        JSON.stringify(await data.json()),
                        {
                            status: data.status,
                            headers: headers,
                        }
                    );
                }

                const phone_error = await PersonasCollection.findOne({prefijo_movil: prefix, numero_movil: phone});

                if(phone_error && phone_error._id.toString() && id){
                    return new Response(
                        JSON.stringify({error: `Teléfono ${prefix} ${phone} ya pertenece a otra persona`}),
                        {
                            status: 409,
                            headers: headers,
                        }
                    );
                }
            }

            if(rol === "Estudiante"){
                const { modifiedCount } = await PersonasCollection.updateOne(
                    {_id: new ObjectId(id)},
                    {$set:
                        {
                            nombre: nombre,
                            apellido_1: apellido_1,
                            apellido_2: apellido_2,
                            prefijo_movil: prefix,
                            numero_movil: phone,
                            email: email,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: `Los datos del estudiante eran los mismos que se intentaban actualizar`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify({message: "Estudiante exitosamente modificado"}),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(rol === "Administrativo"){
                if(password === undefined){
                    const { modifiedCount } = await PersonasCollection.updateOne(
                    {_id: new ObjectId(id)},
                        {$set:
                            {
                                nombre: nombre,
                                apellido_1: apellido_1,
                                apellido_2: apellido_2,
                                prefijo_movil: prefix,
                                numero_movil: phone,
                                email: email,
                                password: pass,
                            }
                        }
                    );

                    if(modifiedCount === 0){
                        return new Response(
                            JSON.stringify({error: `Los datos del administrativo eran los mismos que se intentaban actualizar`}),
                            {
                                status: 404,
                                headers: headers,
                            }
                        );
                    }

                    return new Response(
                        JSON.stringify({message: "Administrativo exitosamente modificado"}),
                        {
                            status: 200,
                            headers: headers,
                        }
                    );
                }

                const { modifiedCount } = await PersonasCollection.updateOne(
                    {_id: new ObjectId(id)},
                    {$set:
                        {
                            nombre: nombre,
                            apellido_1: apellido_1,
                            apellido_2: apellido_2,
                            prefijo_movil: prefix,
                            numero_movil: phone,
                            email: email,
                            password: password,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: `Los datos del administrativo eran los mismos que se intentaban actualizar`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify({message: "Administrativo exitosamente modificado"}),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(rol === "Coordinador"){
                if(password === undefined){
                    const { modifiedCount } = await PersonasCollection.updateOne(
                    {_id: new ObjectId(id)},
                        {$set:
                            {
                                nombre: nombre,
                                apellido_1: apellido_1,
                                apellido_2: apellido_2,
                                prefijo_movil: prefix,
                                numero_movil: phone,
                                email: email,
                                password: pass,
                            }
                        }
                    );

                    if(modifiedCount === 0){
                        return new Response(
                            JSON.stringify({error: `Los datos del coordinador eran los mismos que se intentaban actualizar`}),
                            {
                                status: 404,
                                headers: headers,
                            }
                        );
                    }

                    return new Response(
                        JSON.stringify({message: "Coordinador exitosamente modificado"}),
                        {
                            status: 200,
                            headers: headers,
                        }
                    );
                }

                const { modifiedCount } = await PersonasCollection.updateOne(
                    {_id: new ObjectId(id)},
                    {$set:
                        {
                            nombre: nombre,
                            apellido_1: apellido_1,
                            apellido_2: apellido_2,
                            prefijo_movil: prefix,
                            numero_movil: phone,
                            email: email,
                            password: password,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: `Los datos del coordinador eran los mismos que se intentaban actualizar`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify({message: "Coordinador exitosamente modificado"}),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }
            else if(rol === "Profesor"){
                if(password === undefined){
                    const { modifiedCount } = await PersonasCollection.updateOne(
                        {_id: new ObjectId(id)},
                        {$set:
                            {
                                nombre: nombre,
                                apellido_1: apellido_1,
                                apellido_2: apellido_2,
                                prefijo_movil: prefix,
                                numero_movil: phone,
                                email: email,
                                password: pass,
                            }
                        }
                    );

                    if(modifiedCount === 0){
                        return new Response(
                            JSON.stringify({error: `Los datos del profesor eran los mismos que se intentaban actualizar`}),
                            {
                                status: 404,
                                headers: headers,
                            }
                        );
                    }

                    return new Response(
                        JSON.stringify({message: "Profesor exitosamente modificado"}),
                        {
                            status: 200,
                            headers: headers,
                        }
                    );
                }

                const { modifiedCount } = await PersonasCollection.updateOne(
                    {_id: new ObjectId(id)},
                    {$set:
                        {
                            nombre: nombre,
                            apellido_1: apellido_1,
                            apellido_2: apellido_2,
                            prefijo_movil: prefix,
                            numero_movil: phone,
                            email: email,
                            password: password,
                        }
                    }
                );

                if(modifiedCount === 0){
                    return new Response(
                        JSON.stringify({error: `Los datos del profesor eran los mismos que se intentaban actualizar`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                return new Response(
                    JSON.stringify({message: "Profesor exitosamente modificado"}),
                    {
                        status: 200,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({error: "Persona no encontrada"}),
                {
                    status: 404,
                    headers: headers,
                }
            );
        }
        /*if(path === "/datos_titulacion"){
            const data = await req.json();
            const id: string | undefined = data.id;
            const nombre: string | undefined = data.nombre;
            //const universidades: string[] | undefined = data.universidades;
            //const grados_aptos: string[] | undefined = data.grados_aptos;
            const cursos: number | undefined = data.cursos;
            const convocatorias: number | undefined = data.convocatorias;
            const creditos_TFM: number| undefined = data.creditos_TFM;

            if(!id){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                )
            }

            if(!nombre && !cursos && !convocatorias && !creditos_TFM){
                return new Response(
                    JSON.stringify({error: "Faltan datos para actualizar"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const titulacion = await TitulacionesCollection.findOne({_id: new ObjectId(id)});

            if(!titulacion){
                return new Response(
                    JSON.stringify({error: "Titulacion no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            
            let new_nombre = "";
            if(nombre){
                const titulacion_error = await TitulacionesCollection.findOne({nombre: nombre});

                if(titulacion_error && titulacion_error._id.toString() !== id){
                    return new Response(
                        JSON.stringify({error: `Titulación con nombre ${nombre} ya existe`}),
                        {
                            status: 409,
                            headers: headers,
                        }
                    );
                }

                new_nombre = nombre;
            }
            else{
                new_nombre = titulacion.nombre;
            }

            const new_asignaturas: ObjectId[] = [];
            let new_cursos = 1;
            if(cursos){
                new_cursos = cursos;
                const asignaturas = await AsignaturasCollection.find({_id: {$in: titulacion.asignaturas}}).toArray();

                if(titulacion.asignaturas.length !== asignaturas.length){
                    return new Response(
                        JSON.stringify({error: `${titulacion.asignaturas.length - asignaturas.length} asignaturas no encontradas`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                let count = 0;
                const asig_aux: AsignaturaDB[] = []
                const asig_error = asignaturas.find((asig) => {
                    if(asig.tipo === "Bloque TFMs"){
                        return asig;
                    }
                    else if(count === asignaturas.length - 1){
                        return undefined;
                    }

                    asig_aux.push(asig);
                    count += 1;
                });

                if(asig_error){
                    return new Response(
                        JSON.stringify({error: "Se ha encontrado un bloque de TFM entre las asignaturas"}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                const asignaturas_upt: Response[] = await Promise.all(asig_aux.map(async (asignatura) => {
                    if(Number(asignatura.curso.split("º")[0]) > cursos){
                        const asig: AsignaturaDB = {
                            _id: asignatura._id,
                            nombre: asignatura.nombre,
                            curso: `${cursos}º`,
                            cursos_academicos: asignatura.cursos_academicos,
                            creditos: asignatura.creditos,
                            tipo: asignatura.tipo,
                        }

                        const { modifiedCount } = await AsignaturasCollection.updateOne(
                            {_id: asig._id},
                            {$set: {
                                curso: asig.curso,
                            }}
                        );

                        if(modifiedCount === 0){
                            return new Response(
                                JSON.stringify({error: `${asig.nombre} no actualizado`}),
                                {
                                    status: 404,
                                    headers: headers,
                                }
                            );
                        }
                    
                        return new Response(
                            JSON.stringify(asig._id),
                            {
                                status: 200,
                                headers: headers,
                            }
                        );
                    }
                    else{
                        const asig: AsignaturaDB = {
                            _id: asignatura._id,
                            nombre: asignatura.nombre,
                            curso: asignatura.curso,
                            cursos_academicos: asignatura.cursos_academicos,
                            creditos: asignatura.creditos,
                            tipo: asignatura.tipo,
                        }

                        return new Response(
                            JSON.stringify(asig._id),
                            {
                                status: 200,
                                headers: headers,
                            }
                        );
                    }
                }));

                let count_error = 0;
                const error = asignaturas_upt.find(async (asig) => {
                    if(asig.status !== 200){
                        return asig;
                    }
                    else if(count_error === asignaturas_upt.length - 1){
                        return undefined;
                    }

                    new_asignaturas.push(await asig.json())
                    count_error += 1;
                });

                if(error !== undefined){
                    return new Response(
                        JSON.stringify(await error.json()),
                        {
                            status: error.status,
                            headers: headers,
                        }
                    );
                }
            }
            else{
                new_cursos = titulacion.cursos;
                titulacion.asignaturas.forEach((asignatura) => {
                    new_asignaturas.push(asignatura);
                });
            }

            let new_convocatorias = 0
            if(convocatorias){
                new_convocatorias = convocatorias;
            }
            else{
                new_convocatorias = titulacion.convocatorias_disponibles;
            }
            
            let bloque_upd = false;
            if(creditos_TFM){
                const bloque = await AsignaturasCollection.findOne({_id: titulacion.TFM});

                if(!bloque){
                    return new Response(
                        JSON.stringify({error: "Bloque de TFMs no encontrado"}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }
                else if(bloque.tipo !== "Bloque TFMs"){
                    return new Response(
                        JSON.stringify({error: "Se ha intentado modificar una asignatura"}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }

                const { modifiedCount } = await AsignaturasCollection.updateOne(
                    {_id: bloque._id},
                    {$set: {
                        curso: `${cursos}º`,
                        creditos: creditos_TFM,
                    }}
                );

                if(modifiedCount > 0){
                    bloque_upd = true;
                }
            }

            const { modifiedCount } = await TitulacionesCollection.updateOne(
                {_id: titulacion._id},
                {$set: {
                    nombre: new_nombre,
                    cursos: new_cursos,
                    convocatorias_disponibles: new_convocatorias,
                    asignaturas: new_asignaturas,
                }}
            );

            if(modifiedCount === 0 && bloque_upd === false){
                return new Response(
                    JSON.stringify({error: "Los datos de la titulación eran los mismos que se intentaban actualizar"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({message: "Titulación exitosamente actualizada"}),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        if(path === "/datos_asignatura"){
            const data = await req.json();
            const id: string | undefined = data.id;
            const nombre: string | undefined = data.name;
            const curso: string | undefined = data.curso;
            const creditos: number | undefined = data.creditos;

            if(!id){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                )
            }

            if(!nombre && !curso && !creditos){
                return new Response(
                    JSON.stringify({error: "Faltan datos para actualizar"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            const asignatura = await AsignaturasCollection.findOne({_id: new ObjectId(id)});

            if(!asignatura){
                return new Response(
                    JSON.stringify({error: "Asignatura no encontrada"}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }
            else if(asignatura.tipo !== "Asignatura"){
                return new Response(
                    JSON.stringify({error: "Se ha intentado modificar un bloque de TMFs no una asignatura"}),
                    {
                        status: 406,
                        headers: headers,
                    }
                );
            }

            let new_nombre = "";
            if(nombre){
                new_nombre = nombre;
            }
            else{
                new_nombre = asignatura.nombre;
            }

            let new_curso = "1º"; 
            if(curso){
                const curso_split = curso.split("º");

                const titulacion_in = await TitulacionesCollection.findOne({asignaturas: new ObjectId(id)});
                
                if(!titulacion_in){
                    return new Response(
                        JSON.stringify({error: `Titulación de la asignatura con id ${id} no encontrada`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                if(Number(curso_split[0]) > titulacion_in.cursos){
                    return new Response(
                        JSON.stringify({error: `Curso de la asignatura debe ser inferior a ${titulacion_in.cursos}`}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }

                new_curso = curso;
            }
            else{
                new_curso = asignatura.curso;
            }

            let new_creditos = 0;
            if(creditos){
                new_creditos = creditos;
            }
            else{
                new_creditos = asignatura.creditos;
            }

            const { modifiedCount } = await AsignaturasCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: {
                    nombre: new_nombre,
                    curso: new_curso,
                    creditos: new_creditos,
                }}
            );

            if(modifiedCount === 0){
                return new Response(
                    JSON.stringify({error: `Los datos de la asignatura eran los mismos que se intentaban actualizar`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({message: "Asignatura exitosamente actualizada"}),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }
        else if(path === "/datos_curso"){
            const data = await req.json();
            const id: string | undefined = data.id;
            const nombre: string | undefined = data.name;
            //const alumnos: any | undefined = data.alumnos;
            //const docentes: any | undefined = data.docentes;

            if(!id){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                )
            }

            if(!nombre){
                return new Response(
                    JSON.stringify({error: "Faltan datos para actualizar"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            //const 
        }
        else if(path === "/datos_TFM_block"){
            const data = await req.json();
            const id: string | undefined = data.id;
            const curso: string | undefined = data.curso;
            const creditos: number | undefined = data.creditos;

            if(!id){
                return new Response(
                    JSON.stringify({error: "ID no encontrado"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                )
            }

            if(!curso && !creditos){
                return new Response(
                    JSON.stringify({error: "Faltan datos para actualizar"}),
                    {
                        status: 400,
                        headers: headers,
                    }
                );
            }

            if(curso){
                const curso_split = curso.split("º");

                const titulacion_in = await TitulacionesCollection.findOne({TFM: new ObjectId(id)});
                
                if(!titulacion_in){
                    return new Response(
                        JSON.stringify({error: `Titulación del bloque de TFMs con id ${id} no encontra`}),
                        {
                            status: 404,
                            headers: headers,
                        }
                    );
                }

                if(Number(curso_split[0]) > titulacion_in.cursos){
                    return new Response(
                        JSON.stringify({error: `Curso del bloque de TFMs debe ser inferior a ${titulacion_in.cursos}`}),
                        {
                            status: 406,
                            headers: headers,
                        }
                    );
                }
            }

            const { modifiedCount } = await AsignaturasCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: {curso: curso, creditos: creditos}}
            );

            if(modifiedCount === 0){
                return new Response(
                    JSON.stringify({error: `Bloque de TFMs con id ${id} no encontrado`}),
                    {
                        status: 404,
                        headers: headers,
                    }
                );
            }

            return new Response(
                JSON.stringify({message: "Asignatura exitosamente actualizada"}),
                {
                    status: 200,
                    headers: headers,
                }
            );
        }*/
    }

	return new Response(
		"Path not found",
		{
			status: 404,
            headers: headers,
		}
	);
};


Deno.serve(
	{
		port: Number(Deno.env.get("PORT")) || 4000,
		hostname: "0.0.0.0",
	},
	handler
);
