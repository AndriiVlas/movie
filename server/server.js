import 'dotenv/config';

import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

import db from './config/db.js';
import limitService from './services/limitService.js';
import logService from './services/logService.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use(limitService.rateLimiter);
app.use(logService.request);



// Стрічка фільмів
app.get("/api/movie", async (req, res) => {
    let session;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = `
        MATCH(m:Movie)
            RETURN m
            ORDER BY m.released DESC
            SKIP toInteger($skip)
            LIMIT toInteger($limit)
    `;
    const parameters = {
        page: page,
        limit: limit,
        skip: skip
    }

    try {
        session = db.readSession();

        const result = await session.executeRead(tx =>
            tx.run(query, parameters)
        );

        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Фільмів більше не знайдено' });
        }

        const movies = result.records.map(record => {
            const r = record.get('m').properties;
            if (r.released) {
                r.released = r.released.toNumber();
            }
            return r;
        });

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера' })
    } finally {
        if (session) await session.close();
    }
});

// Пошук фільму за назвою з отриманням інформації про режесерів, акторів, сценаристів тощо
app.get("/api/movie/:title", async (req, res) => {
    let session;

    const { title } = req.params;

    const parameters = {
        title: title?.trim()
    }
    const query = `
        MATCH (m:Movie {title: $title})
            OPTIONAL MATCH (a:Person)-[act:ACTED_IN]->(m)
            OPTIONAL MATCH (d:Person)-[:DIRECTED]->(m)
            OPTIONAL MATCH (p:Person)-[:PRODUCED]->(m)
            OPTIONAL MATCH (w:Person)-[:WROTE]->(m)
            RETURN
                m,
                collect(DISTINCT { name: a.name, roles: act.roles }) AS actors,
                collect(DISTINCT d.name) AS directors,
                collect(DISTINCT p.name) AS producers,
                collect(DISTINCT w.name) AS writers
    `;

    try {
        session = db.readSession();

        const result = await session.executeRead(tx => 
            tx.run(query, parameters)
        );

        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Фільм не знайдено' });
        }

        const movie = result.records[0].get('m').properties;

        if (movie.released) {
            movie.released = movie.released.toNumber();
        }

        const actors = result.records[0].get('actors');
        const directors = result.records[0].get('directors');
        const producers = result.records[0].get('producers');
        const writers = result.records[0].get('writers');

        res.status(200).json({
            ...movie,
            actors,
            directors,
            producers,
            writers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера' })
    } finally {
        if (session) await session.close();
    }
});

// Пошук фільмів за тими самими акторами/режисерами/продюсерами тощо
app.get("/api/movie/:rel/:name", async (req, res) => {
    let session;

    const { name } = req.params;
    const rel = req.params.rel.toUpperCase();

    const parameters = {
        name: name?.trim(),
        rel: rel.trim()
    }
    const query = `
        MATCH (a:Person {name: $name})-[r]->(m:Movie)
        WHERE type(r) = $rel
        RETURN m
    `;

    try {
        session = db.readSession();

        const result = await session.executeRead(tx =>
            tx.run(query, parameters)
        );

        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Фільми не знайдено або такого учасника немає' });
        }

        const movies = result.records.map(record => {
            const props = record.get('m').properties;
            if (props.released) {
                props.released = props.released.toNumber();
            }
            return props;
        });

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера' })
    } finally {
        if (session) await session.close();
    }
});

