// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  RESUMEN SEQUELIZE - CHEATSHEET PARA EVALUACIÓN                        ║
// ║  Keywords: sequelize, express, modelo, asociacion, CRUD, endpoint       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
// https://sequelize.org/docs/v6/core-concepts/model-basics/

// LEYENDA DE MARCADORES (para buscar con Ctrl+F):
//   // ---------- TÍTULO ----------  → Sección principal
//   // ----- subtítulo -----         → Subtítulo
//   //|  → Formato / Sintaxis
//   //•  → Tip / Dato extra
//   //⚠  → Cuidado / Error común


// ═══════════════════════════════════════════════════════════════════
// -------------------- IMPORTS - require, express, sequelize, conexion --------------------
// Palabras Clave: importar, requerir, conectar, iniciar, configurar
// ═══════════════════════════════════════════════════════════════════

const Express = require("express"); //Require es como un import
const { Sequelize, DataTypes, Op } = require("sequelize"); //Importo Sequelize, DataTypes y Op (operadores)
//[./img/dataType.png]
const server = Express(); //Instancio express con sus métodos (get, post, put, delete, etc)
const PORT = 3000;

//| Conexión a la base de datos
const sequelize = new Sequelize(
    'NombreBD',     // Nombre de la Base De Datos
    'root',         // Usuario
    "",             // Password
    {
        host: 'localhost',
        dialect: 'mysql',  // Motor de BD (mysql, postgres, sqlite, mariadb, mssql)
        logging: false     // false = no muestra las consultas SQL en consola
    }
);


// ═══════════════════════════════════════════════════════════════════
// -------------------- MODELO - define, campos, opciones, DataTypes --------------------
// Palabras Clave: definir, crear, configurar, especificar
// ═══════════════════════════════════════════════════════════════════
// Un modelo REPRESENTA una tabla, no es la tabla en sí

//| Formato define
const User = sequelize.define(
    'user', //Nombre del modelo
    {
    // ----- Campos (columnas) -----
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            //Para clave foránea ver "Asociaciones"
        },
        lastName: {
            type: DataTypes.STRING,
            unique: true,
        },
        admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: 'false',
            validate: {
                len: [4, 6] //Longitud entre 4 y 6
            }
        },
    },
    {
    // ----- Opciones del modelo -----
        timestamps: false,        // Desactiva createdAt y updatedAt (por defecto true)
        freezeTableName: true,    // Usa el nombre exacto del modelo, sin pluralizar
        tableName: 'Usuarios'     // Nombre custom de la tabla en SQL
    },
);
// [./img/nombres.png]
// [./img/expNombres.png]
console.log(User); //.define retorna el modelo

//• Si un campo solo tiene el dataType, se puede abreviar:
sequelize.define('User', { name: DataTypes.STRING });

//• Borrar modelos - drop
User.drop();      //Borra la tabla del modelo
sequelize.drop(); //Borra TODAS las tablas


// ═══════════════════════════════════════════════════════════════════
// -------------------- VALIDATIONS Y CONSTRAINTS - validate, allowNull, unique --------------------
// Palabras Clave: validar, restringir, obligar, permitir, personalizar
// ═══════════════════════════════════════════════════════════════════
// Ambas verifican que los datos cumplan criterios antes de entrar a la BD

