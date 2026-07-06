
// Sacados del ejemplo que dio el prof

const { Hobby, User } = require('../models/index.js');

const getHobbies = async (req, res) => {
    try {
        const hobbies = await Hobby.findAll({ include: User });
        res.status(200).json(hobbies);
    } catch (error) {
        res.status(500).json({ error});
    }
};

const createHobby = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio" });

        const newHobby = await Hobby.create({ nombre });
        res.status(201).json(newHobby);
    } catch (error) {
        res.status(500).json({ error});
    }
};

const updateHobby = async (req,res) =>{
    const {id} = req.params
    const {name} = req.body
    try{
        const [rowsMod] = await Hobby.update(
            {name : name},
            {where: {id : id}}
        )
        if (rowsMod === 0){
            return res.status(200).json("El hobby no fue encontrado: 0 cambios realizados en la BDs")
        }
        res.status(200).json("El hobby fue modificado de forma exitosa")

    } catch (error) {
        res.status(500).json({error: error.message });
    }

}

module.exports = {
    getHobbies,
    createHobby
};