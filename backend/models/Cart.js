const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);


// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const CartSchema = new Schema({
//   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   items: [
//     {
//       productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
//       quantity: { type: Number, default: 1 },
//     },
//   ],
// });

// module.exports = mongoose.model('Cart', CartSchema);

// // models/Cart.js
// const mongoose = require('mongoose');
// const CartSchema = new mongoose.Schema({
//     //user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     items: [{
//         product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//         quantity: { type: Number, required: true, default: 1 }
//     }]
// });

// module.exports = mongoose.model('Cart', CartSchema);


// const mongoose = require('mongoose');
// const CartSchema = new mongoose.Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     items: [{
//         product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
//         quantity: Number
//     }]
// });

// module.exports = mongoose.model('Cart', CartSchema);