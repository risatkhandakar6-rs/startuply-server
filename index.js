const express = require('express')
const dontenv = require('dotenv')
const cors =require('cors')
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
dontenv.config()
const uri =process.env.MONGO_URI
const app = express()

app.use(cors());
app.use(express.json())

const PORT = process.env.PORT;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    descriptionErrors: true
  }
});
async function run() {
  try {
    await client.connect();

    const db = client.db('startuply');
    const ideasCollection = db.collection('ideas')
    
    app.post('/idea', async (req, res) => {
      const ideasData = req.body;
      console.log(ideasData)
      const result = await ideasCollection.insertOne(ideasData)
      res.send(result)
    });
    app.get('/ideas',async (req, res) => {
      const result = await ideasCollection.find().toArray();
      res.send(result)
    })
    app.get('/ideas/:id',async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      };
      const result = await ideasCollection.findOne(query);
      res.send(result)
    })

    await client.db('admin').command({ ping: 1 });
    console.log('ping your deployment')
  } finally {
   
  }
}run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('server is running fine!')
})

app.listen(PORT, () => {
  console.log(`sever running on port ${PORT}`)
});