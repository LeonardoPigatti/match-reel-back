// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer'); // Para upload de avatar
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexão MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log("Erro mongo", err));

// Configuração Multer para avatar
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Modelo de Usuário
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String },
  bio: { type: String },
  avatar: { type: String },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // <-- ADICIONADO

  preferences: {
    movies: { type: Boolean, default: false },
    series: { type: Boolean, default: false },
    both: { type: Boolean, default: false }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// POST /api/add-friend
app.post('/api/add-friend', async (req, res) => {
  const { myEmail, friendEmail } = req.body;

  try {
    const me = await User.findOne({ email: myEmail });
    const friend = await User.findOne({ email: friendEmail });

    if (!friend) return res.status(404).json({ message: "Amigo não encontrado" });

    // Evita adicionar duas vezes
    if (me.friends.includes(friend._id)) {
      return res.status(400).json({ message: "Já é seu amigo" });
    }

    me.friends.push(friend._id);
    await me.save();

    res.json({ message: "Amigo adicionado com sucesso", friend: { name: friend.name, email: friend.email, username: friend.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// Rota login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Preencha email e senha' });
    }

    // Buscar usuário pelo email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Email ou senha inválidos' });

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Email ou senha inválidos' });

    // Login OK
    res.json({
      message: 'Login realizado com sucesso!',
      user: {
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno' });
  }
});


// Rota signup
app.post('/api/signup', upload.single('avatar'), async (req, res) => {
  try {
    const { name, username, email, password, dob, gender, bio, preferences } = req.body;

    // Checar se email ou username já existe
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if(existingUser) return res.status(400).json({ message: 'Usuário já existe' });

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      dob,
      gender,
      bio,
      avatar: req.file ? `/uploads/${req.file.filename}` : null,
      preferences: JSON.parse(preferences || '{}') // Recebe objeto JSON do frontend
    });

    await newUser.save();

    res.status(201).json({ message: 'Usuário criado com sucesso', user: newUser });
  } catch(err) {
    console.log(err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
