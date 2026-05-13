import { Coordinador, Coordinador_Short, CoordinadorDB } from "../../types/Personas/Coordinador.ts";

export const Transform_Coordinador = (coordinador: CoordinadorDB): Coordinador => {
    return{
        id: coordinador._id!.toString(),
        nombre: coordinador.nombre,
        apellido_1: coordinador.apellido_1,
        apellido_2: coordinador.apellido_2,
        prefijo_movil: coordinador.prefijo_movil,
        numero_movil: coordinador.numero_movil,
        email: coordinador.email,
        rol: coordinador.rol,
        universidad: coordinador.universidad,
    }
}

export const Short_Coordinador_DB = (persona: CoordinadorDB): Coordinador_Short => {
    return{
        id: persona._id!.toString(),
        nombre: persona.nombre,
        apellido_1: persona.apellido_1,
        apellido_2: persona.apellido_2,
        email: persona.email,
        rol: persona.rol,
    };
}