const jwt = require("jsonwebtoken");
const token = jwt.sign(
  { userId: "cb396175-dc17-4769-927c-362d93f09aea", email: "edu.vcortez@gmail.com", username: "Educortez" },
  "deb-tracker-dev-secret-2026",
  { expiresIn: "5m" }
);
console.log("TOKEN:" + token);
