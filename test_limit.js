import { Client, Databases, Query } from 'node-appwrite';
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6a37e2c3000b181616d5');
const databases = new Databases(client);
async function test() {
    try {
        const result = await databases.listDocuments('evaluacion_desempeno', 'employees', [Query.limit(5000)]);
        console.log("Success! Limit 5000 is allowed. Got:", result.documents.length);
    } catch (e) {
        console.error("Error with 5000:", e.message);
        try {
            const result = await databases.listDocuments('evaluacion_desempeno', 'employees', [Query.limit(100)]);
            console.log("Success with 100. Got:", result.documents.length);
        } catch (e2) {
            console.error("Error with 100:", e2.message);
        }
    }
}
test();
