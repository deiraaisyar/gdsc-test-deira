const express = require("express");
const bodyParser = require("body-parser");
const firebaseAdmin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());

// Pastikan serviceAccount dimuat dengan benar
const serviceAccount = require('./restapi-gdsctest-firebase-adminsdk-hvu70-2de9a8e7bd.json');

// Inisialisasi Firebase Admin SDK
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://restapi-gdsctest-default-rtdb.firebaseio.com/"
});

const db = firebaseAdmin.database();

// Fungsi untuk mendapatkan ID terakhir dan menambahkannya
async function getNextId() {
  const ref = db.ref("counter/id");
  const snapshot = await ref.once("value");
  let currentId = snapshot.val() || 0;
  const newId = currentId + 1;
  await ref.set(newId); // update counter ID
  return newId;
}

// Endpoint Create (POST)
app.post("/api/books", async (req, res) => {
  try {
    const { title, author, published_at } = req.body;

    // Ambil ID berikutnya
    const newId = await getNextId();

    // Mendapatkan timestamp untuk created_at dan updated_at
    const timestamp = new Date().toISOString();

    // Menyimpan data buku ke Firebase
    const ref = db.ref(`books/${newId}`);
    await ref.set({
      title,
      author,
      published_at,
      updated_at: timestamp,
      created_at: timestamp,
    });

    // Respons sukses dengan ID angka
    res.status(201).json({
      message: "Buku berhasil ditambahkan!",
      data: {
        title,
        author,
        published_at,
        updated_at: timestamp,
        created_at: timestamp,
        id: newId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Read All (GET)
app.get("/api/books", async (req, res) => {
  try {
    const ref = db.ref("books");
    ref.once("value", (snapshot) => {
      const books = snapshot.val();

      if (books) {
        // Mengubah format data dan pastikan ID menjadi number
        const booksArray = Object.keys(books).map((key) => ({
          id: parseInt(key), // Mengubah ID menjadi number
          ...books[key], // Menambahkan data buku lainnya
        }));

        // Mengirimkan respons dengan data buku dalam array
        res.status(200).json({ data: booksArray });
      } else {
        res.status(200).json({ data: [] });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Read Specific (GET by ID)
app.get("/api/books/:id", async (req, res) => {
  try {
    const ref = db.ref(`books/${req.params.id}`);
    ref.once("value", (snapshot) => {
      if (snapshot.exists()) {
        res.status(200).json(snapshot.val());
      } else {
        res.status(404).json({ message: "Buku tidak ditemukan!" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Update (PUT)
app.put("/api/books/:id", async (req, res) => {
  try {
    const updates = req.body;
    const ref = db.ref(`books/${req.params.id}`);

    // Ambil data yang ada saat ini dari Firebase
    const snapshot = await ref.once("value");
    const currentData = snapshot.val();

    if (!currentData) {
      return res.status(404).json({ message: "Buku tidak ditemukan!" });
    }

    // Pastikan ID dalam format angka (convert ID menjadi number)
    const id = parseInt(req.params.id, 10); // Memastikan ID adalah angka

    // Update field yang ada, jika ada di body, jika tidak, biarkan tetap dengan nilai yang lama
    const updatedData = {
      title: updates.title || currentData.title,
      author: updates.author || currentData.author,
      published_at: updates.published_at || currentData.published_at,
      updated_at: new Date().toISOString(), // Set timestamp baru untuk updated_at
      created_at: currentData.created_at, // Pertahankan created_at yang lama
      id: id, // Pastikan ID tetap dalam format number
    };

    // Simpan data yang sudah diperbarui ke Firebase
    await ref.update(updatedData);

    // Kembalikan respons dengan data yang baru
    res.status(200).json({
      message: "Data berhasil diupdate!",
      data: updatedData, // Pastikan 'data' yang diperbarui ada di sini
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Delete (DELETE)
app.delete("/api/books/:id", async (req, res) => {
  try {
    const ref = db.ref(`books/${req.params.id}`);
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "Buku tidak ditemukan!" });
    }

    await ref.remove();
    res.status(200).json({ message: "Data berhasil dihapus!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware untuk menangani 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan!" });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
