import app from "./app";
import { connectDB } from "./utils/helper";

const port = 8003;
connectDB().then(()=>{
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})