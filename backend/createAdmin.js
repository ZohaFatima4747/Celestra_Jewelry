require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./conn/connection');
const Contact = require('./models/contact');

const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Celestra Admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@celestra.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

const run = async () => {
  await connectDB();

  const existing = await Contact.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role === 'admin') {
      console.log('✔ Admin already exists:', ADMIN_EMAIL);
    } else {
      existing.role = 'admin';
      existing.isGuest = false;
      existing.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await existing.save();
      console.log('✔ Existing user promoted to admin:', ADMIN_EMAIL);
    }
    process.exit();
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await Contact.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed,
    role: 'admin',
    isGuest: false,
  });

  console.log('✔ Admin created successfully!');
  console.log('   Email   :', ADMIN_EMAIL);
  console.log('   Password:', ADMIN_PASSWORD);
  process.exit();
};

run().catch((err) => { console.error(err); process.exit(1); });
