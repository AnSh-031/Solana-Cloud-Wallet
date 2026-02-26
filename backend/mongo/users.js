import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    username : {type : String, require : true},
    password : {type : String, require : true},
    keypair : {type : Object, require : true},
    privateKey : {type : String, require : true},
    publicKey : {type : String, require : true}
})

const Users = mongoose.model("Users",Schema)

export default Users;