import app from "./app";
import { connectDB } from "./utils/helper";
import { startMessageScheduler } from "./utils/message.scheduler";
const port = process.env.PORT || 8002;
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