const constraintsYvalidaciones = sequelize.define('constraintsYvalidaciones',
    {
    // ----- Constraints (a nivel SQL) -----
        constraints: {
            type: DataTypes.TEXT,
            unique: true,         // UNIQUE
            primaryKey: true,     // PRIMARY KEY
            foreignKey: true,     // FOREIGN KEY
            defaultValue: 'Ej',   // DEFAULT
            allowNull: false,     // NOT NULL (es constraint Y validation a la vez)
            //⚠ CHECK no existe como tal, las validaciones cumplen ese rol
        },

    // ----- Validaciones integradas (a nivel JS/Sequelize) -----
        validacionesDefault: {
            type: DataTypes.TEXT,
            validate: { //Clausula obligatoria para validaciones
                isEmail: true,              // Valida que sea email
                isUrl: false,               //⚠ false = DESACTIVA la validación, NO valida que NO sea URL
                isIn: [['Hola', 'Chau']],   // Valor debe estar en la lista. Doble array: [[]] porque isIn espera un argumento tipo lista
                //[./img/explicacionIsIn.png]

                //• Mensaje personalizado (sin args):
                isEmail: {
                    msg: "Tiene que ser un Email" //Las llaves ya activan la validación
                },
                //• Mensaje personalizado (con args):
                isIn: {
                    args: [[1, 2]],
                    msg: "Tiene que estar entre 1 y 2"
                },
                //⚠ El true de isEmail solo le dice a sequelize que lo active, no es un arg de la validación.
                //   Los args de isIn SÍ van a la validación, por eso se pasan con args:
                //[./img/todasLasValidations.png]
            }
        },

    // ----- Validaciones personalizadas (custom validators) -----
        validacionesPropias: {
            type: DataTypes.INTEGER,
            validate: {
                esPar(value) { //value = valor del campo actual
                    if (value % 2 != 0) {
                        throw new Error("Solo Pares Permitidos");
                        //throw lanza excepción y frena ejecución (salvo try/catch)
                    }
                },
                esMayorQueOtro(value) {
                    if (value > this.validacionesDefault) { //this accede a otros campos del mismo registro
                        throw new Error("Solo valores mayores a " + this.validacionesDefault);
                    }
                }
            }
        }
    },
    {
    // ----- Validaciones de modelo (se ejecutan al crear instancia, validan relación entre campos) -----
        validate: {
            validacionesOconstraints_NoLasDos() {
                if ((this.constraints === true) === (this.validacionesDefault === true)) {
                    throw new Error("Una o la otra");
                }
            }
        }
    }
);

//• AllowNull por default está en true
//• Si allowNull: false y se mete null → se saltean TODAS las demás validaciones
//• Si allowNull: true y se mete null → se saltean las validaciones INTEGRADAS, las custom NO
//[./img/ejemploUsoDeAllowNullParaSaltearValidaciones.png]
//• Para personalizar el msg de error de AllowNull → usar la validación isNull y configurando su msg


// ═══════════════════════════════════════════════════════════════════
// -------------------- ASOCIACIONES - hasOne, belongsTo, hasMany, belongsToMany, FK --------------------
// Palabras Clave: relacionar, asociar, unir, vincular, enlazar
// ═══════════════════════════════════════════════════════════════════

// ----- Métodos de asociación (siempre se usan de a pares) -----
hasOne();          // Tiene Uno         → FK en el otro
belongsTo();       // Pertenece a       → FK en este
hasMany();         // Tiene Muchos      → FK en el otro
belongsToMany();   // Pertenece a Muchos → FK en tabla intermedia

//| Resumen rápido
a.hasOne(b);                              // 1x1 → FK en B
b.belongsTo(a);                           // 1x1 → FK en B
a.hasMany(b);                             // 1xM → FK en B
a.belongsToMany(b, { through: c });       // NxM → FK en C (tabla intermedia)

//⚠ Las relaciones van de a pares porque si solo hago a.hasOne(b), entonces b no conoce a 'a' y no puedo hacer b.findAll({include: a})

// ----- 1x1 - uno a uno - hasOne belongsTo -----

const persona = sequelize.define('persona', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    nombre: DataTypes.STRING
});

const DNI = sequelize.define('DNI', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    numero: DataTypes.INTEGER,
    emision: DataTypes.DATE
});

//La FK va en la tabla débil (la que no puede existir sin la otra)
persona.hasOne(DNI);
DNI.belongsTo(persona);
//Crea en DNI una FK → persona.id. Nombre default: personaId. Por default puede ser NULL

// ----- 1xM - uno a muchos - hasMany belongsTo -----

const alumno = sequelize.define('alumnos', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    nombre: DataTypes.STRING
});

const lapiz = sequelize.define('lapiz', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    marca: DataTypes.STRING,
    fabricado: DataTypes.DATE
});

//⚠ La FK va en el lado "muchos" (lapiz), porque en una celda no se pueden guardar múltiples valores
alumno.hasMany(lapiz);
lapiz.belongsTo(alumno);
//Crea en lapiz una FK → alumno.id. Nombre default: alumnoId. Por default puede ser NULL

