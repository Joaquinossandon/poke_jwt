const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET_KEY = "hola_caracola";

const users = [
    {
        role: "admin",
        email: "admin@admin.com",
        password: async () => await bcrypt.hash("admin123", 10),
        catched: [],
    },
];

const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
        req.user = decoded;

        next();
    } catch (error) {
        res.status(401).json({ message: "Token inválido" });
    }
};

app.get("/", (req, res) => {
    res.send("Usuarios con JWT y pokemones");
});

app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
        role: "user",
        email: email,
        password: hashedPassword,
        catched: [],
    });

    res.status(201).json({ message: "Usuario creado con éxito" });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ email: user.email, role: user.role }, SECRET_KEY);

    res.status(200).json({ token });
});

app.get("/profile", verifyToken, (req, res) => {
    console.log(req.user);
    const { email, role } = req.user;

    const user = users.find((u) => u.email === email);

    if (!user) {
        return res.status(400).json({
            message: "Usuario no encontrado",
        });
    }

    res.json({ email: user.email, catched: user.catched });
});

app.post("/catch", verifyToken, (req, res) => {
    const { catched } = req.body;
    const user = req.user;
    // buscar al usuario en el array de usuarios
    const index = users.findIndex((u) => u.email === user.email);
    // aadir los pokemones al array de pokemones del usuario
    users[index].catched.push(...catched);
    // devolver los pokemones del usuario
    res.json(users[index].catched);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
