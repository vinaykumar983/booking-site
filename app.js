const exp=require("express");
const app=exp();
const jwt=require("jsonwebtoken");
const expressAsyncHandler=require("express-async-handler");
const cors=require("cors");


app.use(cors(
    {
        origin:'*'
    }
));
app.use(exp.json());
require("dotenv").config();
let DBurl=process.env.DBURL;
let port=process.env.PORT || 4000;
let mclient=require("mongodb").MongoClient;
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;
mclient.connect(DBurl)
.then((client)=>{
    let dbobj=client.db("vnr");
    let userCollectionObj=dbobj.collection("users");
    let bookingObj=dbobj.collection("bookings");
    app.set("bookingObj",bookingObj);
    app.set("userCollectionObj",userCollectionObj);
    console.log("DB connection success")
})
.catch((error)=>{
    console.log("Error in Db connection",error);
})

app.get("/",(req,res)=>{
res.send("Hello");
})

app.get("/get-user",expressAsyncHandler(async(request,response)=>{
    let userCollectionObj=app.get("userCollectionObj");
    let users=await userCollectionObj.find().toArray();
    response.send({message:"All users",payload:users});
}))
app.post("/create-user",expressAsyncHandler(async(request,response)=>{
    let obj=request.body
    let userCollectionObj=app.get("userCollectionObj");
    //console.log(obj);
    let user=await userCollectionObj.findOne({ email : { $eq: obj.email } });
    console.log(user)
    if(user==undefined){
        await userCollectionObj.insertOne(obj);
        let token=jwt.sign({email:obj.email}, "abcdef" ,{expiresIn:3600});
        response.send({message:"User created", payload:token,userObj:obj});
    }
    else{
        let token=jwt.sign({email:user.email}, "abcdef" ,{expiresIn:3600});
        response.send({message:"User exists", payload:token,userObj:user});
    }
}))


app.post("/create-booking",expressAsyncHandler(async(request,response)=>{
    let bookObj=request.body;
    let bookingObj=app.get("bookingObj");
    await bookingObj.insertOne(bookObj);
    response.send({message:"Your slot is booked"});
}))

app.get("/get-booking",expressAsyncHandler(async(request,response)=>{
    let bookingObj=app.get("bookingObj");
    let bookings=await bookingObj.find().toArray();
    response.send({message:"All bookings",payload:bookings});
}))

// app.delete("/del-booking/:id",expressAsyncHandler(async(request,response)=>{
//     let id=(request.params.id);
//     console.log(id);
//     let bookingObj=app.get("bookingObj");
//     await bookingObj.deleteOne({ _id: id });
//     response.send({message:"ashkj"});
// }))

// app.delete("/del-booking/:id", expressAsyncHandler(async (request, response) => {
//     const id = request.params.id;
//     const bookingModel = app.get("bookingModel"); // Assuming you have a mongoose model named 'bookingModel' for bookings

//     try {
//         const deletedBooking = await bookingModel.findByIdAndDelete(id);
//         if (deletedBooking) {
//             response.send({ message: "Booking deleted successfully." });
//         } else {
//             response.status(404).send({ message: "Booking not found." });
//         }
//     } catch (error) {
//         response.status(500).send({ message: "An error occurred while deleting the booking." });
//     }
// }));



const mongoose = require("mongoose");

app.delete("/del-booking/:id", expressAsyncHandler(async (request, response) => {
    const id = request.params.id;
    const convertedId = new mongoose.Types.ObjectId(id);
    console.log(id);
    let bookingObj=app.get("bookingObj");
    try {
        // const deletedBooking = await bookingObj.findByIdAndDelete(id);
        const result = await bookingObj.deleteOne({ _id: convertedId });
        console.log(result)
        if (result.deleteCount!=0) {
            response.send({ message: "Booking deleted successfully." });
        } else {
            response.status(404).send({ message: "Booking not found." });
        }
    } catch (error) {
        console.error("Error deleting booking:", error);
        response.status(500).send({ message: "An error occurred while deleting the booking." });
    }
}));




app.use((request,response,next)=>{
    response.send({message:`path ${requsest.url} is invalid`})
})
app.use((error,request,response,next)=>{
    response.send({message:error.message})
})

app.listen(port,()=>{
    console.log("Server listening on port "+port);
})


module.exports=app;