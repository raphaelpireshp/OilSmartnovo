import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native"

// Importar telas
import LoginScreen from "./src/screens/LoginScreen"
import RegisterScreen from "./src/screens/RegisterScreen"
import ServicosScreen from "./src/screens/ServicosScreen"
import AgendaScreen from "./src/screens/AgendaScreen"
import SuporteScreen from "./src/screens/SuporteScreen"

// Importar API
import api from "./src/screens/services/api.js";

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// 🔧 COMPONENTE DE DEBUG - ADICIONE ESTE CÓDIGO
const DebugPanel = ({ isVisible, onClose }) => {
  const [testStatus, setTestStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiInfo, setApiInfo] = useState('')

  const testApiConnection = async () => {
    setLoading(true)
    setTestStatus('')
    
    try {
      console.log("🧪 INICIANDO TESTE DE CONEXÃO...")
      console.log("🌐 URL sendo testada:", api.defaults.baseURL)
      
      const response = await api.get('/test')
      
      console.log("✅ TESTE BÁSICO - SUCESSO!")
      console.log("📊 Status:", response.status)
      console.log("📦 Dados:", response.data)
      
      setTestStatus('success')
      setApiInfo(`Servidor: ${response.data.message}`)
      Alert.alert("✅ CONEXÃO OK!", `Servidor respondendo!\n\nStatus: ${response.status}\nMensagem: ${response.data.message}`)
    } catch (error) {
      console.log("❌ TESTE BÁSICO - FALHA!")
      console.log("🔴 Tipo de erro:", error.name)
      console.log("📝 Mensagem:", error.message)
      
      if (error.response) {
        console.log("📡 Resposta de erro:", error.response.status, error.response.data)
        setApiInfo(`Erro ${error.response.status}: ${JSON.stringify(error.response.data)}`)
      } else if (error.request) {
        console.log("🚫 Sem resposta - Problema de rede")
        setApiInfo("Erro de rede: Não foi possível conectar ao servidor")
      } else {
        console.log("💥 Erro na configuração:", error.message)
        setApiInfo(`Erro: ${error.message}`)
      }
      
      setTestStatus('error')
      Alert.alert("❌ FALHA NA CONEXÃO", "Não foi possível conectar ao servidor. Verifique:\n\n1. Se o backend está rodando\n2. Se o Ngrok está ativo\n3. Sua conexão com internet")
    } finally {
      setLoading(false)
    }
  }

  const testOficinas = async () => {
    setLoading(true)
    
    try {
      console.log("🏢 TESTANDO OFICINAS...")
      const response = await api.get('/oficinas-completas')
      
      console.log("✅ OFICINAS - SUCESSO!")
      console.log("📊 Total de oficinas:", response.data.data?.length || 0)
      console.log("📦 Primeira oficina:", response.data.data?.[0])
      
      const count = response.data.data?.length || 0
      setTestStatus('success')
      setApiInfo(`${count} oficinas carregadas`)
      Alert.alert("✅ OFICINAS OK!", `Encontradas: ${count} oficinas\n\nAPI está funcionando perfeitamente!`)
    } catch (error) {
      console.log("❌ OFICINAS - FALHA!")
      console.log("🔴 Erro:", error.message)
      
      if (error.response) {
        setApiInfo(`Erro ${error.response.status} nas oficinas`)
      } else {
        setApiInfo("Falha ao carregar oficinas")
      }
      
      setTestStatus('error')
      Alert.alert("❌ ERRO NAS OFICINAS", "Não foi possível carregar a lista de oficinas")
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    setLoading(true)
    
    try {
      console.log("🔐 TESTANDO AUTENTICAÇÃO...")
      // Teste com dados fictícios
      const response = await api.post('/auth/login', {
        email: "teste@email.com",
        senha: "senhateste"
      })
      
      console.log("✅ AUTENTICAÇÃO - Resposta recebida")
      console.log("📊 Status:", response.status)
      
      setTestStatus('success')
      setApiInfo("Endpoint de auth respondendo")
      Alert.alert("✅ AUTH OK!", "Endpoint de login está respondendo!\n\n(Usuário não existe, mas a API funciona)")
    } catch (error) {
      console.log("🔐 AUTENTICAÇÃO - Resposta de erro (normal para usuário inexistente)")
      
      if (error.response && error.response.status === 401) {
        // 401 é esperado para usuário não encontrado
        console.log("✅ AUTH - Endpoint funcionando (erro 401 esperado)")
        setTestStatus('success')
        setApiInfo("Auth: Endpoint respondendo")
        Alert.alert("✅ AUTH OK!", "Endpoint de login está funcionando!\n\n(Erro 401 é normal para usuário de teste)")
      } else {
        console.log("❌ AUTH - Erro real:", error.message)
        setTestStatus('error')
        setApiInfo("Falha no endpoint de auth")
        Alert.alert("❌ ERRO NA AUTH", "Problema no endpoint de autenticação")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <View style={debugStyles.overlay}>
      <View style={debugStyles.panel}>
        <View style={debugStyles.header}>
          <Text style={debugStyles.title}>🔧 PAINEL DE DEBUG</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={debugStyles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={debugStyles.infoSection}>
          <Text style={debugStyles.infoText}>🌐 URL: {api.defaults.baseURL}</Text>
          <Text style={debugStyles.infoText}>📱 Status: {loading ? "Testando..." : testStatus === 'success' ? "✅ Conectado" : testStatus === 'error' ? "❌ Erro" : "Aguardando teste"}</Text>
          {apiInfo ? <Text style={debugStyles.infoText}>📊 Info: {apiInfo}</Text> : null}
        </View>

        <View style={debugStyles.buttonsContainer}>
          <TouchableOpacity 
            style={[debugStyles.button, debugStyles.buttonPrimary]}
            onPress={testApiConnection}
            disabled={loading}
          >
            <Text style={debugStyles.buttonText}>🧪 Testar Conexão</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[debugStyles.button, debugStyles.buttonSecondary]}
            onPress={testOficinas}
            disabled={loading}
          >
            <Text style={debugStyles.buttonText}>🏢 Testar Oficinas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[debugStyles.button, debugStyles.buttonTertiary]}
            onPress={testAuth}
            disabled={loading}
          >
            <Text style={debugStyles.buttonText}>🔐 Testar Auth</Text>
          </TouchableOpacity>
        </View>

        <View style={debugStyles.instructions}>
          <Text style={debugStyles.instructionsTitle}>📋 OBSERVE O TERMINAL:</Text>
          <Text style={debugStyles.instructionsText}>• Abra o terminal onde roda "npx expo start"</Text>
          <Text style={debugStyles.instructionsText}>• Veja os logs coloridos que aparecem</Text>
          <Text style={debugStyles.instructionsText}>• Procure por ✅ SUCESSO ou ❌ ERRO</Text>
        </View>
      </View>
    </View>
  )
}

const debugStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#334155',
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
  },
  title: {
    color: '#eab308',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    color: '#e2e8f0',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  buttonsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#10b981',
  },
  buttonTertiary: {
    backgroundColor: '#f59e0b',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
  },
  instructionsTitle: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
  },
})

