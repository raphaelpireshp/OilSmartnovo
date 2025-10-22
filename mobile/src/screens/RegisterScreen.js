"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import api from "./services/api.js";


export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
        Alert.alert("Erro", "Preencha todos os campos");
        return;
    }

    if (senha !== confirmarSenha) {
        Alert.alert("Erro", "As senhas não coincidem");
        return;
    }

    if (senha.length < 6) {
        Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
        return;
    }

    try {
        console.log("📝 Tentando registrar usuário...");
        
        // Chamada REAL para a API
        const response = await api.post("/auth/register", {
            nome: nome,
            email: email,
            senha: senha
        });

        if (response.data.success) {
            console.log("✅ Usuário registrado com sucesso!");
            
            Alert.alert("Sucesso", "Conta criada com sucesso!", [
                { 
                    text: "OK", 
                    onPress: () => navigation.goBack() 
                }
            ]);
        } else {
            Alert.alert("Erro", response.data.message || "Falha ao criar conta");
        }
    } catch (error) {
        console.error("❌ Erro no registro:", error);
        
        if (error.response) {
            Alert.alert("Erro", error.response.data.message || "Falha ao criar conta");
        } else if (error.request) {
            Alert.alert("Erro", "Não foi possível conectar ao servidor. Verifique sua internet.");
        } else {
            Alert.alert("Erro", "Falha ao criar conta");
        }
    }
};

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar Conta</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>Preencha seus dados para criar sua conta</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome completo"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput
                style={styles.input}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Criar Conta</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eab30820",
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: "#eab308",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#cbd5e1",
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
  },
  button: {
    backgroundColor: "#eab308",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
  },
})