// ----- NxM - muchos a muchos - belongsToMany, through, tabla intermedia -----

const profe = sequelize.define('profe', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    nombre: DataTypes.STRING
});

//| Con nombre de tabla intermedia (string) - Sequelize la crea automáticamente
alumno.belongsToMany(profe, { through: "alumnos_profes" });
profe.belongsToMany(alumno, { through: "alumnos_profes" });
//Crea tabla "alumnos_profes" con FK alumnoId y profeId

//| Con modelo como tabla intermedia (permite agregar campos extra)
const alumnos_profes = sequelize.define('alumnos_profes', {
    alumnos_profesId: { //PK no compuesta (opcional, si no se pone queda clave compuesta)
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    /*  alumnoId y profeId NO hace falta definirlos, belongsToMany los crea automáticamente
        Pero si quisieras hacerlo manual:
        alumnoId: { type: DataTypes.INTEGER, references: { model: alumno, key: 'id' } },
        profeId:  { type: DataTypes.INTEGER, references: { model: profe, key: 'id' } },
    */
    otroCampo: { //Ventaja de crear el modelo: se pueden agregar campos extra
        type: DataTypes.INTEGER,
    }
});

alumno.belongsToMany(profe, { through: alumnos_profes, foreignKey: 'IdDelAlumno' }); //Cambio nombre FK de alumno
profe.belongsToMany(alumno, { through: alumnos_profes }); //FK de profe queda: profeId

// ----- Opciones de asociación - onDelete, onUpdate, foreignKey, as, targetKey, sourceKey -----

a.hasOne(b, {
    onDelete: 'CASCADE',
    //  CASCADE    → Borra los registros de b
    //  SET NULL   → Pone NULL en la FK de b (campo no puede ser NOT NULL)
    //  RESTRICT   → No permite la operación
    //  SET DEFAULT → Pone el valor default en la FK de b

    onUpdate: 'CASCADE', //Mismas opciones que onDelete

    //⚠ Defaults: 1x1 y 1xM → onDelete: SET NULL, onUpdate: CASCADE
    //            NxM        → ambos CASCADE

    //| foreignKey - cambiar nombre o configurar la FK
    foreignKey: 'otroNombreDeCampo', //Solo cambia el nombre
    //o como objeto con configuración completa:
    foreignKey: {
        name: 'otroNombreDeCampo',
        type: DataTypes.FLOAT,
        allowNull: false //⚠ Esto impide registros huérfanos (ej: DNI sin persona, lapiz sin dueño)
    },

    //| as (alias) - cambia nombre de relación, include, y métodos (getX → getNombreAlias)
    as: 'NombreRelacion',
    //⚠ También cambia el nombre del campo FK a: NombreRelacion + PK de la tabla referenciada
    //⚠ Sirve para tener dos relaciones al mismo modelo (ver ejemplo equipo-partido más abajo)
});
b.belongsTo(a, {/* Mismas opciones posibles, no es necesario en ambos lados */});

//| belongsToMany opciones extra
a.belongsToMany(b, {
    through: c,
    uniqueKey: 'ClaveC',   //Nombre de la constraint UNIQUE en SQL
});

//| targetKey / sourceKey - FK apuntando a campo que NO sea PK (debe ser UNIQUE)
a.belongsTo(b, { targetKey: 'Nombre' });     //FK apunta a b.Nombre en vez de b.id
b.hasOne(a, { sourceKey: 'Nombre' });         //FK apunta a b.Nombre en vez de b.id
b.hasMany(a, { sourceKey: 'Nombre' });        //Igual
//[./img/sourceOtarget.png]
//[./img/FK_en_no_PK_MxN.png]

//| foreignKey + otherKey en NxM - cambiar nombres de AMBAS FK en la intermedia
a.belongsToMany(b, { through: 'Intermedia', foreignKey: 'ID_A', otherKey: 'ID_B' });
b.belongsToMany(a, { through: 'Intermedia', foreignKey: 'ID_B', otherKey: 'ID_A' });
//⚠ Hay que pasarlo en AMBAS relaciones para evitar errores [./img/explicaciónDosFK.png]

//| Alias en ambos lados - cada modelo usa su propio alias
a.hasOne(b, { as: 'HOLA' });
b.belongsTo(a, { as: 'CHAU' });
await a.findAll({ include: 'HOLA' });  //Usa alias definido en la línea de a
await b.findAll({ include: 'CHAU' });  //Usa alias definido en la línea de b

//| Ejemplo: dos asociaciones al mismo modelo (equipo-partido)
const equipo = sequelize.define('Equipo', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: DataTypes.STRING
});
const partido = sequelize.define('Partido', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fecha: DataTypes.DATE
});

