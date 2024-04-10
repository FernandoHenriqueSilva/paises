const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Multer para lidar com uploads de imagem
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 } // Limite de 5MB para o arquivo de imagem
}).single('bandeira');

let paises = [];

// Rota para a raiz, redirecionando para a página de cadastro
app.get('/', (req, res) => {
  res.redirect('/cadastro');
});

// Rota para exibir o formulário de cadastro
app.get('/cadastro', (req, res) => {
  res.render('cadastro');
});

// Rota para lidar com o envio do formulário
app.post('/cadastro', (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ error: 'Ocorreu um erro ao fazer o upload do arquivo.' });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const { nome, idioma, populacao } = req.body;
    const bandeira = req.file ? req.file.filename : null;

    paises.push({ nome, idioma, populacao, bandeira });

    res.redirect('/consulta');
  });
});

// Rota para exibir os países cadastrados
app.get('/consulta', (req, res) => {
  res.render('consulta', { paises });
});

// Escuta em todas as interfaces de rede, incluindo 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
