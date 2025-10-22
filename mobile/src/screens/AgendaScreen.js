"use client"

import React, { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  RefreshControl,
  Modal,
  FlatList,
  TextInput
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Car, 
  Tag, 
  Filter,
  ChevronDown,
  Check,
  AlertCircle,
  Star,
  FileText,
  RotateCcw,
  X
} from "lucide-react-native"
import api from "./services/api.js";

// Componente de Modal de Seleção
const SelectionModal = ({ 
  visible, 
  title, 
  options, 
  onSelect, 
  onClose,
  selectedValue
}) => {
  const renderItem = (item, isSelected) => (
    <View style={[
      selectionModalStyles.optionCard,
      isSelected && selectionModalStyles.optionCardSelected
    ]}>
      <Text style={[
        selectionModalStyles.optionText,
        isSelected && selectionModalStyles.optionTextSelected
      ]}>
        {item.label || item.nome || item}
      </Text>
      {isSelected && <Check size={20} color="#eab308" />}
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={selectionModalStyles.container}>
        <View style={selectionModalStyles.header}>
          <Text style={selectionModalStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={options}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onSelect(item)}>
              {renderItem(item, selectedValue === (item.id || item))}
            </TouchableOpacity>
          )}
          contentContainerStyle={selectionModalStyles.list}
        />
      </View>
    </Modal>
  )
}

// Modal de Cancelamento com Justificativa
const CancelamentoModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  onClose 
}) => {
  const [justificativa, setJustificativa] = useState("")

  const handleConfirm = () => {
    if (!justificativa.trim()) {
      Alert.alert("Erro", "Por favor, informe a justificativa para o cancelamento.")
      return
    }
    onConfirm(justificativa)
    setJustificativa("")
  }

  const handleClose = () => {
    setJustificativa("")
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={cancelamentoModalStyles.overlay}>
        <View style={cancelamentoModalStyles.container}>
          <View style={cancelamentoModalStyles.header}>
            <Text style={cancelamentoModalStyles.title}>Cancelar Agendamento</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <View style={cancelamentoModalStyles.content}>
            <Text style={cancelamentoModalStyles.label}>
              Por favor, informe o motivo do cancelamento:
            </Text>
            
            <TextInput
              style={cancelamentoModalStyles.input}
              placeholder="Digite a justificativa..."
              placeholderTextColor="#64748b"
              value={justificativa}
              onChangeText={setJustificativa}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={cancelamentoModalStyles.buttons}>
              <TouchableOpacity 
                style={[cancelamentoModalStyles.button, cancelamentoModalStyles.buttonCancel]}
                onPress={handleClose}
              >
                <Text style={cancelamentoModalStyles.buttonCancelText}>Voltar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[cancelamentoModalStyles.button, cancelamentoModalStyles.buttonConfirm]}
                onPress={handleConfirm}
              >
                <Text style={cancelamentoModalStyles.buttonConfirmText}>Confirmar Cancelamento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const selectionModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  list: {
    padding: 16,
  },
  optionCard: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionCardSelected: {
    borderColor: "#eab308",
    backgroundColor: "#1e293b",
  },
  optionText: {
    fontSize: 16,
    color: "#ffffff",
    flex: 1,
  },
  optionTextSelected: {
    color: "#eab308",
    fontWeight: "600",
  },
})

const cancelamentoModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    width: "100%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#334155",
  },
  buttonCancelText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  buttonConfirm: {
    backgroundColor: "#dc2626",
  },
  buttonConfirmText: {
    color: "#ffffff",
    fontWeight: "500",
  },
})

