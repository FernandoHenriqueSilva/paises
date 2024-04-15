const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const { BlobServiceClient } = require('@azure/storage-blob');

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

// Configuração da conexão com o banco de dados MySQL
const connection = mysql.createConnection({
  host: 'mysql',
  user: 'fernando',
  password: 'newspwd',
  database: 'paises'
});

// Conectar ao banco de dados MySQL
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados MySQL:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL');
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

    // Insira os dados no banco de dados MySQL
    connection.query('INSERT INTO paises (nome, idioma, populacao, bandeira) VALUES (?, ?, ?, ?)', 
      [nome, idioma, populacao, bandeira], 
      (error, results, fields) => {
        if (error) {
          console.error('Erro ao inserir país no banco de dados:', error);
          return res.status(500).json({ error: 'Erro ao cadastrar país.' });
        }
        console.log('País cadastrado com sucesso');
        res.redirect('/consulta');
      }
    );
  });
});

// Rota para exibir os países cadastrados
app.get('/consulta', (req, res) => {
  // Consulta os dados no banco de dados MySQL
  connection.query('SELECT * FROM paises', (error, results, fields) => {
    if (error) {
      console.error('Erro ao consultar países no banco de dados:', error);
      return res.status(500).json({ error: 'Erro ao consultar países.' });
    }
    res.render('consulta', { paises: results });
  });
});

// Encerrar conexão com o banco de dados MySQL ao encerrar o servidor
process.on('SIGINT', () => {
  console.log('Encerrando conexão com o banco de dados MySQL');
  connection.end();
});

// Configuração da conexão com o Azure Blob Storage
const blobServiceClient = BlobServiceClient.fromConnectionString('sua_string_de_conexao_azure');

// Função para fazer upload de imagem para o Blob Storage
async function uploadToBlobStorage(filePath, blobName) {
  const containerName = 'seu_container';
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const uploadBlobResponse = await blockBlobClient.uploadFile(filePath);
    console.log(`Arquivo ${blobName} enviado para o Blob Storage com sucesso`);
    return uploadBlobResponse;
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo para o Blob Storage:', error);
    throw error;
  }
}

// Uso da função para fazer upload de imagem
app.post('/cadastro', async (req, res) => {
  upload(req, res, async function (err) {
    // Lógica de upload do formulário...
    const bandeira = req.file ? req.file.filename : null;
    await uploadToBlobStorage('caminho_da_imagem_local', bandeira); // Faça upload da imagem para o Blob Storage
    // Restante da lógica do seu aplicativo...
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
