import api from './api';

export const AuthService = {
    login: async (email, senha) => {
        const response = await api.post('/auth/login', { email, senha });
        return response.data;
    },
    
    register: async (nome, email, senha) => {
        const response = await api.post('/auth/register', { nome, email, senha });
        return response.data;
    }
};

export const AgendamentoService = {
    getByUser: async (userId) => {
        const response = await api.get(`/agendamento_simples/user/${userId}`);
        return response.data;
    },
    
    create: async (agendamentoData) => {
        const response = await api.post('/agendamento_simples', agendamentoData);
        return response.data;
    },
    
    cancelar: async (agendamentoId, justificativa) => {
        const response = await api.put(`/agendamento_simples/${agendamentoId}/cancelar`, {
            justificativa: justificativa
        });
        return response.data;
    }
};

export const OficinaService = {
    getAll: async () => {
        const response = await api.get('/oficinas-completas');
        return response.data;
    },
    
    getById: async (id) => {
        const response = await api.get(`/oficina/${id}/detalhes`);
        return response.data;
    },
    
    getHorariosOcupados: async (oficinaId, data) => {
        const response = await api.get(`/oficina/${oficinaId}/horarios-ocupados/${data}`);
        return response.data;
    }
};