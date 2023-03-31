const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require('axios');
const { Videogame, Genres } = require('../db');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const getApiData = async () => {
    const apiUrl = await axios.get('https://api.rawg.io/api/games?key=c7d72d65761a4403b64f8c6eab36df43');
    const apiData = await apiUrl.results.map (juego => {
        return {
            id: juego.id,
            name: juego.name,
            released: juego.released,
            img: juego.background_image,
            rating: juego.rating,
            reviews: juego.reviews,
            platforms: juego.platforms.map(e => e.name).join(', '),
            genres: juego.genres.map(e => {
                return e.name
            }).join(', '),

        };
    });
    return apiData;
}

const getDbInfo = async () => {
    return await Videogame.findAll({
        includes: {
            model: Genres,
            attributes: ['name'],
            through: {
                attributes: [],
            } 
        }
    }
    )
}

const getAllVideogames = async () => {
    const apiData = await getApiData();
    const dbInfo = await getDbInfo();
    const totalInfo = apiData.concat(dbInfo);
    return totalInfo;
}

router.get('/Videogames', async (req, res) => {
    const name = req.query.name
    let totalVideoGames = await getAllVideogames();
    if (name) {
        let videogameName = await totalVideoGames.filter(e => e.name.toLowerCase().includes(name.toLowerCase()))
        videogameName.lenght ?
        res.status(200).send(videogameName):
        res.status(404).send('Videogame not found')
    } else {
        res.status(200).send(totalVideoGames)
    }
});

router.get('/Genres', async (req, res) => {
    const genresApi = await axios.get('https://api.rawg.io/api/genres?key=c7d72d65761a4403b64f8c6eab36df43');
    const genresNames = genresApi.results.map(e => e.name); 
    genresNames.forEach(e => {
        Genres.findOrCreate({
            where: {name: e}
        })        
    });
    const AllGenres = await Genres.findAll();
    res.status(200).send(AllGenres);
});

router.post('/Videogames', async (req, res)=>{
    let {
        id,
        name,
        released,
        img,
        rating,
        reviews,
        platforms,
        genres
    } = req.body

    let videoGameCreated = await Videogame.create({
        name,
        released,
        img,
        rating,
        reviews,
        platforms,
        createInDb
    })

    let GenresDB = await Genres.findAll({
        where: {name: genres}
    })

    videoGameCreated.addGenres(GenresDB);
    res.status(200).send('Videogame successfully added')
});

module.exports = router;
