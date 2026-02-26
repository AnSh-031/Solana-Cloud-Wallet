import mongoose from "mongoose"

const Schema = new mongoose.Schema({
    Payer : {type : String , require : true},
    signature : {type : String , require : true},
    amount : {type : Number , require : true},
    recipient : {type : String , require : true},
    },
    {timestamps : true}
);

const Txns = mongoose.model("Txns",Schema);

export default Txns;