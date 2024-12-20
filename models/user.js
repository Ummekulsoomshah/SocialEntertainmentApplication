const mongoose=require('mongoose')

mongoose.connect('mongodb://localhost:27017/postingapp')

let userSchema=mongoose.Schema({
    name:String,
    email:String,
    password:String,
    age:Number,
    post:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post'
    }]
})

module.exports=mongoose.model('User',userSchema)