partido.hasOne(equipo, { as: 'Local' });      //getLocal()
partido.hasOne(equipo, { as: 'Visitante' });  //getVisitante()
equipo.belongsTo(partido);

//| Diferencia entre foreignKey y as
// casa.hasOne(puerta, { foreignKey: 'Entrada' })
//   → Cambia SOLO el nombre del campo en SQL. Include y métodos siguen usando "puerta"
// casa.hasOne(puerta, { as: 'Entrada' })
//   → Cambia el nombre de la relación + campo FK + include + métodos (getEntrada, setEntrada, createEntrada)


// ═══════════════════════════════════════════════════════════════════
// -------------------- OPERADORES WHERE - Op, and, or, between, in, gt, lt --------------------
// Palabras Clave: filtrar, buscar, comparar, condicionar, igualar
// ═══════════════════════════════════════════════════════════════════

//| Formato: [Op.operador]: valor
findAll({
    where: {
        // ----- Sintaxis amigable (sin Op) -----
        campo: 10,                                       // campo = 10            ( : actúa como = )
        campo: [1, 2, 3],                                // campo IN (1, 2, 3)    ( : actúa como IN con arrays )
        //⚠ Las comas entre clausulas del where actúan como AND

        // ----- Operadores lógicos a nivel where (comparan campos DISTINTOS) -----
        [Op.or]:  [{ campo: 10 }, { campo2: 20 }],       // campo = 10 OR campo2 = 20
        [Op.and]: [{ campo: 10 }, { campo2: 20 }],       // campo = 10 AND campo2 = 20

        // ----- Operadores dentro de un campo específico -----
        campo: {
            [Op.and]: [2, 3],           // campo = 2 AND campo = 3  (mismo campo)
            [Op.or]:  [2, 3],           // campo = 2 OR campo = 3   (mismo campo)
            [Op.eq]: 1,                 // = 1
            [Op.ne]: 1,                 // != 1
            [Op.is]: null,              // IS NULL   (válido con NULL, TRUE, FALSE)
            [Op.not]: true,             // IS NOT TRUE (válido con NULL, TRUE, FALSE)

            [Op.gt]: 1,                 // > 1     Greater Than
            [Op.gte]: 1,                // >= 1    Greater Than Equal
            [Op.lt]: 1,                 // < 1     Lower Than
            [Op.lte]: 1,               // <= 1    Lower Than Equal

            [Op.between]: [2, 3],       // BETWEEN 2 AND 3
            [Op.notBetween]: [2, 3],    // NOT BETWEEN 2 AND 3
            [Op.in]: [2, 3, 4, 5],      // IN (2, 3, 4, 5)
            [Op.notIn]: [2, 3, 4, 5],   // NOT IN (2, 3, 4, 5)
            //[./img/operadores.png]

            //• Combinaciones lógicas dentro de un campo:
            [Op.and]: {
                [Op.gt]: 3,
                [Op.ne]: 4,
            }, // campo > 3 AND campo != 4
        },

        //• Combinaciones lógicas en el where:
        [Op.or]: [
            { id: { [Op.between]: [2, 5] } },
            { admin: { [Op.eq]: true } }
        ], // id BETWEEN 2 AND 5 OR admin = true
    }
});

/*⚠ Resumen reglas del where:
  En where: ":"  equivale a "="  y  ","  equivale a "AND"
  En where: a los Op se les pasa lista de objetos: [{},{}]
  En campo: a los Op se les pasa lista de valores: [] (salvo and/or con objetos internos)
*/


// ═══════════════════════════════════════════════════════════════════
// -------------------- CRUD SIMPLES - create, findAll, findOne, findByPk, update, destroy --------------------
// Palabras Clave: insertar, obtener, buscar, actualizar, modificar, eliminar, borrar
// ═══════════════════════════════════════════════════════════════════