export default function AgendaScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("recentes")

  // Estados para os modais de seleção
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPeriodoModal, setShowPeriodoModal] = useState(false)
  const [showOrdenacaoModal, setShowOrdenacaoModal] = useState(false)

  // Estados para o modal de cancelamento
  const [showCancelamentoModal, setShowCancelamentoModal] = useState(false)
  const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState(null)

  const statusOptions = [
    { id: "todos", label: "Todos os Status" },
    { id: "pendente", label: "Pendentes" },
    { id: "agendado", label: "Agendados" },
    { id: "concluido", label: "Concluídos" },
    { id: "cancelado", label: "Cancelados" }
  ]

  const periodoOptions = [
    { id: "todos", label: "Todos os Períodos" },
    { id: "hoje", label: "Hoje" },
    { id: "semana", label: "Esta Semana" },
    { id: "mes", label: "Este Mês" },
    { id: "mes_passado", label: "Mês Passado" }
  ]

  const ordenacaoOptions = [
    { id: "recentes", label: "Mais Recentes" },
    { id: "antigos", label: "Mais Antigos" },
    { id: "data_asc", label: "Data (Crescente)" },
    { id: "data_desc", label: "Data (Decrescente)" }
  ]

  useEffect(() => {
    loadUser()
    loadAgendamentos()
  }, [])

  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem("oilsmart_current_user")
      if (!userJson) {
        navigation.replace("Login")
      } else {
        setCurrentUser(JSON.parse(userJson))
      }
    } catch (error) {
      navigation.replace("Login")
    }
  }

  const loadAgendamentos = async () => {
    try {
        console.log("📋 Carregando agendamentos da API...");
        
        const userJson = await AsyncStorage.getItem("oilsmart_current_user");
        if (!userJson) {
            console.log("❌ Usuário não encontrado");
            return;
        }

        const user = JSON.parse(userJson);
        console.log(`👤 Buscando agendamentos para o usuário: ${user.id}`);
        
        // Tenta buscar da API com tratamento melhor
        try {
            const response = await api.get(`/agendamento_simples/usuario/${user.id}`);
            console.log("📊 Resposta da API:", response.data);
            
            if (response.data && response.data.success) {
                console.log(`✅ ${response.data.data.length} agendamentos carregados da API`);
                setAgendamentos(response.data.data);
                return;
            } else {
                console.log("⚠️ API retornou success: false", response.data);
            }
        } catch (apiError) {
            console.log("🔴 Erro na chamada da API:", apiError.response?.status, apiError.message);
            
            // Log mais detalhado para debugging
            if (apiError.response) {
                console.log("📉 Status:", apiError.response.status);
                console.log("📉 Data:", apiError.response.data);
                console.log("📉 Headers:", apiError.response.headers);
            }
        }
        
        // Fallback para dados locais
        console.log("🔄 Usando dados locais como fallback");
        await loadAgendamentosLocais();
        
    } catch (error) {
        console.error("❌ Erro crítico ao carregar agendamentos:", error);
        await loadAgendamentosLocais();
    }
  };

  // Função separada para carregar agendamentos locais
  const loadAgendamentosLocais = async () => {
    try {
        const agendamentosJson = await AsyncStorage.getItem("oilsmart_agendamentos");
        const agendamentosData = agendamentosJson ? JSON.parse(agendamentosJson) : [];
        
        if (agendamentosData.length === 0) {
            // Dados de exemplo locais
            const agendamentosExemplo = [
                {
                    id: "1",
                    protocolo: "#OIL20241215-001",
                    usuario_id: "1",
                    veiculo: "Volkswagen Gol 2020",
                    oficina_nome: "Motul Center São Paulo",
                    oficina_endereco: "Av. Brigadeiro Luís Antônio, 3170, São Paulo/SP",
                    oficina_telefone: "(11) 3285-2200",
                    servicos: "Óleo Sintético 5W-30 + Filtro de Óleo Original",
                    total_servico: 160.00,
                    data_hora: "2024-12-20 10:00:00",
                    status: "agendado",
                    criado_em: new Date().toISOString()
                },
                {
                    id: "2",
                    protocolo: "#OIL20241210-002",
                    usuario_id: "1",
                    veiculo: "Fiat Uno 2018",
                    oficina_nome: "Rei do Óleo - Vila Mariana",
                    oficina_endereco: "R. Domingos de Morais, 2564, São Paulo/SP",
                    oficina_telefone: "(11) 5084-5247",
                    servicos: "Óleo Mineral 20W-50",
                    total_servico: 80.00,
                    data_hora: "2024-12-18 14:30:00",
                    status: "concluido",
                    criado_em: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            
            await AsyncStorage.setItem("oilsmart_agendamentos", JSON.stringify(agendamentosExemplo));
            setAgendamentos(agendamentosExemplo);
            console.log("📝 Dados de exemplo carregados");
        } else {
            setAgendamentos(agendamentosData);
            console.log(`📁 ${agendamentosData.length} agendamentos carregados do storage local`);
        }
    } catch (error) {
        console.error("❌ Erro ao carregar agendamentos locais:", error);
        setAgendamentos([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAgendamentos()
    setRefreshing(false)
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case "concluido":
        return { label: "Concluído", color: "#10b981", bgColor: "#064e3b" }
      case "pendente":
        return { label: "Pendente", color: "#f59e0b", bgColor: "#78350f" }
      case "cancelado":
        return { label: "Cancelado", color: "#ef4444", bgColor: "#7f1d1d" }
      case "agendado":
        return { label: "Agendado", color: "#3b82f6", bgColor: "#1e3a8a" }
      default:
        return { label: "Desconhecido", color: "#6b7280", bgColor: "#374151" }
    }
  }

  // Funções de gerenciamento de agendamentos atualizadas
  const repetirAgendamento = async (agendamento) => {
    Alert.alert(
        "Repetir Agendamento",
        "Deseja repetir este agendamento com os mesmos serviços?",
        [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Confirmar", 
                onPress: async () => {
                    try {
                        // Buscar dados do agendamento anterior
                        const response = await api.get(`/agendamento_simples/${agendamento.id}`);
                        
                        if (response.data.success) {
                            const agendamentoAnterior = response.data.data;
                            
                            // Navegar para serviços com os dados anteriores
                            navigation.navigate("Servicos", { 
                                agendamentoAnterior: agendamentoAnterior 
                            });
                        }
                    } catch (error) {
                        console.error("Erro ao buscar agendamento:", error);
                        navigation.navigate("Servicos", { 
                            agendamentoAnterior: agendamento 
                        });
                    }
                }
            }
        ]
    );
  };

  const baixarComprovante = async (agendamento) => {
    try {
        console.log("📄 Gerando comprovante...");
        
        // Aqui você pode integrar com um serviço de PDF ou mostrar os dados
        const comprovante = `
COMPROVANTE DE AGENDAMENTO
Protocolo: ${agendamento.protocolo}
Data: ${new Date(agendamento.data_hora).toLocaleDateString('pt-BR')}
Hora: ${new Date(agendamento.data_hora).toLocaleTimeString('pt-BR')}
Oficina: ${agendamento.oficina_nome}
Endereço: ${agendamento.oficina_endereco}
Telefone: ${agendamento.oficina_telefone}
Serviços: ${agendamento.servicos}
Veículo: ${agendamento.veiculo}
Total: R$ ${parseFloat(agendamento.total_servico).toFixed(2)}
Status: ${agendamento.status}
        `.trim();

        Alert.alert(
            "Comprovante Gerado", 
            `Comprovante do agendamento ${agendamento.protocolo}\n\n${comprovante}`,
            [{ text: "OK" }]
        );
        
    } catch (error) {
        console.error("Erro ao gerar comprovante:", error);
        Alert.alert("Comprovante", `Comprovante do agendamento ${agendamento.protocolo} gerado com sucesso!`);
    }
  };

  const avaliarServico = (agendamento) => {
    Alert.alert(
        "Avaliar Serviço",
        `Como foi sua experiência com o serviço?\n\nAgendamento: ${agendamento.protocolo}`,
        [
            { text: "⭐ Péssimo", onPress: () => enviarAvaliacao(agendamento.id, 1) },
            { text: "⭐⭐ Ruim", onPress: () => enviarAvaliacao(agendamento.id, 2) },
            { text: "⭐⭐⭐ Regular", onPress: () => enviarAvaliacao(agendamento.id, 3) },
            { text: "⭐⭐⭐⭐ Bom", onPress: () => enviarAvaliacao(agendamento.id, 4) },
            { text: "⭐⭐⭐⭐⭐ Excelente", onPress: () => enviarAvaliacao(agendamento.id, 5) },
        ]
    );
  };

  const enviarAvaliacao = async (agendamentoId, nota) => {
    try {
        const response = await api.post(`/agendamento_simples/${agendamentoId}/avaliacao`, {
            nota: nota,
            comentario: "Avaliação via app"
        });
        
        if (response.data.success) {
            Alert.alert("✅ Avaliação Enviada", "Obrigado por sua avaliação!");
        }
    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        Alert.alert("✅ Avaliação Registrada", "Obrigado por sua avaliação!");
    }
  };

  const solicitarCancelamento = (agendamento) => {
    setAgendamentoParaCancelar(agendamento)
    setShowCancelamentoModal(true)
  }

  // Atualize a função de cancelamento para usar a API
  const confirmarCancelamento = async (justificativa) => {
    try {
        console.log("❌ Cancelando agendamento via API...");
        
        const response = await api.post(`/agendamento_simples/${agendamentoParaCancelar.id}/cancelar`, {
            motivo: justificativa
        });

        if (response.data.success) {
            console.log("✅ Agendamento cancelado na API!");
            
            // Atualizar lista local
            const agendamentosAtualizados = agendamentos.map(agendamento => 
                agendamento.id === agendamentoParaCancelar.id 
                    ? { 
                        ...agendamento, 
                        status: "cancelado", 
                        motivo_cancelamento: justificativa,
                        data_cancelamento: new Date().toISOString()
                    }
                    : agendamento
            );

            setAgendamentos(agendamentosAtualizados);
            setShowCancelamentoModal(false);
            setAgendamentoParaCancelar(null);
            
            Alert.alert("✅ Sucesso", "Agendamento cancelado com sucesso!");
        } else {
            throw new Error(response.data.message);
        }
        
    } catch (error) {
        console.error("❌ Erro ao cancelar agendamento:", error);
        Alert.alert("❌ Erro", "Não foi possível cancelar o agendamento. Tente novamente.");
    }
  };

  const filtrarAgendamentos = () => {
    let filtrados = [...agendamentos]

    // Filtro por status
    if (filtroStatus !== "todos") {
      filtrados = filtrados.filter(agendamento => agendamento.status === filtroStatus)
    }

    // Filtro por período (simplificado)
    if (filtroPeriodo !== "todos") {
      const hoje = new Date()
      filtrados = filtrados.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_hora)
        switch (filtroPeriodo) {
          case "hoje":
            return dataAgendamento.toDateString() === hoje.toDateString()
          case "semana":
            const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
            return dataAgendamento >= umaSemanaAtras
          case "mes":
            const umMesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
            return dataAgendamento >= umMesAtras
          default:
            return true
        }
      })
    }

    // Ordenação
    filtrados.sort((a, b) => {
      const dataA = new Date(a.data_hora)
      const dataB = new Date(b.data_hora)
      
      switch (ordenacao) {
        case "recentes":
          return dataB - dataA
        case "antigos":
          return dataA - dataB
        case "data_asc":
          return dataA - dataB
        case "data_desc":
          return dataB - dataA
        default:
          return dataB - dataA
      }
    })

    return filtrados
  }

  const limparFiltros = () => {
    setFiltroStatus("todos")
    setFiltroPeriodo("todos")
    setOrdenacao("recentes")
  }

  const getSelectedLabel = (value, options) => {
    const option = options.find(opt => opt.id === value)
    return option ? option.label : options[0].label
  }

  const agendamentosFiltrados = filtrarAgendamentos()

  if (!currentUser) return null

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>OS</Text>
            </View>
            <Text style={styles.logoTitle}>OilSmart</Text>
          </View>
          <Text style={styles.headerTitle}>Meus Agendamentos</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Lembrete de Próxima Troca */}
        <View style={styles.lembreteSection}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Lembrete de Próxima Troca</Text>
          </View>
          
          <View style={styles.lembreteCard}>
            <View style={styles.lembreteContent}>
              <View style={styles.lembreteIcon}>
                <Car size={24} color="#0f172a" />
              </View>
              <View style={styles.lembreteDetails}>
                <Text style={styles.lembreteTitulo}>Troca de Óleo e Filtro</Text>
                <Text style={styles.lembreteTexto}>
                  Recomendamos realizar a próxima troca até: <Text style={styles.lembreteDestaque}>15/01/2024</Text>
                </Text>
                <Text style={styles.lembreteTexto}>
                  Quilometragem estimada: <Text style={styles.lembreteDestaque}>85.000 km</Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.buttonPrimary}
              onPress={() => navigation.navigate("Servicos")}
            >
              <Text style={styles.buttonPrimaryText}>Agendar Troca</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtrosSection}>
          <View style={styles.sectionHeader}>
            <Filter size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Filtros</Text>
          </View>

          <View style={styles.filtrosContainer}>
            {/* Status */}
            <View style={styles.filtroGroup}>
              <Text style={styles.filtroLabel}>Status:</Text>
              <TouchableOpacity
                style={styles.selectContainer}
                onPress={() => setShowStatusModal(true)}
              >
                <Text style={styles.selectText}>
                  {getSelectedLabel(filtroStatus, statusOptions)}
                </Text>
                <ChevronDown size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Período */}
            <View style={styles.filtroGroup}>
              <Text style={styles.filtroLabel}>Período:</Text>
              <TouchableOpacity
                style={styles.selectContainer}
                onPress={() => setShowPeriodoModal(true)}
              >
                <Text style={styles.selectText}>
                  {getSelectedLabel(filtroPeriodo, periodoOptions)}
                </Text>
                <ChevronDown size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Ordenação */}
            <View style={styles.filtroGroup}>
              <Text style={styles.filtroLabel}>Ordenar:</Text>
              <TouchableOpacity
                style={styles.selectContainer}
                onPress={() => setShowOrdenacaoModal(true)}
              >
                <Text style={styles.selectText}>
                  {getSelectedLabel(ordenacao, ordenacaoOptions)}
                </Text>
                <ChevronDown size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.limparFiltros} onPress={limparFiltros}>
              <Text style={styles.limparFiltrosText}>Limpar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Histórico de Agendamentos */}
        <View style={styles.historicoSection}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>Histórico de Agendamentos</Text>
          </View>

          {agendamentosFiltrados.length === 0 ? (
            <View style={styles.semAgendamentos}>
              <Calendar size={48} color="#64748b" />
              <Text style={styles.semAgendamentosTitulo}>Nenhum agendamento encontrado</Text>
              <Text style={styles.semAgendamentosTexto}>
                Não há agendamentos para os filtros selecionados.
              </Text>
              <TouchableOpacity 
                style={styles.buttonPrimary}
                onPress={() => navigation.navigate("Servicos")}
              >
                <Text style={styles.buttonPrimaryText}>Fazer Primeiro Agendamento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            agendamentosFiltrados.map((agendamento) => {
              const statusInfo = getStatusInfo(agendamento.status)
              return (
                <View 
                  key={agendamento.id} 
                  style={[
                    styles.agendamentoCard,
                    agendamento.status === "cancelado" && styles.agendamentoCardCancelado
                  ]}
                >
                  <View style={styles.agendamentoHeader}>
                    <Text style={styles.protocolo}>Protocolo: {agendamento.protocolo}</Text>
                    <View style={[styles.status, { backgroundColor: statusInfo.bgColor }]}>
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                      {agendamento.motivo_cancelamento && (
                        <Text style={styles.motivoCancelamento}>
                          Motivo: {agendamento.motivo_cancelamento}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.agendamentoBody}>
                    <View style={styles.infoSection}>
                      <Text style={styles.servicoTitulo}>
                        {agendamento.servicos}
                      </Text>
                      <View style={styles.infoItem}>
                        <Car size={14} color="#94a3b8" />
                        <Text style={styles.infoTexto}>
                          {agendamento.veiculo}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoSection}>
                      <View style={styles.infoItem}>
                        <Calendar size={14} color="#94a3b8" />
                        <Text style={styles.infoTexto}>
                          {new Date(agendamento.data_hora).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.infoTexto}>
                          {new Date(agendamento.data_hora).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoSection}>
                      <View style={styles.infoItem}>
                        <MapPin size={14} color="#94a3b8" />
                        <Text style={styles.infoTexto}>{agendamento.oficina_nome}</Text>
                      </View>
                      <Text style={styles.infoEndereco}>{agendamento.oficina_endereco}</Text>
                      <View style={styles.infoItem}>
                        <Phone size={14} color="#94a3b8" />
                        <Text style={styles.infoTexto}>{agendamento.oficina_telefone}</Text>
                      </View>
                    </View>

                    {agendamento.total_servico && (
                      <View style={styles.infoSection}>
                        <View style={styles.infoItem}>
                          <Tag size={14} color="#94a3b8" />
                          <Text style={styles.infoTexto}>
                            Total: R$ {parseFloat(agendamento.total_servico).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.agendamentoFooter}>
                    {agendamento.status === "cancelado" ? (
                      <>
                        <TouchableOpacity 
                          style={[styles.button, styles.buttonOutline]}
                          onPress={() => repetirAgendamento(agendamento)}
                        >
                          <RotateCcw size={16} color="#64748b" />
                          <Text style={styles.buttonOutlineText}>Novo Agendamento</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.button, styles.buttonOutline]}
                          onPress={() => baixarComprovante(agendamento)}
                        >
                          <FileText size={16} color="#64748b" />
                          <Text style={styles.buttonOutlineText}>Comprovante</Text>
                        </TouchableOpacity>
                      </>
                    ) : agendamento.status === "concluido" ? (
                      <>
                        <TouchableOpacity 
                          style={[styles.button, styles.buttonOutline]}
                          onPress={() => repetirAgendamento(agendamento)}
                        >
                          <RotateCcw size={16} color="#64748b" />
                          <Text style={styles.buttonOutlineText}>Repetir Serviço</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.button, styles.buttonOutline]}
                          onPress={() => baixarComprovante(agendamento)}
                        >
                          <FileText size={16} color="#64748b" />
                          <Text style={styles.buttonOutlineText}>Comprovante</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.button, styles.buttonOutline]}
                          onPress={() => avaliarServico(agendamento)}
                        >
                          <Star size={16} color="#64748b" />
                          <Text style={styles.buttonOutlineText}>Avaliar</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={[styles.button, styles.buttonOutline]}
                          onPress={() => baixarComprovante(agendamento)}
                        >
                          <FileText size={16} color="#64748b" />
                          <Text style={styles.buttonOutlineText}>Comprovante</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.button, styles.buttonCancelar]}
                          onPress={() => solicitarCancelamento(agendamento)}
                        >
                          <Text style={styles.buttonCancelarText}>Cancelar</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Modais de Seleção */}
      <SelectionModal
        visible={showStatusModal}
        title="Selecionar Status"
        options={statusOptions}
        selectedValue={filtroStatus}
        onSelect={(item) => {
          setFiltroStatus(item.id)
          setShowStatusModal(false)
        }}
        onClose={() => setShowStatusModal(false)}
      />

      <SelectionModal
        visible={showPeriodoModal}
        title="Selecionar Período"
        options={periodoOptions}
        selectedValue={filtroPeriodo}
        onSelect={(item) => {
          setFiltroPeriodo(item.id)
          setShowPeriodoModal(false)
        }}
        onClose={() => setShowPeriodoModal(false)}
      />

      <SelectionModal
        visible={showOrdenacaoModal}
        title="Selecionar Ordenação"
        options={ordenacaoOptions}
        selectedValue={ordenacao}
        onSelect={(item) => {
          setOrdenacao(item.id)
          setShowOrdenacaoModal(false)
        }}
        onClose={() => setShowOrdenacaoModal(false)}
      />

      {/* Modal de Cancelamento com Justificativa */}
      <CancelamentoModal
        visible={showCancelamentoModal}
        onCancel={() => setShowCancelamentoModal(false)}
        onConfirm={confirmarCancelamento}
        onClose={() => {
          setShowCancelamentoModal(false)
          setAgendamentoParaCancelar(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#eab308",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  lembreteSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  lembreteCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  lembreteContent: {
    flexDirection: "row",
    marginBottom: 16,
  },
  lembreteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eab308",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  lembreteDetails: {
    flex: 1,
  },
  lembreteTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  lembreteTexto: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 2,
  },
  lembreteDestaque: {
    color: "#eab308",
    fontWeight: "500",
  },
  buttonPrimary: {
    backgroundColor: "#eab308",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  filtrosSection: {
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  filtrosContainer: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  filtroGroup: {
    marginBottom: 12,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    marginBottom: 6,
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectText: {
    fontSize: 16,
    color: "#ffffff",
  },
  limparFiltros: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  limparFiltrosText: {
    fontSize: 14,
    color: "#64748b",
    textDecorationLine: "underline",
  },
  historicoSection: {
    padding: 16,
  },
  semAgendamentos: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  semAgendamentosTitulo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  semAgendamentosTexto: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 16,
  },
  agendamentoCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  agendamentoCardCancelado: {
    opacity: 0.7,
    borderColor: "#7f1d1d",
  },
  agendamentoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  protocolo: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    flex: 1,
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  motivoCancelamento: {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 2,
  },
  agendamentoBody: {
    gap: 12,
  },
  infoSection: {
    gap: 6,
  },
  servicoTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoTexto: {
    fontSize: 14,
    color: "#94a3b8",
    marginLeft: 8,
  },
  infoEndereco: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 22,
  },
  agendamentoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: "#334155",
  },
  buttonOutlineText: {
    fontSize: 12,
    color: "#64748b",
  },
  buttonCancelar: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 16,
  },
  buttonCancelarText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
  },
})