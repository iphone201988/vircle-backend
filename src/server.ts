import app from "./app";
import { connectDB } from "./utils/helper";
const port = process.env.PORT || 8002;
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