// ----- INSERT - create -----

//| Formato
const nombreInstancia = await Modelo.create(
    { campo: 'Valor', campo2: 'Value' },
    { fields: ['campo'] }, //Solo 'campo' se guarda en BD, el resto queda NULL
);

//Ejemplo:
const us1 = await User.create(
    { lastName: 'Bosnia', admin: true },
    { fields: ['lastName'] }, //Solo lastName se guarda, admin queda NULL
);

// ----- SELECT - findAll, findByPk, findOne, findOrCreate, findAndCountAll -----

//| findAll - devuelve todos los que coincidan
await User.findAll();                                    // SELECT * FROM User

await User.findAll({
    attributes: ['id', 'LastName'],                      // SELECT id, lastName FROM User
});

//| Agregaciones - COUNT, SUM, AVG, MIN, MAX + sequelize.fn
await User.findAll({
    attributes: ['id', [sequelize.fn('COUNT', sequelize.col('id')), 'Cant_id']]
}); // SELECT id, COUNT(id) AS Cant_id FROM User         ⚠ El alias (AS) es obligatorio

//| Otras funciones SQL con sequelize.fn
await User.findAll({
    attributes: ['id', [sequelize.fn('char_length', sequelize.col('lastName')), 'Long']]
}); // SELECT id, char_length(lastName) AS Long FROM User

//| findAll con where
await User.findAll({
    where: { id: 2, admin: true }
});

//| sequelize.fn en el where (con sequelize.where)
await User.findAll({
    where: sequelize.where(sequelize.fn('char_length', sequelize.col('lastName')), 7),
}); // SELECT * WHERE char_length(lastName) = 7
// [./img/ejemploDificilOperadores.png]

//| Formato general findAll
await User.findAll({
    attributes: ['clave', 'clave2'],
    where: { /* CONDICIONES */ }
});

//| Agregar agregación SIN listar todos los campos (include en attributes)
await User.findAll({
    attributes: {
        include: [[sequelize.fn('COUNT', sequelize.col('id')), 'Cant_id']]
    }
}); // SELECT id, lastName, admin, COUNT(id) AS Cant_id FROM User

//| Excluir campos del SELECT (exclude en attributes)
await User.findAll({
    attributes: { exclude: ['admin'] },
}); // SELECT id, lastName FROM User

//| GROUP BY - group
await User.findAll({
    where: { admin: true },
    attributes: {
        include: [[sequelize.fn('COUNT', sequelize.col('id')), 'Cant_id']]
    },
    group: 'lastName',
}); // ...WHERE admin = true GROUP BY lastName

//| LIMIT y OFFSET
await User.findAll({
    limit: 10,     //Trae 10 filas
    offset: 3      //Salta las primeras 3
});

//| findByPk - busca por primary key, devuelve un solo objeto
await User.findByPk(123);

//| findOne - devuelve el primer resultado como objeto {}
//⚠ findOne devuelve {} , findAll devuelve [{}]. Si solo esperas un resultado, usá findOne
await User.findOne({ where: { lastName: 'Lautaro' } });

//| findOrCreate - busca, si no existe lo crea con defaults
const { lau, creado } = await User.findOrCreate({
    where: { lastName: 'Lauti' },
    defaults: { admin: 'false' },
});
console.log(creado); //true si lo creó, false si ya existía

//| findAndCountAll - devuelve registros + count. Útil con limit/offset
const { cant, registros } = await User.findAndCountAll();
//⚠ Con group by, count devuelve un objeto con valores en vez de un número

// ----- UPDATE - update -----

//| Formato
await User.update(
    { campo: 'valor a asignar', campo2: 'valor a asignar' },
    { where: { /* CONDICIONES */ } }
);

//Ejemplo:
await User.update(
    { lastName: 'Rabinovich' },
    { where: { lastName: 'Rabi' } }
);

// ----- DELETE - destroy, truncate -----

//| Formato
await User.destroy({
    where: { campo: 'valor' }
    //o para borrar todo:
    //truncate: true
});

//Ejemplo:
await User.destroy({
    where: { lastName: 'Rabinovich' }
});

