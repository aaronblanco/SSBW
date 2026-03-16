const prisma = require('../prisma/client');

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function createUser({ firstName, lastName, birthDate, email, passwordHash, role = 'user' }) {
  return prisma.user.create({
    data: {
      firstName,
      lastName,
      birthDate: new Date(birthDate),
      email,
      passwordHash,
      role
    }
  });
}

module.exports = {
  findByEmail,
  findById,
  createUser
};
