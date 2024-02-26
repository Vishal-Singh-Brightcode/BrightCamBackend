import mongoose from "mongoose"
require('dotenv').config();

const uri: any = process.env.DATABASE_URI;

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(uri);
        console.log("Connection to database established successfully");
    } catch (error) {
        console.log("Error while connecting to the database ==> ", error);
    }
}