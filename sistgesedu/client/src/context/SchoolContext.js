import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const SchoolContext = createContext();

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool deve ser usado dentro de SchoolProvider');
  }
  return context;
};

export const SchoolProvider = ({ children }) => {
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Dados centralizados para sincronização
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [alunosLoading, setAlunosLoading] = useState(false);
  const [turmasLoading, setTurmasLoading] = useState(false);
  const [avaliacoesLoading, setAvaliacoesLoading] = useState(false);
  const [habilidadesLoading, setHabilidadesLoading] = useState(false);

  const loadSchoolSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      console.log('SchoolSettings carregadas:', response.data);
      setSchoolSettings(response.data);
      setRefreshKey(prev => prev + 1); // Forçar re-renderização
    } catch (error) {
      console.error('Erro ao carregar configurações da escola:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar alunos
  const loadAlunos = useCallback(async () => {
    try {
      setAlunosLoading(true);
      const response = await api.get('/alunos');
      // Backend retorna { data: [], pagination: {} }
      setAlunos(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]); // Garantir que sempre seja array
    } finally {
      setAlunosLoading(false);
    }
  }, []);

  // Carregar turmas
  const loadTurmas = useCallback(async () => {
    try {
      setTurmasLoading(true);
      const response = await api.get('/turmas');
      // Backend retorna { data: [], pagination: {} }
      setTurmas(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      setTurmas([]); // Garantir que sempre seja array
    } finally {
      setTurmasLoading(false);
    }
  }, []);

  // Carregar avaliações (opcional: por filtros)
  const loadAvaliacoes = useCallback(async (filtros = {}) => {
    try {
      setAvaliacoesLoading(true);
      const response = await api.get('/avaliacoes', { params: filtros });
      setAvaliacoes(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setAvaliacoes([]);
    } finally {
      setAvaliacoesLoading(false);
    }
  }, []);

  // Carregar habilidades (opcional: por filtros)
  const loadHabilidades = useCallback(async (filtros = {}) => {
    try {
      setHabilidadesLoading(true);
      const response = await api.get('/habilidades', { params: filtros });
      setHabilidades(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar habilidades:', error);
      setHabilidades([]);
    } finally {
      setHabilidadesLoading(false);
    }
  }, []);

  // Sincronizar dados (atualizar ambos quando um aluno é modificado)
  const syncData = useCallback(async () => {
    await Promise.all([loadAlunos(), loadTurmas()]);
  }, [loadAlunos, loadTurmas]);

  // Sincronizar tudo (incluindo avaliações e habilidades)
  const syncAll = useCallback(async (filtros = {}) => {
    await Promise.all([
      loadAlunos(),
      loadTurmas(),
      loadAvaliacoes(filtros),
      loadHabilidades(filtros)
    ]);
  }, [loadAlunos, loadTurmas, loadAvaliacoes, loadHabilidades]);

  useEffect(() => {
    loadSchoolSettings();
    syncData(); // Carregar dados iniciais
  }, []);

  const updateSchoolSettings = (newSettings) => {
    console.log('Atualizando SchoolSettings:', newSettings);
    setSchoolSettings(newSettings);
    setRefreshKey(prev => prev + 1); // Forçar re-renderização
  };

  return (
    <SchoolContext.Provider value={{ 
      schoolSettings, 
      loading, 
      loadSchoolSettings,
      updateSchoolSettings,
      refreshKey,
      // Dados e funções para sincronização
      alunos,
      turmas,
      avaliacoes,
      habilidades,
      alunosLoading,
      turmasLoading,
      avaliacoesLoading,
      habilidadesLoading,
      loadAlunos,
      loadTurmas,
      loadAvaliacoes,
      loadHabilidades,
      syncData,
      syncAll
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

    </SchoolContext.Provider>
  );
};