//| Otras funciones de modelo - count, max, min, sum
await User.count();
await User.count({ where: { lastName: 'Lautaro' } });
await User.max('id');
await User.min('id');
await User.sum('id');


// ═══════════════════════════════════════════════════════════════════
// -------------------- CRUD CON ASOCIACIONES - include, carga anticipada, carga diferida --------------------
// Palabras Clave: incluir, requerir, cargar, anidar, traer
// ═══════════════════════════════════════════════════════════════════

const capitan = sequelize.define('Capitan', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    nombre: DataTypes.STRING
});
const barco = sequelize.define('Barco', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    espacio: DataTypes.DOUBLE
});
capitan.hasOne(barco, { as: 'Líder' });
barco.belongsTo(capitan);

// ----- SELECT con asociaciones - include, carga anticipada, carga diferida -----

//| Carga anticipada (eager loading) - trae el registro + los asociados en una sola query
const capitanCrack = await capitan.findOne({
    where: { nombre: 'Jack Sparrow' },

    //Formas de incluir:
    include: 'Líder',                                   // Por alias
    // o
    include: { model: barco, as: 'Líder' },             // Por modelo + alias
    // o (si NO hay alias definido):
    include: barco,                                     // Por constante del modelo
    // o
    include: 'Barco',                                   // Por nombre del modelo (string)
});
console.log(capitanCrack.nombre);
console.log(capitanCrack.Barco.espacio);  //Accedo al modelo incluido por su nombre

//| Configuraciones del include - required, right, paranoid, where, $referencia$
const capitanesCONbarco = await capitan.findAll({
    where: {
        '$Barco.espacio$': { [Op.gt]: 3 }  //⚠ Los $ indican campo de modelo incluido, no del propio
    },
    include: {
        model: barco,
        required: true,      // INNER JOIN (sin esto es LEFT JOIN). No trae capitanes sin barco
        right: true,          // RIGHT JOIN
        paranoid: false,      // Incluye registros eliminados lógicamente
        where: {              //⚠ Poner where en include pone required: true automáticamente
            espacio: { [Op.gt]: 3 },
            id: Sequelize.col('Capitan.id')  //Comparar con campo de otro modelo
        }
    }
});
//[./img/tiposJoin.png]

//| Include anidado (nested include)
const timon = sequelize.define('Timon', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    modelo: DataTypes.STRING,
    año: DataTypes.DATE
});
barco.hasOne(timon);
timon.belongsTo(barco);

const capitanesConBarcosConTimones = await capitan.findAll({
    include: {
        model: barco,
        include: { model: timon }  //Include dentro de include
    }
});

//| Incluir múltiples modelos (lista)
const barcosConTimonesYCapitanes = await barco.findAll({
    include: [
        timon,
        { model: capitan, as: 'Líder' },
    ]
});

//| Incluir TODO
await partido.findAll({ include: { all: true } });                    //Todas las tablas relacionadas
await partido.findAll({ include: { all: true, nested: true } });      //+ relaciones de relaciones (recursivo)

//| Carga diferida (lazy loading) - primero traes el registro, después pedís los asociados con getters
const capitanCrack2 = await capitan.findOne({ where: { nombre: 'Jack Sparrow' } });
const barcoDelCapi = await capitanCrack2.getBarco(); //Método creado por Sequelize
//[./img/métodosInstancias.png]
//[./img/nombresMetodos.png]

//Los getters aceptan los mismos argumentos que los buscadores:
const barcoFiltrado = await capitanCrack2.getBarco({
    attributes: ['espacio'],
    where: { espacio: { [Op.gt]: 3 } }
});

// ----- NxM peculiaridades - through attributes, addModelo, joinTableAttributes -----

//| Filtrar atributos de la tabla intermedia en carga anticipada
const profes = await profe.findAll({
    include: {
        model: alumno,
        through: { attributes: [] }  //[] = no traer campos de la tabla intermedia
    }
});

//| Filtrar atributos de la tabla intermedia en carga diferida
const profes2 = await profe.findAll();
const alumnosProfes = await profes2.getAlumnos({ joinTableAttributes: [] });

