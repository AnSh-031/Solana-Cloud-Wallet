import {Keypair , Connection , SystemProgram, sendAndConfirmRawTransaction, sendAndConfirmTransaction , Transaction , PublicKey} from "@solana/web3.js"
import bs58 from "bs58"
import express from "express";
import Users from "./mongo/users.js"
import Txns from "./mongo/txns.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import cors from "cors";
import bcrypt from "bcrypt"
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json())
app.use(cors());

try{
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected");
}
catch(err) {
    console.log("Not connected");
}


const connection = new Connection(process.env.HELIUS_KEY , 'confirmed')


app.post("/app/v1/signup" , async(req,res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        if(username && password) {  
            const keypair = Keypair.generate();
            const privateKey = bs58.encode(keypair.secretKey);
            const publicKey = keypair.publicKey.toBase58();

            const hashedPass = await bcrypt.hash(password,10);
            const user = await Users.create({username , password : hashedPass , privateKey , publicKey});

            res.status(200).json({msg : "You are signed up. You can Sign in now !!"});
        } 
        else {
            res.json({error : "Invalid username or password !!"});
        }
    } 
    catch(err) {
        res.json({Error : err.message});
    }
})



app.post("/app/v1/signin" , async(req,res) => {
    try{
        const username = req.body.username;
        const password = req.body.password;

        if(username && password) {
            const user = await Users.findOne({
                username : username
            })

            const isValid = await bcrypt.compare(password , user.password);

            if(isValid) {
                const token = jwt.sign({
                    username : user.username
                },process.env.SECRET_KEY)

                res.status(200).json({token})
            }
            else {
                res.json({error : "User not found !!"})
            }
        }
        else {
            res.status(400).json({error : "Invalid inputs !!"})
        }
    }
    catch(err){
        res.json({Error : err.message})
    }
})



app.post("/app/v1/txn",async(req,res) => {
    try{
        const to = req.body.to;
        const amount = req.body.amount;
        const token = req.headers.token;
        
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        
        if(to && amount) {
            const user = await Users.findOne({username : decoded.username});
            const keypair = Keypair.fromSecretKey(bs58.decode(user.privateKey));

            const txn = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey : keypair.publicKey,
                    toPubkey : new PublicKey(to),
                    lamports : amount * 1000000000
                })
            )
            const signature = await sendAndConfirmTransaction(
                connection,
                txn,
                [keypair]
            )

            const transaction = await Txns.create({Payer : user.publicKey,signature,amount,recipient : to});

            res.status(200).json({signature : signature});
        } else {
            res.json({error : "Invalid inputs !!"})
        }
    }
    catch(err) {
        res.json({Error : err.message})
    }
})



app.get("/app/v1/txn",async(req,res) => {
    try{
        const token = req.headers.token;
        const decoded = jwt.verify(token , process.env.SECRET_KEY);

        const user = await Users.findOne({username : decoded.username});
        if(user) {
            const txns = await Txns.find({Payer : user.publicKey});
            res.status(200).json({txns});
        } else {
            res.json({error : "User does not exist !!"});
        }
    }
    catch(err) {
        res.json({Error : err.message})
    }
})



app.get("/app/v1/wallet" , async(req,res) => {
    try{
        const token = req.headers.token;
        const decoded = jwt.verify(token , process.env.SECRET_KEY);

        const user = await Users.findOne({
            username : decoded.username
        })

        if(user) {
            const lamports = await connection.getBalance(new PublicKey(user.publicKey));
            const sol = lamports/1000000000;
    
            res.json({publicKey: user.publicKey , balance : sol})
        } else{
            res.json({error : "User does not exist !!"})
        }

    } catch(err) {
        res.json({error : err.message})
    }
})

app.listen(3000);