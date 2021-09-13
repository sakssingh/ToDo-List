//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-saksham:test123@cluster0.dswqk.mongodb.net/todolistDb");

const itemSchema = new mongoose.Schema({
   name: String
});

const Item = mongoose.model('item', itemSchema); // mongoose model is capitalized

const item1 = new Item({
   name: 'welcome'
});

const item2 = new Item({
   name: 'hit the + button to add new item'
});

const item3 = new Item({
   name: '<-- hit this to delete the item'
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
   name: String,
   items: [itemSchema]
})

const List = mongoose.model('list', listSchema);

// Item.insertMany(defaultItems, function(err) {
//    if (err) {
//       console.log(err);
//    }
//    else {
//       console.log('successful');
//    }
// });
//
app.get("/", function(req, res) {

   Item.find({}, function(err, results) {
      if (results.length === 0) {
         Item.insertMany(defaultItems, function(err) {
            if (err) {
               console.log(err);
            } else {
               console.log('successful');
               res.redirect('/'); // keeping it outside was a mistake
            }
         });
      } else {
         res.render("list", {
            listTitle: 'Today',
            newListItems: results
         });
      }
   });

});

app.get('/:listType', function(req, res) {
   const customListName = _.capitalize(req.params.listType);

   List.findOne({
      name: customListName
   }, function(err, results) {
      if (!err) {
         if (!results) {
            const list = new List({
               name: customListName,
               items: defaultItems
            });

            list.save(function() {
               res.redirect('/' + customListName);
            });
         } else {
            res.render('list', {
               listTitle: results.name,
               newListItems: results.items
            });
         }
      }
   });

});

// This block of code will attend to the post request to root route just like we created differently for get method
app.post('/', function(req, res) {
   const itemName = req.body.newItem;

   const newItem = new Item({
      name: itemName
   });
   newItem.save();
   res.redirect('/');
});

// this is for post requests made for the custom lists
app.post("/:customListName", function(req, res) {
   const customListName = req.params.customListName;

   // if it is a delete request
   if (customListName === 'delete') { // here I need to find a way to know the name of the list in which we want deletion
      const checkedItemId = req.body.checkbox;
      const listName = req.body.listName;

      if (listName === 'Today') {
         Item.deleteOne({
            _id: checkedItemId
         }, function(err) {
            if (err) {
               console.log(err);
            } else {
               res.redirect('/');
            }
         });
      } else {
         List.updateOne({
               name: listName
            }, {
               $pull: {
                  items: {
                     _id: checkedItemId
                  }
               }
            },
            function(err, results) {
               if (!err) {
                  res.redirect('/' + listName);
               }
            }
         );
      }
   }
   // if it addition request
   else {
      const itemName = req.body.newItem;

      const newItem = new Item({
         name: itemName
      });

      List.findOne({
         name: customListName
      }, function(err, results) {
         if (!err) {
            results.items.push(newItem);
            results.save();
            res.redirect('/' + customListName);
         }
      })
   }
});

// app.get("/work", function(req, res) {
// res.render("list", {
// listTitle: "Work List",
// newListItems: workItems
// });
// });

app.get("/about", function(req, res) {
   res.render("about");
});

app.listen(3000, function() {
   console.log("Server started on port 3000");
});
