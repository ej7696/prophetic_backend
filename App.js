const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const morgan = require("morgan");

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

//////////////////////////////
///////// Web Socket /////////
//////////////////////////////

wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");

  ws.on("message", (message) => {
    console.log("Received message from client:", message);
  });

  ws.send(JSON.stringify({ event: "welcome", message: "Hello Client!" }));
});

module.exports.emitStatus = (payload) => {
  console.log("Being called");
  wss.clients.forEach((client) => {
    console.log("client --", client);
    if (client.readyState === WebSocket.OPEN) {
      console.log("payload", payload);
      client.send(JSON.stringify({ event: "user-status-update", payload }));
    }
  });
};

require("./config/db");
require("dotenv").config();

const path = require("path");
require("./CronJob");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/public", express.static(path.join(__dirname, "public")));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: "Error", message: err.message });
});

const consultantRouter = require("./routes/consultantRoute");
const adminRouter = require("./routes/adminRoutes");
const frontedRoute = require("./routes/frontedRoute");
const consultantPanelRouter = require("./routes/consultantPanelRoutes");
const appointmentRouter = require("./routes/appointmentsRoute");

app.use("/api/v1", consultantRouter);
app.use("/api/v1", adminRouter);
app.use("/api/v1", frontedRoute);
app.use("/api/v1", consultantPanelRouter);
app.use("/api/v1", appointmentRouter);

const port = process.env.PORT || 4500;
// app.listen(port, () => console.log(`Server is running on ${port}`));
server.listen(port, () => console.log(`Server is running on ${port}`));
