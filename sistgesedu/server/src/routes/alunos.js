const express = require('express');
const router = express.Router();
const {
  getAlunos,
  getAlunoById,
  createAluno,
  updateAluno,
  deleteAluno,
  gerarTemplatePorTurma,
  importarAlunos
} = require('../controllers/alunoController');
const { auth, isAdmin } = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getAlunos)
  .post(isAdmin, createAluno);

// Importar múltiplos alunos em lote
router.post('/importar', isAdmin, importarAlunos);

// Gerar template de alunos por turma
router.get('/template/:turmaId', gerarTemplatePorTurma);

router.route('/:id')
  .get(getAlunoById)
  .put(isAdmin, updateAluno)
  .delete(isAdmin, deleteAluno);

module.exports = router;