//| Agregar registro con campo extra en tabla intermedia
const horasIntermedia = sequelize.define('horas', {
    horas: { type: DataTypes.INTEGER }
});
alumno.belongsToMany(profe, { through: horasIntermedia });
profe.belongsToMany(alumno, { through: horasIntermedia });

const MarcosCosta = await profe.create({ nombre: 'MarcosCosta' });
const Lautaro = await alumno.create({ nombre: 'Lautaro' });
await MarcosCosta.addAlumno(Lautaro, { through: { horas: 100 } });
//Agrega la relación + define el campo extra "horas" en 100

// ----- CREATE con asociaciones - create con FK, creación anidada -----

//| Create simple con FK
await barco.create({
    espacio: 2.2,
    capitanId: 2  //FK del capitán
});

//| Creación anidada (crear padre + hijos en una sola operación)
const barcoTimon = barco.hasMany(timon); //Guardo el return (info de la relación)
capitan.hasOne(barco, { as: 'Navío' }); //Uso alias en vez de guardar return

await capitan.create(
    {
        nombre: 'Jack Esparrago',
        Navío: {  //Nombre definido por el alias
            espacio: 10,
            Timons: [  //⚠ Plural (en inglés) porque es hasMany, minúscula automática de Sequelize
                { modelo: 'asdhkfkas', año: '12-4-2009' },
                { modelo: 'ashkafjsdf', año: '12-5-2009' },
            ]
        }
    },
    {
        include: {
            association: 'Navío',         //Datos de la asociación padre
            include: [barcoTimon],        //Datos de la asociación hijo (array porque es hasMany)
            //o: include: [{ association: barcoTimon }]
        }
    }
);

// ----- UPDATE y DELETE con asociaciones - update, destroy -----

await barco.update(
    { espacio: 10 },
    { where: { id: 2 } }
);

await barco.destroy({
    where: { id: 2 }
});


// ═══════════════════════════════════════════════════════════════════
// -------------------- SUPER MxN - doble relación, NxM + 1xM combinado --------------------
// Palabras Clave: relacionar mucho a mucho, acceder, intermediar
// ═══════════════════════════════════════════════════════════════════

// ----- Problema: con NxM normal solo se conocen los extremos, no la intermedia -----

//| NxM normal - solo puedo incluir profe↔alumno, NO la intermedia
alumno.belongsToMany(profe, { through: 'horas' });
profe.belongsToMany(alumno, { through: 'horas' });
// ✅ alumno.findAll({ include: profe })
// ✅ profe.findAll({ include: alumno })
// ❌ alumno.findAll({ include: horas })   ← No se conocen
// ❌ horas.findAll({ include: alumno })   ← No se conocen

//| Dos 1xM a la intermedia - solo incluyo a través de la intermedia
alumno.hasMany(horas);     horas.belongsTo(alumno);
profe.hasMany(horas);      horas.belongsTo(profe);
// ✅ alumno.findAll({ include: horas })
// ✅ horas.findAll({ include: profe })
// ❌ alumno.findAll({ include: profe })   ← No se conocen directamente
// Se puede emular con include anidado:
alumno.findAll({ include: { model: horas, include: profe } });

//| Super MxN - las 4 relaciones juntas → acceso total
alumno.belongsToMany(profe, { through: 'horas' });
profe.belongsToMany(alumno, { through: 'horas' });
alumno.hasMany(horas);     horas.belongsTo(alumno);
profe.hasMany(horas);      horas.belongsTo(profe);
// ✅ TODO funciona: include en cualquier dirección

//| Ejemplo Super MxN: torneo con jugadores que cambian de equipo entre partidos
partido.belongsToMany(equipo, { through: 'partidoEquipo' });
equipo.belongsToMany(partido, { through: 'partidoEquipo' });
equipo.hasMany(partidoEquipo);
partidoEquipo.belongsTo(equipo);
//El jugador no tiene equipo fijo ni partido fijo, sino equipo EN un partido = partidoEquipo
partidoEquipo.belongsToMany(jugador, { through: 'jugadorPartidoEquipo' });
jugador.belongsToMany(partidoEquipo, { through: 'jugadorPartidoEquipo' });

