const express = require('express');
const router = express.Router();
const {
  getFrequencias,
  registrarFrequencia,
  registrarChamadaTurma,
  getFrequenciaAluno,
  getFrequenciaTurmaDia,
  getDashboardFrequencia,
  justificarFalta,
  updateFrequencia,
  deleteFrequencia,
  importarFrequencias,
  gerarTemplatePorTurma,
  getEstatisticasTurma,
  resetarDia,
  registrarChamadaTurmaGeral
} = require('../controllers/frequenciaController');
const { auth } = require('../middleware/auth');

// Rotas públicas (com autenticação)
router.use(auth);

// Rotas principais
router.route('/')
  .get(getFrequencias)
  .post(registrarFrequencia);

// Importar frequências
router.post('/importar', importarFrequencias);

// Gerar template de frequências por turma
router.get('/template/:turmaId', gerarTemplatePorTurma);

// Dashboard de frequência
router.get('/dashboard', getDashboardFrequencia);

// Frequência por aluno
router.get('/aluno/:alunoId', getFrequenciaAluno);

// Frequência da turma por dia
router.get('/turma/:turmaId/dia/:data', getFrequenciaTurmaDia);

// Registrar chamada completa da turma
router.post('/turma/:turmaId/chamada', registrarChamadaTurma);

// Operações individuais
router.route('/:id')
  .put(updateFrequencia)
  .delete(deleteFrequencia);

// Justificar falta
router.put('/:id/justificar', justificarFalta);

// Estatísticas acumulativas da turma
router.get('/estatisticas-turma/:turmaId', getEstatisticasTurma);

// Resetar frequências de um dia
router.delete('/resetar-dia', resetarDia);

// Registrar chamada geral (todas as disciplinas)
router.post('/turma-geral/:turmaId', registrarChamadaTurmaGeral);

module.exports = router;
