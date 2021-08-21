//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-shivangi:shivangi123@cluster0.pif74.mongodb.net/todolistDB", 
  {useNewUrlParser: true, useUnifiedTopology : true});

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const itemsSchema = mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Buy Food" 
});
const item2 = new Item({
  name: "Eat Food" 
});
const item3 = new Item({
  name: "Workout" 
});
const defaultItems = [item1, item2, item3];


const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  const day = date.getDate();

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Default items added successfully");
        }
      });
    }
    res.render("list", {listTitle: day, newListItems: foundItems});
  })
  

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // Now we need to create a new Items document for this item which was added.
  const item = new Item({
    name: itemName
  });

  console.log(listName, date.getDate());
  if(listName === date.getDate()) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

  
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Removed checked item successfully");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

  
});

app.get("/:customListName", function(req, res){
  const customListName = req.params.customListName;

  // If this list already exists in the db, then just display it. Otherwise create it.
  List.findOne({name: customListName}, function(err, foundList){
    if(!foundList) {
      // Create new list.
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      // Show existing list.
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
    
  });
  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