const partidos = await partido.findAll({
    include: {
        model: partidoEquipo,
        include: [
            { model: jugador, through: { attributes: [] } },
            equipo
        ]
    }
});


// ═══════════════════════════════════════════════════════════════════
// -------------------- INSTANCIAS - build, save, reload, destroy, increment, bulkCreate --------------------
// Palabras Clave: instanciar, guardar, recargar, incrementar, masificar
// ═══════════════════════════════════════════════════════════════════

//| build + save (crear sin guardar en BD, después guardar)
const inst1 = User.build({ lastName: 'Lauti' });
await inst1.save();  //Ahora sí va a la BD

//| create = build + save en uno
const inst2 = await User.create({ lastName: 'Lauti' });

//| Modificar instancia y guardar
inst2.lastName = 'Lau';
await inst2.save();

//| Guardar solo algunos campos modificados
inst2.lastName = 'Lau';
inst2.admin = true;
await inst2.save({ fields: ['lastName'] }); //Solo guarda lastName

//| reload - resetear instancia al estado de la BD
await inst2.reload();

//| destroy - borrar instancia (y de la BD)
await inst2.destroy();

//| increment / decrement
await inst2.increment('id', { by: 2 });
await inst2.decrement({ 'id': 2, 'plata': 100 }); //Múltiples campos
//⚠ Ambos guardan automáticamente

//| bulkCreate - crear múltiples registros
const users = await User.bulkCreate([
    { lastName: 'Lauti' },
    { lastName: 'Rabi', admin: true }
]); //⚠ bulkCreate NO hace validaciones por defecto

const usersValidados = await User.bulkCreate(
    [{ lastName: 'Lauti' }, { lastName: 'Rabi', admin: true }],
    {
        validate: true,       //Ahora sí valida. Si falla, no se crea NINGUNO
        fields: ['lastName']  //Acepta fields
    }
);


// ═══════════════════════════════════════════════════════════════════
// -------------------- FINAL - listen, authenticate, sync --------------------
// Palabras Clave: escuchar, arrancar, autenticar, sincronizar, alterar
// ═══════════════════════════════════════════════════════════════════

server.listen(PORT, async () => {
    await sequelize.authenticate(); //Testea la conexión
    await sequelize.sync();         //Sincroniza modelos con la BD

    /*| Opciones de sync:
    sequelize.sync()                → Crea tabla SOLO si no existe
    sequelize.sync({force: true})   → Elimina y recrea la tabla (PIERDE datos)
    sequelize.sync({alter: true})   → Modifica la tabla existente (conserva datos)
    User.sync()                     → Sincroniza solo un modelo
    sequelize.sync({force: true}, match: /_test$/)  → Solo si nombre termina en _test
    [./img/sync.png]
    */

    console.log("El servidor está ON en el puerto", PORT);
});


// ═══════════════════════════════════════════════════════════════════
// -------------------- CONCEPTOS - async, await, endpoint, callback, promesa --------------------
// Palabras Clave: entender, esperar, procesar, resolver, estructurar
// ═══════════════════════════════════════════════════════════════════

/*
CONVENCIÓN:
  Nombre tabla → minúscula
  Nombre clase → Mayúscula. Instancia → minúscula
  //[./img/convencion.png]

ENDPOINTS Y CALLBACKS:
  Al ejecutar el código se registran todos los endpoints como "recetas" (URL + callback),
  pero las callbacks NO se ejecutan hasta que alguien haga un request a esa URL en ese puerto.
  server.listen se ejecuta al instante porque su condición es que el SO asigne el puerto.

FUNCIONES ASÍNCRONAS:
  • async envuelve los return en promesas (objetos). Los errores también se envuelven en promesas.
  • await le dice a Node: "no sigas ejecutando ESTA función hasta que termine esta línea"
    (pero otras funciones fuera de esta SÍ pueden seguir ejecutándose)
  • Se puede ejecutar una función al instante poniéndole () al final
  • Función anónima ejecutada al instante: (() => {})();

NOMBRES EN RELACIONES:
  • Nombre campo FK default → nombreModelo + Id  (ej: personaId)
  • Métodos de instancia → get/set/create + NombreModelo en mayúscula (ej: getPersona)
  • Include → nombre de la constante o nombre del modelo entre comillas
*/