// Navegação por abas (após login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#334155",
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: "#eab308",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Servicos"
        component={ServicosScreen}
        options={{
          tabBarLabel: "Serviços",
          tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Suporte"
        component={SuporteScreen}
        options={{
          tabBarLabel: "Suporte",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}

// Tela de Login com botão de debug
function LoginWithDebug({ navigation }) {
  const [showDebug, setShowDebug] = useState(false)

  // Abrir debug quando a tela carregar (opcional)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🚀 APP INICIADO - Pronto para testes!")
      console.log("🌐 URL da API:", api.defaults.baseURL)
      console.log("💡 Dica: Toque 3 vezes rápido para abrir o debug")
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <LoginScreen navigation={navigation} />
      
      {/* Botão flutuante para abrir debug */}
      <TouchableOpacity 
        style={floatingButtonStyles.button}
        onPress={() => setShowDebug(true)}
        onLongPress={() => {
          console.log("🔧 DEBUG MANUAL - Verificando configuração...")
          console.log("📡 URL:", api.defaults.baseURL)
          console.log("🕒 Hora:", new Date().toLocaleTimeString())
        }}
      >
        <Text style={floatingButtonStyles.text}>🔧</Text>
      </TouchableOpacity>

      <DebugPanel isVisible={showDebug} onClose={() => setShowDebug(false)} />
    </View>
  )
}

const floatingButtonStyles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#eab308',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
})

// Navegação principal
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      >
        <Stack.Screen name="Login" component={LoginWithDebug} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}