// Пошук фільмів за фільмом з тими самими акторами/режисерами/продюсерами тощо
app.get("/api/movie/related/:title/:rel", async (req, res) => {
    let session;

    const { title } = req.params;
    const rel = req.params.rel.toUpperCase();

    const parameters = {
        title: title?.trim(),
        rel: rel.trim()
    }
    const query = `
        MATCH (m1:Movie {title: $title})
            OPTIONAL MATCH (m1)<-[r1]-(p:Person)-[r2]->(m2:Movie)
            WHERE type(r1) = $rel AND type(r2) = $rel AND m1 <> m2
            RETURN m1, collect(DISTINCT m2) AS relatedMovies
    `;

    try {
        session = db.readSession();

        const result = await session.executeRead(tx =>
            tx.run(query, parameters)
        )

        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Фільм не знайдено' });
        }

        const searchMovie = result.records[0].get('m1').properties;
        if (searchMovie.released) {
            searchMovie.released = searchMovie.released.toNumber();
        }

        const relatedNodes = result.records[0].get('relatedMovies');
        const relatedMovies = relatedNodes.map(node => {
            const props = node.properties;
            if (props.released) {
                props.released = props.released.toNumber();
            }
            return props;
        });

        res.status(200).json({
            movie: searchMovie,
            related: relatedMovies
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера' });
    } finally {
        if (session) await session.close();
    }
});


// Додавання нового фільму
app.post("/api/movie", async (req, res) => {
    let session;
    const { title, released, tagline } = req.body;

    if (!title || typeof title !== 'string') {
        return res.status(400).json({
            error: "Поле назви є обов'язковим і має бути текстом"
        });
    }
    const parameters = {
        title: title?.trim(),
        released: released ? parseInt(released) : null,
        tagline: typeof tagline === 'string' ? tagline.trim() : null
    }
    const query = `
        MERGE (m:Movie {title: $title})
        ON CREATE SET m.released = toInteger($released), m.tagline = $tagline
        RETURN m
    `;

    try {
        session = db.writeSession();
        
        const result = await session.executeWrite(tx =>
            tx.run(query, parameters)
        )

        const createdMovie = result.records[0].get('m').properties;

        if (createdMovie.released) {
            createdMovie.released = createdMovie.released.toNumber();
        }

        res.status(200).json(createdMovie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера' });
    } finally {
        if (session) await session.close();
    }
});

// Додавання нової людини 
app.post("/api/person", async (req, res) => {
    let session;
    const { name, born } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({
            error: "Поле імені є обов'язковим і має бути текстом"
        });
    }
    const parameters = {
        name: name?.trim(),
        born: born ? parseInt(born) : null
    }
    const query = `
        MERGE (p:Person {name: $name})
        ON CREATE SET p.born = toInteger($born)
        RETURN p
    `;

    try {
        session = db.writeSession();

        const result = await session.executeWrite(tx =>
            tx.run(query, parameters)
        )

        const createdPerson = result.records[0].get('p').properties;
        
        if (createdPerson.born) {
            createdPerson.born = createdPerson.born.toNumber();
        }
        
        res.status(200).json(createdPerson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Помилка сервера" });
    } finally {
        if (session) await session.close();
    }
});

// Додавання зв'язку людини з фільмом
app.post("/api/link", async (req, res) => {
    let session;
    const { name, title, type, roles } = req.body;
    const allowedTypes = ['ACTED_IN', 'DIRECTED', 'PRODUCES', 'REVIEWED', 'WROTE'];

    if (
        !name || typeof name !== 'string' ||
        !title || typeof title !== 'string' ||
        !allowedTypes.includes(type)
    ) 
    {
        return res.status(400).json({
            error: "Поле імені людини, назви фільму та типу зв'язку є обов'язковими і мають бути текстом, тип зв'язку може бути тільки 'ACTED_IN', 'DIRECTED', 'FOLLOWS', 'PRODUCES', 'REVIEWED', 'WROTE'"
        });
    }

    const parameters = {
        name: name?.trim(),
        title: title?.trim(),
        type: type,
        roles: type === 'ACTED_IN' &&
               Array.isArray(roles) &&
               roles.every(r => typeof r === 'string') ?
               roles : null
    }
    const query = `
        MATCH (m:Movie {title: $title})
        MATCH (p:Person {name: $name})
        MERGE (p)-[t:${type}]->(m)
        SET t.roles = $roles
        RETURN p, t, m
    `;

    try {
        session = db.writeSession();

        const result = await session.executeWrite(tx =>
            tx.run(query, parameters)
        )

        if (result.records.length === 0) {
            return res.status(404).json({
                error: 'Людину або такий фільм не знайдено'
            });
        }

        const createdRel = result.records[0].get('t').properties;

        res.status(200).json(createdRel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Помилка сервера" });
    } finally {
        if (session) await session.close();
    }
});



// Запуск сервера
async function startServer() {
    try {
        await db.verifyConnection();
        await limitService.redis.connectRedis();

        app.listen(PORT, () => {
            console.log(`Сервер працює на порту ${PORT}`);
        })
    } catch (error) {
        console.error('Не вадлося запустити сервер:', error.message);
    }
}

startServer();