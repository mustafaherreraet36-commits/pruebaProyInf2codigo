// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  RESUMEN SEQUELIZE (LO MÁS TOMADO) - CHEATSHEET RÁPIDO                 ║
// ║  Keywords: modelo, asociacion, findAll, include, create, update, delete ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// LEYENDA DE MARCADORES (para buscar con Ctrl+F):
//   // ---------- TÍTULO ----------  → Sección principal
//   // ----- subtítulo -----         → Subtítulo
//   //|  → Formato / Sintaxis
//   //•  → Tip / Dato extra
//   //⚠  → Cuidado / Error común

const { Sequelize, DataTypes, Op } = require("sequelize");

const sequelize = new Sequelize('NombreBD', 'root', "", {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

// -------------------- MODELO Y VALIDACIONES --------------------
// Palabras Clave: definir, crear, validar, obligar, permitir

//| Definición básica y validaciones comunes
const Trabajador = sequelize.define(
    'Trabajador',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false // NOT NULL
        },
        apodo: {
            type: DataTypes.STRING,
            validate: {
                // Validación personalizada
                tieneNums(value) {
                    // value es el valor que se intenta guardar
                    for (let i = 0; i < value.length; i++) {
                        if (['1', '2', '3', '4'].includes(value[i])) {
                            throw new Error("No se permiten los números 1, 2, 3 ni 4");
                        }
                    }
                }
            }
        },
        mail: {
            type: DataTypes.STRING,
            unique: true, // UNIQUE Constraint SQL
            validate: {
                isEmail: true // Validación de Sequelize
            }
        },
        departamento: {
            type: DataTypes.STRING,
            validate: {
                isIn: {
                    args: [["RRHH", "Ventas", "Servicio Técnico"]],
                    msg: "Departamento no válido" // Mensaje de error personalizado
                }
            }
        },
        admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },
    {
        timestamps: false,     // Desactiva createdAt y updatedAt
        freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
        tableName: 'trabajadores'
    }
);

// Modelos auxiliares para el ejemplo de asociaciones
const Sello = sequelize.define('Sello', { id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true } });
const Lapiz = sequelize.define('Lapiz', { id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true } });
const Empresa = sequelize.define('Empresa', { id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true } });


// -------------------- ASOCIACIONES (RELACIONES) --------------------
// Palabras Clave: relacionar, asociar, unir, vincular, enlazar

// ----- 1x1 (Un Trabajador tiene Un Sello) -----
Trabajador.hasOne(Sello, { foreignKey: 'dueñoId' });
Sello.belongsTo(Trabajador, { as: 'dueño', foreignKey: 'dueñoId' }); 
//⚠ 'as' cambia el alias de la relación. En el include o get() se usará 'dueño'

// ----- 1xM (Un Trabajador tiene Muchos Lápices) -----
Trabajador.hasMany(Lapiz, { foreignKey: 'dueñoId' });
Lapiz.belongsTo(Trabajador, { as: 'dueño', foreignKey: 'dueñoId' });
//⚠ La foreignKey siempre va en la tabla del "muchos" (Lapiz)

// ----- MxN (Muchos Trabajadores, Muchas Empresas) -----
Trabajador.belongsToMany(Empresa, { through: 'TrabajadoresEmpresas' });
Empresa.belongsToMany(Trabajador, { through: 'TrabajadoresEmpresas' });
// 'through' es el nombre de la tabla intermedia que Sequelize crea (o un modelo existente)


// -------------------- CRUD SIMPLE - ABM básicos --------------------
// Palabras Clave: insertar, actualizar, modificar, eliminar, borrar

// ----- INSERT (create) -----
const nuevoTrabajador = await Trabajador.create({
    nombre: 'Juan',
    apodo: 'Juanse',
    mail: 'juanse@gmail.com',
    departamento: 'RRHH',
    admin: true
});
//• También se puede usar inst.build() y luego inst.save()

// ----- UPDATE (update) -----
await Trabajador.update(
    { admin: true, departamento: 'Ventas' },
    {
        where: { id: 1 } // ⚠ IMPORTANTE: siempre poner where o se actualizan todos
    }
);

// ----- DELETE (destroy) -----
await Trabajador.destroy({
    where: { admin: false }
});


// -------------------- SELECT Y BÚSQUEDAS (WHERE) --------------------
// Palabras Clave: filtrar, buscar, obtener, comparar, condicionar

// ----- Búsqueda por PK o Primero -----
const trabajador1 = await Trabajador.findByPk(1); // Busca por id
const elPrimerAdmin = await Trabajador.findOne({ where: { admin: true } }); // Trae el primer match que cumpla como un objeto {}

// ----- Búsqueda de múltiples (findAll) y operadores (Op) -----
const trabajadoresCondicion = await Trabajador.findAll({
    where: {
        //! Operadores combinados de nivel campo
        nombre: {
            [Op.or]: ['Favio', 'Roberto'], // nombre = 'Favio' OR nombre = 'Roberto'
            [Op.like]: 'a%',  // Empieza con 'a'
            [Op.like]: '%a',  // Termina con 'a'
            [Op.like]: '%a%', // Contiene 'a'
            [Op.not]: null,   // IS NOT NULL (también sirve [Op.ne]: null)
            
            // Combinación lógica (and) dentro de un campo
            [Op.and]: {
                [Op.gt]: 3, // Mayor a 3
                [Op.ne]: 7  // Distinto de 7 (!=)
            }
        },
        id: {
            [Op.between]: [1, 4] // id BETWEEN 1 AND 4
        },
        
        //! Operadores combinados nivel Where
        [Op.or]: [
            { admin: true },
            { departamento: 'RRHH' }
        ] // (admin = true OR departamento = 'RRHH')
    },
    limit: 10,  // Trae solo 10 resultados
    offset: 5   // Saltea los primeros 5 resultados (para paginación)
});


// -------------------- CRUD CON ASOCIACIONES (INCLUDES) --------------------
// Palabras Clave: incluir, requerir, cargar, anidar, traer

// ----- SELECT: Carga Anticipada (Eager Loading - include) -----

//| Include simple (1 nivel)
const lapizConDueño = await Lapiz.findOne({
    include: 'dueño', // Se usa el string si definiste un alias ('as: dueño')
});
console.log("Id Lapiz: " + lapizConDueño.id + " Dueño: " + lapizConDueño.dueño.nombre); 
// Se accede a la propiedad con el nombre del alias ('dueño') o el nombre del modelo con mayúscula si no hay alias

//| Include con validación / requerimiento (INNER JOIN)
const trabajadorConSello = await Trabajador.findOne({
    include: {
        model: Sello,
        required: true // Si true = INNER JOIN (trae el Trabajador SOLO SI tiene Sello). Si false (default) = LEFT JOIN.
    }
});
console.log(trabajadorConSello.Sello.id); // Acceso: al no tener alias, se usa el nombre del modelo con mayúscula

//| Include anidado (Nested include)
const lapizConDueñoYSello = await Lapiz.findOne({
    include: {
        model: Trabajador,
        as: 'dueño',
        include: [
            { model: Sello } // Include dentro de un include. Es un array porque podrías incluir múltiples asociaciones del trabajador
        ]
    }
});
// Acceso a datos anidados:
console.log(lapizConDueñoYSello.dueño.nombre);
console.log(lapizConDueñoYSello.dueño.Sello.id);

// ----- SELECT: Carga Diferida (Lazy Loading) -----
const trab = await Trabajador.findOne();
// Sequelize crea automáticamente getters asíncronos según la asociación. 
// Ej: getSello(), getLapizs() (plural en hasMany o belongsToMany)
const suSello = await trab.getSello();
