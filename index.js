const express = require('express')
const dontenv = require('dotenv')
const cors =require('cors')
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/api/auth/jwks'))

const verifyToken = async (req,res,next) => {
  const authheaders = req?.headers?.authorization;
  
    if (!authheaders) return res.status(401).json({ message: 'unauthorized' })
  const token = authheaders.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'unauthorized' })
  console.log(token);
  
  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload)
    next()
  } catch {
     return res.status(401).json({ message: 'unauthorized' })
  }

  
}

async function run() {
  try {
    await client.connect();

    const db = client.db('startuply');
    const ideasCollection = db.collection('ideas');
    const myCollection = db.collection('myIdea');
    
    app.post('/idea',verifyToken, async (req, res) => {
      const ideasData = req.body;
      console.log(ideasData)
      const result = await ideasCollection.insertOne(ideasData)
      res.send(result)
    });
    app.get('/ideas',async (req, res) => {
      const result = await ideasCollection.find().toArray();
      res.send(result)
    })
    app.get('/ideas/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      };
      const result = await ideasCollection.findOne(query);
      res.send(result)
    });

    app.patch('/ideas/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const modify = req.body;
      const result = await ideasCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: modify }
      );
      res.send(result)
    });
    app.delete('/ideas/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id)
      };
      const result = await ideasCollection.deleteOne(query);
      res.send(result)
    });
    app.post('/my-idea', async (req, res) => {
      const result = await myCollection.insertOne(req.body);
      res.send(result)
    });
    app.get('/my-idea/:userId',async (req, res) => {
      const { userId } = req.params;
      const result = await myCollection.find({ userId: userId }).toArray();
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