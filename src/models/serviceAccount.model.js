//serviceAccount.model.js
import mongoose from "mongoose";

// Define a model without a schema
const Creds = mongoose.model("Creds", {}, "creds");

export default Creds;
