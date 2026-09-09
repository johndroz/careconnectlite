const bcrypt = require("bcrypt");

async function generateHash(pass) {
  const hash = await bcrypt.hash(pass, 12);
  console.log(hash);
}

generateHash("test123!");