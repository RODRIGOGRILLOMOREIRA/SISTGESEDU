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
  const [alunosLoading, setAlunosLoading] = useState(false);
  const [turmasLoading, setTurmasLoading] = useState(false);

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
      setAlunos(response.data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setAlunosLoading(false);
    }
  }, []);

  // Carregar turmas
  const loadTurmas = useCallback(async () => {
    try {
      setTurmasLoading(true);
      const response = await api.get('/turmas');
      setTurmas(response.data);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setTurmasLoading(false);
    }
  }, []);

  // Sincronizar dados (atualizar ambos quando um aluno é modificado)
  const syncData = useCallback(async () => {
    await Promise.all([loadAlunos(), loadTurmas()]);
  }, [loadAlunos, loadTurmas]);

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
      alunosLoading,
      turmasLoading,
      loadAlunos,
      loadTurmas,
      syncData
    }}>
      {children}
    </SchoolContext.Provider>
  );
};
