const mongoose=require('mongoose')
const Chat=require("./models/chat.js")

main().then(()=>{
    console.log("connectin successful")
}).catch((err) => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp');

}
let allChat=[
    {
    from:"neha",
    to:"priya",
    msg:"send me your exam  sheet",
    created_at:new Date()
    },
    {
        from:"nehanal",
        to:"priyanshu",
        msg:"send me your exam  sheet",
        created_at:new Date()
    },
    {
        from:"jack",
        to:"rajat",
        msg:"send me your exam  sheet",
        created_at:new Date()
    },
    {
        from:"ram",
        to:"priya",
        msg:"send me your exam  sheet",
        created_at:new Date()
    },
    {
        from:"sritaam",
        to:"priya",
        msg:"send me your exam  sheet",
        created_at:new Date()
    },
    {
        from:"nela",
        to:"priya",
        msg:"send me your exam  sheet",
        created_at:new Date()
    },
    {
        from:"neha",
        to:"priyanka",
        msg:"send me your exam  sheet",
        created_at:new Date()
    },
]

Chat.insertMany(allChat)
