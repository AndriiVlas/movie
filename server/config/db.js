import neo4j from 'neo4j-driver';



const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

async function verifyConnection() {
    const session = driver.session();
    try {
        const result = await session.run('RETURN "Neo4j відповідає на запити" AS msg');
        console.log(result.records[0].get('msg'));
    } catch (error) {
        console.error('Neo4j НЕ відповідає на запити:', error.message);
    } finally {
        await session.close();
    }
}



export default {
    verifyConnection,
    readSession: () => driver.session({ defaultAccessMode: neo4j.session.READ }),
    writeSession: () => driver.session({ defaultAccessMode: neo4j.session.WRITE }),
    closeDriver: () => driver.close()
};