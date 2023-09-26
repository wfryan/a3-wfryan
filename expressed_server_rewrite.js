const exp = require('express');
const denv = require('dotenv').config()
const {MongoClient, ObjectId} = require('mongodb');
const auth = require('passport');
const app = exp();
const port = process.env.PORT;
const connect_uri = process.env.connectionStr
console.log(`Here: ${connect_uri}`)
const client = new MongoClient(connect_uri)
let collection = null;

const totalPrice = { totalPrice: 0.0 };
let retObject;
const groceryList = [];

async function run() {
  await client.connect()
  collection = await client.db("GroceryList").collection("Grocery_Items")
  if(collection !== null){
    const docs = await collection.find({}).toArray()
    console.log(docs)
  }
  app.get("/docs", async (req, res) => {
    if(collection !== null){
      const docs = await collection.find({}).toArray()
      res.json(docs)
    }
  })

app.use(exp.static('public'))
app.use(exp.json())

app.post("/submit", async (req, res) => {
    groceryList.push(req.body.item);
    const rst = await collection.insertOne(req.body.item)
    console.log(rst)
    calcTotalPrice();
    retObject = { groceryList, totalPrice };
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(retObject));
})

app.post("/modify", (req, res) => {
  modifyPrice(req.body)
  calcTotalPrice();
  retObject = { groceryList, totalPrice };
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(retObject));
})

app.delete("/reset", (req, res) => {
  console.log(req)
  groceryList.splice(0, groceryList.length);
  calcTotalPrice();
  retObject = { groceryList, totalPrice };
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(retObject));
})

app.delete("/del", (req, res) => {
  console.log(req)
  deleteItems(req.body)
  calcTotalPrice();
  retObject = { groceryList, totalPrice };
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(retObject));
})

}

const calcTotalPrice = function () {
    totalPrice.totalPrice = 0.0;
    if(groceryList.length !== 0){groceryList.forEach((item) => {
      if (!isNaN(parseFloat(item.price))) {
        totalPrice.totalPrice += parseFloat(item.price);
      } else {
        totalPrice.totalPrice += 0.0;
      }
    })};
  };

const modifyPrice = function (data){
    data.items.forEach(idx => {
      console.log(groceryList[idx])
      groceryList[idx].price = data.price;
    })
  }

const deleteItems = function (data){
  for(let i = groceryList.length - 1; i >= 0; i--)
  {
    data.every(idx => {
      if(idx === i)
      {
        groceryList.splice(i, 1);
        return false;
      }
      return true;
    })
  }
}

run()

app.listen(port, ()=> {
    console.log(`Listening on ${port}`);
});