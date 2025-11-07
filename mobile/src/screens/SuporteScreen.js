"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function SuporteScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [assunto, setAssunto] = useState("")
  const [mensagem, setMensagem] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData()
    })
    return unsubscribe
  }, [navigation])

  const loadData = async () => {
    try {
      const userJson = await AsyncStorage.getItem("oilsmart_current_user")
      if (!userJson) {
        navigation.replace("Login")
        return
      }

      const userData = JSON.parse(userJson)
      setCurrentUser(userData)

      const mensagensJson = await AsyncStorage.getItem("oilsmart_suporte")
      const todasMensagens = mensagensJson ? JSON.parse(mensagensJson) : []
      const minhasMensagens = todasMensagens.filter((m) => m.userId === userData.id)
      setMensagens(minhasMensagens)
    } catch (error) {
      navigation.replace("Login")
    }
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem("oilsmart_current_user")
    navigation.replace("Login")
  }

  const enviarMensagem = async () => {
    if (!assunto || !mensagem) {
      Alert.alert("Erro", "Preencha todos os campos")
      return
    }

    try {
      const novaMensagem = {
        id: Date.now().toString(),
        userId: currentUser.id,
        assunto,
        mensagem,
        status: "Aguardando resposta",
        criadoEm: new Date().toISOString(),
      }

      const mensagensJson = await AsyncStorage.getItem("oilsmart_suporte")
      const todasMensagens = mensagensJson ? JSON.parse(mensagensJson) : []
      todasMensagens.push(novaMensagem)
      await AsyncStorage.setItem("oilsmart_suporte", JSON.stringify(todasMensagens))

      setMensagens([novaMensagem, ...mensagens])
      setAssunto("")
      setMensagem("")

      Alert.alert("Sucesso", "Mensagem enviada com sucesso! Responderemos em breve.")
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar mensagem")
    }
  }

  if (!currentUser) return null

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
<View style={styles.headerTop}>
  <TouchableOpacity onPress={handleLogout}>
    <Text style={styles.logoutText}>Sair</Text>
  </TouchableOpacity>
</View>
        </View>
        <Text style={styles.headerTitle}>Suporte</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enviar Mensagem</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assunto</Text>
            <TextInput
              style={styles.input}
              value={assunto}
              onChangeText={setAssunto}
              placeholder="Ex: Dúvida sobre agendamento"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mensagem</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Descreva sua dúvida ou problema..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={enviarMensagem}>
            <Text style={styles.buttonText}>Enviar Mensagem</Text>
          </TouchableOpacity>
        </View>

        {/* Histórico */}
        <View style={styles.historicoContainer}>
          <Text style={styles.historicoTitle}>Histórico de Mensagens</Text>

          {mensagens.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>💬</Text>
              </View>
              <Text style={styles.emptyText}>Nenhuma mensagem enviada ainda</Text>
            </View>
          ) : (
            <View style={styles.mensagensList}>
              {mensagens.map((msg) => (
                <View key={msg.id} style={styles.mensagemCard}>
                  <View style={styles.mensagemHeader}>
                    <Text style={styles.mensagemAssunto}>{msg.assunto}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{msg.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.mensagemTexto}>{msg.mensagem}</Text>
                  <Text style={styles.mensagemData}>{new Date(msg.criadoEm).toLocaleString("pt-BR")}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    backgroundColor: "#0f172a",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: "#eab308",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "bold",
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#eab308",
  },
  logoutText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formCard: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#cbd5e1",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: "#eab308",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
  },
  historicoContainer: {
    marginBottom: 20,
  },
  historicoTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: "#1e293b",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
  },
  mensagensList: {
    gap: 12,
  },
  mensagemCard: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 16,
  },
  mensagemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  mensagemAssunto: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#eab30820",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#eab308",
    fontSize: 10,
  },
  mensagemTexto: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 8,
  },
  mensagemData: {
    color: "#64748b",
    fontSize: 12,
  },
})
