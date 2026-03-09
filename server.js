const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/djalissa')
    .then(() => console.log('MongoDB connecté !'))
    .catch(err => console.error('Erreur MongoDB :', err));

// Schemas et Models

// Client (inscription et login)
const clientSchema = new mongoose.Schema({
    fullName: { type: String, required: true, unique: true, trim: true },
    birthday: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    wilaya: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: '' }
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

// Partner
const partnerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    birthdate: { type: String, required: true },
    wilaya: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

const Partner = mongoose.model('Partner', partnerSchema);

// Order
const orderSchema = new mongoose.Schema({
    wilaya: { type: String, required: true },
    color: { type: String, required: true },
    printedName: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// Les Routes

// Configuration Multer pour les images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage: storage });

// Inscription
app.post('/api/signup', async (req, res) => {
    try {
        const { fullName, birthday, email, wilaya, phone, password } = req.body;

        // Vérif doublons
        const existing = await Client.findOne({ $or: [{ email: email.toLowerCase() }, { phone }, { fullName }] });
        if (existing) {
            return res.status(400).json({ error: 'Ce nom, email ou numéro est déjà utilisé.' });
        }

        // Hash du mot de passe
        const hashed = await bcrypt.hash(password, 10);

        const client = new Client({ fullName, birthday, email, wilaya, phone, password: hashed });
        await client.save();
        res.status(201).json({ message: 'Compte créé avec succès !' });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Ces données sont déjà enregistrées.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// Connexion
app.post('/api/login', async (req, res) => {
    try {
        const { fullName, password } = req.body;

        const client = await Client.findOne({ fullName });
        if (!client) {
            return res.status(401).json({ error: 'Nom complet ou mot de passe incorrect.' });
        }

        const match = await bcrypt.compare(password, client.password);
        if (!match) {
            return res.status(401).json({ error: 'Nom complet ou mot de passe incorrect.' });
        }

        res.status(200).json({ message: 'Connexion réussie !', name: client.fullName, profilePic: client.profilePic });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// Profil
app.get('/api/profile', async (req, res) => {
    try {
        const { fullName } = req.query;
        if (!fullName) {
            return res.status(400).json({ error: 'Nom complet requis.' });
        }

        const client = await Client.findOne({ fullName }).select('-password');
        if (!client) {
            return res.status(404).json({ error: 'Client non trouvé.' });
        }

        res.status(200).json(client);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// Upload Photo de Profil
app.post('/api/profile-pic', upload.single('photo'), async (req, res) => {
    try {
        const { fullName } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image envoyée.' });
        }

        const profilePicUrl = '/uploads/' + req.file.filename;

        const client = await Client.findOneAndUpdate(
            { fullName },
            { profilePic: profilePicUrl },
            { new: true }
        ).select('-password');

        if (!client) {
            return res.status(404).json({ error: 'Client non trouvé.' });
        }

        res.status(200).json({ message: 'Photo mise à jour.', profilePic: profilePicUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur lors de l\'upload.' });
    }
});

// Partner route
app.post('/api/partner', async (req, res) => {
    try {
        const { fullName, email, birthdate, wilaya, phone } = req.body;

        const existing = await Partner.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
        if (existing) {
            return res.status(400).json({ error: 'Cet email ou numéro de téléphone est déjà enregistré.' });
        }

        const partner = new Partner({ fullName, email, birthdate, wilaya, phone });
        await partner.save();
        res.status(201).json({ message: 'Partenariat enregistré avec succès !' });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Ces données sont déjà enregistrées.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// Order route
app.post('/api/order', async (req, res) => {
    try {
        const { wilaya, color, printedName, phone } = req.body;

        const existing = await Order.findOne({ printedName });
        if (existing) {
            return res.status(400).json({ error: 'Une commande avec ce nom imprimé existe déjà.' });
        }

        const order = new Order({ wilaya, color, printedName, phone });
        await order.save();
        res.status(201).json({ message: 'Commande effectuée avec succès !' });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Une commande avec ce nom imprimé existe déjà.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// Demarrage du serveur
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
