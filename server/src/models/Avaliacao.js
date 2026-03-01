const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
  aluno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aluno',
    required: true,
    index: true
  },
  disciplina: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disciplina',
    required: true,
    index: true
  },
  turma: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turma',
    required: true,
    index: true
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor',
    required: false,
    index: true
  },
  ano: {
    type: Number,
    required: true,
    index: true,
    min: 2020,
    max: 2030
  },
  trimestre: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    min: 1,
    max: 3,
    index: true
  },
  
  // NOVO SISTEMA DE PONTOS DE CORTE (Notas de 0 a 10)
  pontosCorte: {
    pc1: {
      nota: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      data: Date,
      habilidades: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habilidade'
      }]
    },
    pc2: {
      nota: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      data: Date,
      habilidades: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habilidade'
      }]
    },
    mediaFinal: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    eac: {
      nota: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      data: Date,
      habilidades: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habilidade'
      }]
    }
  },
  
  // NOTA FINAL E CLASSIFICAÇÃO (calculadas automaticamente)
  notaFinalTrimestre: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
    index: true
  },
  classificacao: {
    type: String,
    enum: ['adequado', 'proficiente', 'em-alerta', 'intervencao-imediata', 'sem-avaliacao'],
    default: 'sem-avaliacao',
    index: true
  },
  
  // MANTER COMPATIBILIDADE COM SISTEMA ANTIGO (deprecado)
  avaliacoes: [{
    tipo: {
      type: String,
      enum: ['prova', 'trabalho', 'participacao', 'simulado', 'atividade', 'seminario', 'projeto', 'pesquisa', 'outro']
    },
    descricao: String,
    nota: {
      type: Number,
      min: 0,
      max: 10
    },
    peso: {
      type: Number,
      default: 1,
      min: 0.1
    },
    data: {
      type: Date,
      default: Date.now
    },
    habilidades: [{
      habilidade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habilidade'
      },
      nivel: {
        type: String,
        enum: ['nao-desenvolvido', 'em-desenvolvimento', 'desenvolvido', 'plenamente-desenvolvido'],
        default: 'em-desenvolvimento'
      },
      observacao: String
    }]
  }],
  notaTrimestre: {
    type: Number,
    min: 0,
    max: 10
  },
  
  observacoes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices compostos para queries otimizadas
avaliacaoSchema.index({ aluno: 1, disciplina: 1, ano: 1, trimestre: 1 }, { unique: true });
avaliacaoSchema.index({ turma: 1, disciplina: 1, ano: 1 });
avaliacaoSchema.index({ ano: 1, trimestre: 1 });
avaliacaoSchema.index({ notaFinalTrimestre: 1, ano: 1 });
avaliacaoSchema.index({ classificacao: 1, ano: 1, trimestre: 1 });

// Método para calcular Média Final (PC1 + PC2)
avaliacaoSchema.methods.calcularMediaFinal = function() {
  const pc1 = this.pontosCorte?.pc1?.nota || 0;
  const pc2 = this.pontosCorte?.pc2?.nota || 0;
  this.pontosCorte.mediaFinal = parseFloat((pc1 + pc2).toFixed(2));
  return this.pontosCorte.mediaFinal;
};

// Método para calcular Nota Final do Trimestre (maior entre Média Final e EAC)
avaliacaoSchema.methods.calcularNotaFinal = function() {
  const mediaFinal = this.pontosCorte?.mediaFinal || 0;
  const eac = this.pontosCorte?.eac?.nota || 0;
  this.notaFinalTrimestre = parseFloat(Math.max(mediaFinal, eac).toFixed(2));
  return this.notaFinalTrimestre;
};

// Método para calcular Classificação baseada na Nota Final
avaliacaoSchema.methods.calcularClassificacao = function() {
  const nota = this.notaFinalTrimestre;
  
  if (nota === 0) {
    this.classificacao = 'sem-avaliacao';
  } else if (nota >= 80) {
    this.classificacao = 'adequado';
  } else if (nota >= 60) {
    this.classificacao = 'proficiente';
  } else if (nota >= 40) {
    this.classificacao = 'em-alerta';
  } else {
    this.classificacao = 'intervencao-imediata';
  }
  
  return this.classificacao;
};

// Método para calcular nota do trimestre (sistema antigo - manter compatibilidade)
avaliacaoSchema.methods.calcularNotaTrimestre = function() {
  if (!this.avaliacoes || this.avaliacoes.length === 0) {
    return 0;
  }

  // SOMA SIMPLES de todas as notas (sem divisão, sem pesos)
  let somaNotas = 0;

  this.avaliacoes.forEach(av => {
    somaNotas += av.nota;
  });

  this.notaTrimestre = parseFloat(somaNotas.toFixed(2));
  return this.notaTrimestre;
};

// Hook para calcular tudo automaticamente antes de salvar
avaliacaoSchema.pre('save', function(next) {
  // NOVO SISTEMA: Calcular pontos de corte
  if (this.pontosCorte && (this.pontosCorte.pc1 || this.pontosCorte.pc2 || this.pontosCorte.eac)) {
    // Validar limites
    if (this.pontosCorte.pc1?.nota > 50) {
      return next(new Error('PC1 não pode ultrapassar 50 pontos'));
    }
    if (this.pontosCorte.pc2?.nota > 50) {
      return next(new Error('PC2 não pode ultrapassar 50 pontos'));
    }
    if (this.pontosCorte.eac?.nota > 100) {
      return next(new Error('EAC não pode ultrapassar 100 pontos'));
    }
    
    // Calcular Média Final (PC1 + PC2)
    this.calcularMediaFinal();
    
    // Calcular Nota Final (max entre Média Final e EAC)
    this.calcularNotaFinal();
    
    // Calcular Classificação
    this.calcularClassificacao();
  }
  
  // SISTEMA ANTIGO: Calcular soma das notas (manter compatibilidade)
  if (this.avaliacoes && this.avaliacoes.length > 0) {
    let somaNotas = 0;
    this.avaliacoes.forEach(av => {
      somaNotas += av.nota;
    });
    
    // Validar limite
    if (somaNotas > 10) {
      return next(new Error(`A soma das notas (${somaNotas.toFixed(2)}) ultrapassou o limite de 10.0 pontos. Ajuste as notas.`));
    }
    
    this.calcularNotaTrimestre();
  }
  
  next();
});

module.exports = mongoose.model('Avaliacao', avaliacaoSchema);
