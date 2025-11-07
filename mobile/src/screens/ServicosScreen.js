import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MapView, { Marker } from "react-native-maps"
import * as Location from 'expo-location'
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Phone,
  ChevronDown,
  Check,
  X,
  Search,
  Navigation,
  Droplet,
  Filter,
  User,
  Mail
} from "lucide-react-native"
import api from "./services/api";

const { width, height } = Dimensions.get("window")

// Função auxiliar para garantir números
const ensureNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
};

// Componente de Loading
const LoadingOverlay = ({ visible, message = "Buscando..." }) => {
  if (!visible) return null
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
<View style={styles.headerTop}>
  <Text style={styles.headerTitle}>Agendar Serviço</Text>
</View>
    </Modal>
  )
}

const loadingStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: "#1e293b",
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  message: {
    color: "#e2e8f0",
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
})

// Função para calcular distância
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distancia = R * c
  return distancia
}

const deg2rad = (deg) => {
  return deg * (Math.PI / 180)
}

// Componente de Calendário
const CalendarModal = ({ visible, onSelect, onClose, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selected, setSelected] = useState(selectedDate)
  
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]
  
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
  
    const daysInMonth = []
    const startingDay = firstDay.getDay()
  
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      daysInMonth.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isDisabled: true
      })
    }
  
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
    
      daysInMonth.push({
        date: currentDate,
        isCurrentMonth: true,
        isDisabled: currentDate < today,
        isToday: currentDate.toDateString() === today.toDateString()
      })
    }
  
    return daysInMonth
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const handleDateSelect = (day) => {
    if (!day.isDisabled && day.isCurrentMonth) {
      setSelected(formatDate(day.date))
      onSelect(formatDate(day.date))
    }
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={calendarStyles.container}>
        <View style={calendarStyles.header}>
          <Text style={calendarStyles.title}>Selecione a Data</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={calendarStyles.monthSelector}>
          <TouchableOpacity onPress={prevMonth}>
            <Text style={calendarStyles.monthButton}>‹</Text>
          </TouchableOpacity>
        
          <Text style={calendarStyles.monthText}>
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
        
          <TouchableOpacity onPress={nextMonth}>
            <Text style={calendarStyles.monthButton}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={calendarStyles.weekDays}>
          {days.map(day => (
            <Text key={day} style={calendarStyles.weekDayText}>{day}</Text>
          ))}
        </View>
        
        <View style={calendarStyles.daysGrid}>
          {daysInMonth.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                calendarStyles.day,
                !day.isCurrentMonth && calendarStyles.otherMonthDay,
                day.isDisabled && calendarStyles.disabledDay,
                selected === formatDate(day.date) && calendarStyles.selectedDay,
                day.isToday && calendarStyles.today
              ]}
              onPress={() => handleDateSelect(day)}
              disabled={day.isDisabled}
            >
              <Text style={[
                calendarStyles.dayText,
                !day.isCurrentMonth && calendarStyles.otherMonthDayText,
                day.isDisabled && calendarStyles.disabledDayText,
                selected === formatDate(day.date) && calendarStyles.selectedDayText,
                day.isToday && calendarStyles.todayText
              ]}>
                {day.date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={calendarStyles.confirmButton}
          onPress={onClose}
        >
          <Text style={calendarStyles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// Componente de Horários
const TimeSlotsModal = ({ visible, onSelect, onClose, selectedTime, selectedDate, workshop }) => {
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && selectedDate && workshop) {
      loadHorariosDisponiveis()
    }
  }, [visible, selectedDate, workshop])

  const loadHorariosDisponiveis = async () => {
    if (!workshop || !selectedDate) return
  
    setLoading(true)
    try {
      console.log("🕒 Buscando horários disponíveis...")
      const response = await api.get(`/agendamento_simples/oficina/${workshop.id}/data/${selectedDate}`)
    
      if (response.data.success) {
        const horariosOcupados = response.data.data || []
        const slotsDisponiveis = generateTimeSlots(horariosOcupados)
        setTimeSlots(slotsDisponiveis)
        console.log(`✅ ${slotsDisponiveis.length} horários disponíveis carregados`)
      }
    } catch (error) {
      console.error("❌ Erro ao carregar horários:", error)
      // Fallback para slots padrão
      const slotsDisponiveis = generateTimeSlots([])
      setTimeSlots(slotsDisponiveis)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = (horariosOcupados) => {
    if (!workshop) return []
  
    const startTime = workshop.horario_abertura || "08:00"
    const endTime = workshop.horario_fechamento || "18:00"
    const interval = 60 // 1 hora entre agendamentos
    const slots = []
  
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)
  
    let currentHour = startHour
    let currentMinute = startMinute
  
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    
      // Verificar se o horário está ocupado
      const isOcupado = horariosOcupados.includes(time)
    
      // Verificar se é um horário válido (não passado)
      const now = new Date()
      const isToday = selectedDate === now.toISOString().split('T')[0]
    
      let isAvailable = !isOcupado
    
      if (isToday) {
        const [hours, minutes] = time.split(':').map(Number)
        const slotTime = new Date()
        slotTime.setHours(hours, minutes, 0, 0)
        isAvailable = isAvailable && slotTime > now
      }
    
      if (isAvailable) {
        slots.push(time)
      }
    
      currentMinute += interval
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60)
        currentMinute = currentMinute % 60
      }
    }
  
    return slots
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={timeSlotsStyles.container}>
        <View style={timeSlotsStyles.header}>
          <Text style={timeSlotsStyles.title}>Selecione o Horário</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <Text style={timeSlotsStyles.subtitle}>
          Horários disponíveis para {selectedDate}
        </Text>
      
        {loading ? (
          <View style={timeSlotsStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#eab308" />
            <Text style={timeSlotsStyles.loadingText}>Carregando horários...</Text>
          </View>
        ) : (
          <FlatList
            data={timeSlots}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  timeSlotsStyles.timeSlot,
                  selectedTime === item && timeSlotsStyles.timeSlotSelected
                ]}
                onPress={() => onSelect(item)}
              >
                <Text style={[
                  timeSlotsStyles.timeText,
                  selectedTime === item && timeSlotsStyles.timeTextSelected
                ]}>
                  {item}
                </Text>
                {selectedTime === item && <Check size={20} color="#0f172a" />}
              </TouchableOpacity>
            )}
            contentContainerStyle={timeSlotsStyles.list}
          />
        )}
      
        {timeSlots.length === 0 && !loading && (
          <View style={timeSlotsStyles.empty}>
            <Text style={timeSlotsStyles.emptyText}>
              Nenhum horário disponível para esta data
            </Text>
          </View>
        )}
      </View>
    </Modal>
  )
}

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
        {item.label || item.nome || item.ano || item}
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

// Componente de Card de Produto
const ProductCard = ({ product, type, selected, onToggle }) => {
  const isOil = type === 'oil'
  
  return (
    <TouchableOpacity
      style={[
        productCardStyles.card,
        selected && productCardStyles.cardSelected
      ]}
      onPress={() => onToggle(type)}
    >
      <View style={productCardStyles.iconContainer}>
        {isOil ? (
          <Droplet size={24} color={selected ? "#0f172a" : "#eab308"} />
        ) : (
          <Filter size={24} color={selected ? "#0f172a" : "#eab308"} />
        )}
      </View>
      
      <View style={productCardStyles.content}>
        <Text style={[
          productCardStyles.nome,
          selected && productCardStyles.nomeSelected
        ]}>
          {product?.nome || `Recomendação de ${isOil ? 'Óleo' : 'Filtro'}`}
        </Text>
     
        {product && (
          <View style={productCardStyles.specs}>
            {product.tipo && (
              <Text style={[
                productCardStyles.specText,
                selected && productCardStyles.specTextSelected
              ]}>
                Tipo: {product.tipo}
              </Text>
            )}
            {product.viscosidade && (
              <Text style={[
                productCardStyles.specText,
                selected && productCardStyles.specTextSelected
              ]}>
                Viscosidade: {product.viscosidade}
              </Text>
            )}
            {product.marca && (
              <Text style={[
                productCardStyles.specText,
                selected && productCardStyles.specTextSelected
              ]}>
                Marca: {product.marca}
              </Text>
            )}
          </View>
        )}
     
        {typeof product?.preco === 'number' && !isNaN(product.preco) && (
          <Text style={[
            productCardStyles.preco,
            selected && productCardStyles.precoSelected
          ]}>
            R$ {product.preco.toFixed(2)}
          </Text>
        )}
      </View>
   
      <View style={productCardStyles.checkboxContainer}>
        <View style={[
          productCardStyles.checkbox,
          selected && productCardStyles.checkboxSelected
        ]}>
          {selected && <Check size={16} color="#0f172a" />}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// Componente de Card de Oficina
const WorkshopCard = ({ workshop, selected, onSelect, distance, userLocation }) => {
  const getDistanceColor = (dist) => {
    if (dist < 2) return '#2a9d8f'
    if (dist < 5) return '#3a86ff'
    if (dist < 10) return '#f4a261'
    return '#e63946'
  }

  const distanciaFormatada = distance < 1
    ? `${(distance * 1000).toFixed(0)} m`
    : `${distance.toFixed(1)} km`
  
  return (
    <TouchableOpacity
      style={[
        workshopCardStyles.card,
        selected && workshopCardStyles.cardSelected,
        !userLocation && workshopCardStyles.cardDisabled
      ]}
      onPress={() => {
        if (!userLocation) return;
        onSelect(workshop);
      }}
      disabled={!userLocation}
    >
      <View style={workshopCardStyles.header}>
        <Text style={workshopCardStyles.nome}>{workshop.nome}</Text>
        <View style={[
          workshopCardStyles.distanceBadge,
          { backgroundColor: getDistanceColor(distance) }
        ]}>
          <Text style={workshopCardStyles.distanceText}>{distanciaFormatada}</Text>
        </View>
      </View>
   
      <View style={workshopCardStyles.infoRow}>
        <MapPin size={16} color="#94a3b8" />
        <Text style={workshopCardStyles.infoText}>
          {workshop.endereco}, {workshop.cidade}/{workshop.estado}
        </Text>
      </View>
   
      <View style={workshopCardStyles.infoRow}>
        <Phone size={16} color="#94a3b8" />
        <Text style={workshopCardStyles.infoText}>
          {workshop.telefone || 'Não informado'}
        </Text>
      </View>
   
      <View style={workshopCardStyles.infoRow}>
        <Clock size={16} color="#94a3b8" />
        <Text style={workshopCardStyles.infoText}>
          {workshop.horario_abertura?.substring(0, 5) || '08:00'} - {workshop.horario_fechamento?.substring(0, 5) || '18:00'}
        </Text>
      </View>
   
      {selected && (
        <View style={workshopCardStyles.selectedIndicator}>
          <Check size={20} color="#0f172a" />
          <Text style={workshopCardStyles.selectedText}>Selecionada</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default function ServicosScreen({ navigation, route }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState({ oil: true, filter: true })
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedWorkshop, setSelectedWorkshop] = useState(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [userLocation, setUserLocation] = useState(null)
  const [mapRegion, setMapRegion] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [workshopsWithDistance, setWorkshopsWithDistance] = useState([])
  const [customerName, setCustomerName] = useState("")
  const [customerCPF, setCustomerCPF] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [vehicleMileage, setVehicleMileage] = useState("")
  
  // Estados para seleção de veículo
  const [showBrandsModal, setShowBrandsModal] = useState(false)
  const [showModelsModal, setShowModelsModal] = useState(false)
  const [showYearsModal, setShowYearsModal] = useState(false)
  const [showWorkshopsModal, setShowWorkshopsModal] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  
  // Dados da API
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [years, setYears] = useState([])
  const [products, setProducts] = useState({ oil: null, filter: null })

  // Carregar dados iniciais
  useEffect(() => {
    loadUser()
    loadBrands()
    loadOficinasReais()
  }, [])

  // Atualizar região do mapa quando userLocation mudar
  useEffect(() => {
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: userLocation.latitudeDelta || 0.0922,
        longitudeDelta: userLocation.longitudeDelta || 0.0421,
      })
    }
  }, [userLocation])

  // Carregar modelos quando marca for selecionada
  useEffect(() => {
    if (selectedVehicle?.marca_id) {
      loadModels(selectedVehicle.marca_id)
    }
  }, [selectedVehicle?.marca_id])

  // Carregar anos quando modelo for selecionado
  useEffect(() => {
    if (selectedVehicle?.modelo_id) {
      loadYears(selectedVehicle.modelo_id)
    }
  }, [selectedVehicle?.modelo_id])

  // Carregar produtos quando oficina for selecionada
  useEffect(() => {
    if (selectedWorkshop) {
      loadProducts(selectedWorkshop.id)
    }
  }, [selectedWorkshop])

  // Carregar usuário
  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem("oilsmart_current_user")
      if (!userJson) {
        navigation.replace("Login")
      } else {
        const user = JSON.parse(userJson)
        setCurrentUser(user)
        setCustomerName(user.nome || "")
        setCustomerEmail(user.email || "")
      }
    } catch (error) {
      navigation.replace("Login")
    }
  }

  // ETAPA 1: Carregar marcas da API
  const loadBrands = async () => {
    try {
      console.log("🚗 Buscando marcas da API...")
      const response = await api.get("/marcas")
      setBrands(response.data)
      console.log(`✅ ${response.data.length} marcas carregadas`)
    } catch (error) {
      console.error("❌ Erro ao carregar marcas:", error)
      Alert.alert("Erro", "Não foi possível carregar as marcas de veículos")
    }
  }

  // ETAPA 1: Carregar modelos da API
  const loadModels = async (marcaId) => {
    try {
      console.log(`🚗 Buscando modelos para marca ${marcaId}...`)
      const response = await api.get(`/modelos?marca_id=${marcaId}`)
      setModels(response.data)
      console.log(`✅ ${response.data.length} modelos carregados`)
    } catch (error) {
      console.error("❌ Erro ao carregar modelos:", error)
      Alert.alert("Erro", "Não foi possível carregar os modelos")
    }
  }

  // ETAPA 1: Carregar anos da API
  const loadYears = async (modeloId) => {
    try {
      console.log(`🚗 Buscando anos para modelo ${modeloId}...`)
      const response = await api.get(`/modelo_anos?modelo_id=${modeloId}`)
      setYears(response.data)
      console.log(`✅ ${response.data.length} anos carregados`)
    } catch (error) {
      console.error("❌ Erro ao carregar anos:", error)
      Alert.alert("Erro", "Não foi possível carregar os anos")
    }
  }

  // ETAPA 2: Carregar oficinas da API - CORRIGIDO
  const loadOficinasReais = async () => {
    try {
      console.log("🏢 Buscando oficinas da API...")
      const response = await api.get("/oficinas-completas") // ROTA CORRIGIDA
    
      if (response.data.success) {
        console.log(`✅ ${response.data.data.length} oficinas carregadas`)
      
        // Se temos localização do usuário, calcular distâncias
        if (userLocation) {
          const workshopsWithDist = response.data.data.map(workshop => {
            const distance = calcularDistancia(
              userLocation.latitude,
              userLocation.longitude,
              ensureNumber(workshop.lat) || -23.5505,
              ensureNumber(workshop.lng) || -46.6333
            )
          
            return {
              ...workshop,
              coordenadas: {
                latitude: ensureNumber(workshop.lat) || -23.5505,
                longitude: ensureNumber(workshop.lng) || -46.6333
              },
              distancia: distance
            }
          }).sort((a, b) => a.distancia - b.distancia)
        
          setWorkshopsWithDistance(workshopsWithDist)
        } else {
          // Se não tem localização, só carrega as oficinas sem distância
          const workshopsWithCoords = response.data.data.map(workshop => ({
            ...workshop,
            coordenadas: {
              latitude: ensureNumber(workshop.lat) || -23.5505,
              longitude: ensureNumber(workshop.lng) || -46.6333
            }
          }))
          setWorkshopsWithDistance(workshopsWithCoords)
        }
      }
    } catch (error) {
      console.error("❌ Erro ao carregar oficinas:", error)
      Alert.alert("Erro", "Não foi possível carregar as oficinas")
    }
  }

  // ETAPA 3: Carregar produtos da oficina
  const loadProducts = async (oficinaId) => {
    try {
      console.log(`🛢️ Buscando produtos da oficina ${oficinaId}...`)
      // Aqui você pode implementar a busca real de produtos da oficina
      // Por enquanto, usaremos dados mockados
      const oilProduct = {
        id: 1,
        nome: "Óleo Sintético 5W-30 Premium",
        tipo: "Sintético",
        viscosidade: "5W-30",
        marca: "Motul",
        preco: 120.00
      }
    
      const filterProduct = {
        id: 2,
        nome: "Filtro de Óleo Original",
        tipo: "Filtro de Óleo",
        marca: "Fabricante Original",
        preco: 45.00
      }
    
      setProducts({ oil: oilProduct, filter: filterProduct })
      console.log("✅ Produtos carregados")
    } catch (error) {
      console.error("❌ Erro ao carregar produtos:", error)
      // Fallback para produtos padrão
      const oilProduct = {
        id: 1,
        nome: "Óleo Recomendado",
        tipo: "Sintético",
        viscosidade: "5W-30",
        preco: 100.00
      }
    
      const filterProduct = {
        id: 2,
        nome: "Filtro de Óleo",
        tipo: "Filtro",
        preco: 35.00
      }
    
      setProducts({ oil: oilProduct, filter: filterProduct })
    }
  }

  // Buscar endereço por texto
  const searchAddress = async (query) => {
    if (query.length < 3) return
  
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'OilSmartApp/1.0'
          }
        }
      )
    
      if (!response.ok) throw new Error(`Erro na API: ${response.status}`)
    
      const data = await response.json()
      const validSuggestions = data.filter(item => item.lat && item.lon)
    
      if (validSuggestions.length > 0) {
        const address = validSuggestions[0]
        handleAddressSelect(address)
      }
    } catch (error) {
      console.error("Erro ao buscar endereços:", error)
      Alert.alert("Erro", "Não foi possível buscar endereços. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressSelect = async (address) => {
    setIsLoading(true)
    setSearchQuery(address.display_name)
 
    try {
      const newLocation = {
        latitude: parseFloat(address.lat),
        longitude: parseFloat(address.lon),
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
   
      setUserLocation(newLocation)
   
      const workshopsWithDist = workshopsWithDistance.map(workshop => {
        const distance = calcularDistancia(
          newLocation.latitude,
          newLocation.longitude,
          ensureNumber(workshop.coordenadas.latitude),
          ensureNumber(workshop.coordenadas.longitude)
        )
     
        return {
          ...workshop,
          distancia: distance
        }
      }).sort((a, b) => a.distancia - b.distancia)
   
      setWorkshopsWithDistance(workshopsWithDist)
   
      Alert.alert("Sucesso", `Localização definida: ${address.display_name.split(',')[0]}`)
    } catch (error) {
      console.error("Erro ao processar localização:", error)
      Alert.alert("Erro", "Não foi possível processar o endereço selecionado")
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = async () => {
    setIsLoading(true)
    try {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para encontrar oficinas próximas.')
        return
      }
    
      let location = await Location.getCurrentPositionAsync({})
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
   
      setUserLocation(newLocation)
      setSearchQuery("Sua localização atual")
   
      const workshopsWithDist = workshopsWithDistance.map(workshop => {
        const distance = calcularDistancia(
          newLocation.latitude,
          newLocation.longitude,
          ensureNumber(workshop.coordenadas.latitude),
          ensureNumber(workshop.coordenadas.longitude)
        )
     
        return {
          ...workshop,
          distancia: distance
        }
      }).sort((a, b) => a.distancia - b.distancia)
   
      setWorkshopsWithDistance(workshopsWithDist)
   
      Alert.alert("Sucesso", "Localização obtida com sucesso!")
    } catch (error) {
      Alert.alert("Erro", "Não foi possível obter sua localização")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProduct = (type) => {
    setSelectedProducts(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const calculateTotal = () => {
    let total = 0
    if (selectedProducts.oil && products.oil) {
      total += products.oil.preco
    }
    if (selectedProducts.filter && products.filter) {
      total += products.filter.preco
    }
    return total
  }

  const getVehicleYearText = () => {
    if (!selectedVehicle?.ano) return ""
 
    if (typeof selectedVehicle.ano === 'string') {
      return selectedVehicle.ano
    } else if (selectedVehicle.ano && typeof selectedVehicle.ano === 'object') {
      return selectedVehicle.ano.ano || ""
    }
 
    return String(selectedVehicle.ano)
  }

  // Validações das etapas
  const validateStep1 = () => {
    if (!selectedVehicle) {
      Alert.alert("Atenção", "Selecione um veículo")
      return false
    }
    if (!selectedWorkshop) {
      Alert.alert("Atenção", "Selecione uma oficina")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!selectedProducts.oil && !selectedProducts.filter) {
      Alert.alert("Atenção", "Selecione pelo menos um produto")
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Atenção", "Selecione data e horário")
      return false
    }
    if (!customerName || !customerPhone || !customerEmail) {
      Alert.alert("Atenção", "Preencha todos os dados pessoais")
      return false
    }
    return true
  }

  const goToStep = (step) => {
    if (step > currentStep) {
      if (step === 2 && !validateStep1()) return
      if (step === 3 && !validateStep2()) return
      if (step === 4 && !validateStep3()) return
    }
    setCurrentStep(step)
  }

  // ETAPA 5: Confirmar agendamento e enviar para API
  const confirmAppointment = async () => {
    try {
      setIsLoading(true)
    
      // Preparar dados para a API
      const dataHora = `${selectedDate} ${selectedTime}:00`
      const servicosArray = []
    
      if (selectedProducts.oil && products.oil) {
        servicosArray.push(products.oil.nome)
      }
      if (selectedProducts.filter && products.filter) {
        servicosArray.push(products.filter.nome)
      }
    
      const agendamentoData = {
        data_hora: dataHora,
        oficina_nome: selectedWorkshop.nome,
        oficina_endereco: `${selectedWorkshop.endereco}, ${selectedWorkshop.cidade}/${selectedWorkshop.estado}`,
        oficina_telefone: selectedWorkshop.telefone,
        oficina_id: selectedWorkshop.id,
        veiculo: `${selectedVehicle.marca} ${selectedVehicle.modelo} ${getVehicleYearText()}`,
        servicos: servicosArray.join(" + "),
        total_servico: calculateTotal(),
        cliente_nome: customerName,
        cliente_cpf: customerCPF || "00000000000",
        cliente_telefone: customerPhone,
        cliente_email: customerEmail,
        usuario_id: currentUser.id
      }

      console.log("📤 Enviando agendamento para API...", agendamentoData)
      
      // Enviar para API
      const response = await api.post("/agendamento_simples", agendamentoData)
    
      if (response.data.success) {
        console.log("✅ Agendamento criado com sucesso!", response.data)
      
        Alert.alert(
          "Agendamento Confirmado!",
          `Protocolo: ${response.data.codigo_confirmacao}\nTotal: R$ ${calculateTotal().toFixed(2)}`,
          [
            {
              text: "OK",
              onPress: () => {
                // Resetar estado
                setCurrentStep(1)
                setSelectedProducts({ oil: true, filter: true })
                setSelectedWorkshop(null)
                setSelectedDate("")
                setSelectedTime("")
                setCustomerCPF("")
                setCustomerPhone("")
                setVehicleMileage("")
                setSelectedVehicle(null)
              
                // Navegar para home
                navigation.navigate("Servicos")
              }
            }
          ]
        )
      } else {
        throw new Error(response.data.message || "Erro ao criar agendamento")
      }
    } catch (error) {
      console.error("❌ Erro ao confirmar agendamento:", error)
      Alert.alert(
        "Erro",
        error.response?.data?.message || error.message || "Não foi possível confirmar o agendamento. Tente novamente."
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Renderização com layout do código 2
  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>

          <Text style={styles.headerTitle}>Agendar Serviço</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <View style={[
                  styles.progressStep,
                  currentStep >= step && styles.progressStepActive
                ]}>
                  <Text style={[
                    styles.progressStepText,
                    currentStep >= step && styles.progressStepTextActive
                  ]}>
                    {step}
                  </Text>
                </View>
                {step < 4 && (
                  <View style={[
                    styles.progressLine,
                    currentStep > step && styles.progressLineActive
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>
          
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Veículo</Text>
            <Text style={styles.progressLabel}>Oficina</Text>
            <Text style={styles.progressLabel}>Produtos</Text>
            <Text style={styles.progressLabel}>Agendamento</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              <Text style={styles.stepNumber}>1</Text> Dados do Veículo e Oficina
            </Text>
            <Text style={styles.stepSubtitle}>Encontre a oficina perfeita para seu veículo</Text>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Marca</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowBrandsModal(true)}
                >
                  <Text style={selectedVehicle?.marca ? styles.selectText : styles.selectPlaceholder}>
                    {selectedVehicle?.marca || "Selecione a marca"}
                  </Text>
                  <ChevronDown size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Modelo</Text>
                <TouchableOpacity
                  style={[
                    styles.selectContainer,
                    !selectedVehicle?.marca_id && styles.disabledSelect
                  ]}
                  onPress={() => setShowModelsModal(true)}
                  disabled={!selectedVehicle?.marca_id}
                >
                  <Text style={[
                    selectedVehicle?.modelo ? styles.selectText : styles.selectPlaceholder,
                    !selectedVehicle?.marca_id && styles.disabledText
                  ]}>
                    {selectedVehicle?.modelo || "Selecione o modelo"}
                  </Text>
                  <ChevronDown size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ano</Text>
                <TouchableOpacity
                  style={[
                    styles.selectContainer,
                    !selectedVehicle?.modelo_id && styles.disabledSelect
                  ]}
                  onPress={() => setShowYearsModal(true)}
                  disabled={!selectedVehicle?.modelo_id}
                >
                  <Text style={[
                    getVehicleYearText() ? styles.selectText : styles.selectPlaceholder,
                    !selectedVehicle?.modelo_id && styles.disabledText
                  ]}>
                    {getVehicleYearText() || "Selecione o ano"}
                  </Text>
                  <ChevronDown size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quilometragem (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={vehicleMileage}
                  onChangeText={setVehicleMileage}
                  placeholder="Ex: 50000"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Informe a quilometragem atual do veículo, se souber.
                </Text>
              </View>

              <View style={styles.locationSection}>
                <Text style={styles.label}>Localização para busca de oficinas</Text>
              
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Digite seu endereço..."
                    placeholderTextColor="#64748b"
                  />
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => searchAddress(searchQuery)}
                  >
                    <Search size={20} color="#0f172a" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.locationOr}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>ou</Text>
                  <View style={styles.orLine} />
                </View>
                
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                >
                  <Navigation size={20} color="#eab308" />
                  <Text style={styles.locationButtonText}>Usar minha localização</Text>
                </TouchableOpacity>
              </View>

              {userLocation && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    region={userLocation}
                    showsUserLocation={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: ensureNumber(userLocation.latitude),
                        longitude: ensureNumber(userLocation.longitude)
                      }}
                      title={`Seu endereço: ${searchQuery.split(',')[0]}`}
                      description={searchQuery.split(',').slice(1).join(',').trim()}
                      pinColor="red"
                    />
                    {workshopsWithDistance.map(workshop => (
                      <Marker
                        key={workshop.id}
                        coordinate={{
                          latitude: ensureNumber(workshop.coordenadas.latitude),
                          longitude: ensureNumber(workshop.coordenadas.longitude)
                        }}
                        title={workshop.nome}
                        description={`${workshop.distancia?.toFixed(1)} km`}
                        pinColor="blue"
                        onPress={() => setSelectedWorkshop(workshop)}
                      />
                    ))}
                  </MapView>
                
                  <TouchableOpacity
                    style={styles.mapFullButton}
                    onPress={() => setShowMapModal(true)}
                  >
                    <MapPin size={20} color="#eab308" />
                    <Text style={styles.mapFullButtonText}>Ver mapa completo</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.workshopSection}>
                <Text style={styles.sectionTitle}>Selecionar Oficina</Text>
               
                <TouchableOpacity
                  style={[
                    styles.selectContainer,
                    !userLocation && styles.disabledSelect
                  ]}
                  onPress={() => {
                    if (!userLocation) {
                      Alert.alert("Atenção", "Defina sua localização primeiro para buscar oficinas próximas!");
                      return;
                    }
                    setShowWorkshopsModal(true);
                  }}
                  disabled={!userLocation}
                >
                  <Text style={[
                    selectedWorkshop ? styles.selectText : styles.selectPlaceholder,
                    !userLocation && styles.disabledText
                  ]}>
                    {userLocation
                      ? (selectedWorkshop ? selectedWorkshop.nome : "Selecione uma oficina")
                      : "Defina sua localização primeiro"
                    }
                  </Text>
                  <ChevronDown
                    size={20}
                    color={!userLocation ? "#475569" : "#64748b"}
                  />
                </TouchableOpacity>
               
                {selectedWorkshop && (
                  <WorkshopCard
                    workshop={selectedWorkshop}
                    selected={true}
                    onSelect={setSelectedWorkshop}
                    distance={selectedWorkshop.distancia}
                    userLocation={userLocation}
                  />
                )}
               
                {userLocation && workshopsWithDistance.length > 0 && (
                  <View style={styles.nearbyWorkshops}>
                    <Text style={styles.nearbyTitle}>Oficinas Próximas</Text>
                    <FlatList
                      data={workshopsWithDistance.slice(0, 3)}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <WorkshopCard
                          workshop={item}
                          selected={selectedWorkshop?.id === item.id}
                          onSelect={setSelectedWorkshop}
                          distance={item.distancia}
                          userLocation={userLocation}
                        />
                      )}
                      scrollEnabled={false}
                    />
                  </View>
                )}
               
                {!userLocation && (
                  <Text style={[styles.helperText, { textAlign: "center", marginTop: 8 }]}>
                    Defina sua localização via GPS ou endereço para ver as opções de oficinas próximas.
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              <Text style={styles.stepNumber}>2</Text> Produtos Recomendados
            </Text>
            <Text style={styles.stepSubtitle}>Selecione os produtos que deseja incluir no serviço</Text>
            
            <View style={styles.recommendationContainer}>
              <ProductCard
                product={products.oil}
                type="oil"
                selected={selectedProducts.oil}
                onToggle={toggleProduct}
              />
            
              <ProductCard
                product={products.filter}
                type="filter"
                selected={selectedProducts.filter}
                onToggle={toggleProduct}
              />
            </View>
            
            <View style={styles.selectionSummary}>
              <Text style={styles.summaryTitle}>Resumo da Seleção</Text>
              <Text style={styles.summaryItems}>
                {[
                  selectedProducts.oil && "Óleo",
                  selectedProducts.filter && "Filtro"
                ].filter(Boolean).join(" + ") || "Nenhum produto selecionado"}
              </Text>
              <Text style={styles.summaryTotal}>
                Total: R$ {calculateTotal().toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              <Text style={styles.stepNumber}>3</Text> Agendamento
            </Text>
            
            {selectedWorkshop && (
              <View style={styles.workshopSummary}>
                <Text style={styles.summaryTitle}>Oficina Selecionada</Text>
                <View style={styles.selectedWorkshopCard}>
                  <Text style={styles.workshopName}>{selectedWorkshop.nome}</Text>
                  <View style={styles.workshopInfoRow}>
                    <MapPin size={16} color="#94a3b8" />
                    <Text style={styles.workshopInfoText}>
                      {selectedWorkshop.endereco}, {selectedWorkshop.cidade}/{selectedWorkshop.estado}
                    </Text>
                  </View>
                  <View style={styles.workshopInfoRow}>
                    <Phone size={16} color="#94a3b8" />
                    <Text style={styles.workshopInfoText}>{selectedWorkshop.telefone}</Text>
                  </View>
                  <View style={styles.workshopInfoRow}>
                    <MapPin size={16} color="#94a3b8" />
                    <Text style={styles.workshopInfoText}>
                      {selectedWorkshop.distancia < 1
                        ? `${(selectedWorkshop.distancia * 1000).toFixed(0)} metros de distância`
                        : `${selectedWorkshop.distancia.toFixed(1)} km de distância`
                      }
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.schedulingForm}>
              <View style={styles.formRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Data</Text>
                  <TouchableOpacity
                    style={styles.selectContainer}
                    onPress={() => setShowDateModal(true)}
                  >
                    <Text style={selectedDate ? styles.selectText : styles.selectPlaceholder}>
                      {selectedDate || "Selecione uma data"}
                    </Text>
                    <Calendar size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Horário</Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      !selectedDate && styles.disabledSelect
                    ]}
                    onPress={() => setShowTimeModal(true)}
                    disabled={!selectedDate}
                  >
                    <Text style={[
                      selectedTime ? styles.selectText : styles.selectPlaceholder,
                      !selectedDate && styles.disabledText
                    ]}>
                      {selectedTime || "Selecione"}
                    </Text>
                    <Clock size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.personalData}>
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
              
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome Completo</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Seu nome completo"
                    placeholderTextColor="#64748b"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CPF (opcional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customerCPF}
                    onChangeText={setCustomerCPF}
                    placeholder="000.000.000-00"
                    placeholderTextColor="#64748b"
                    maxLength={14}
                  />
                </View>
                
                <View style={styles.formRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Telefone</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#64748b"
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customerEmail}
                      onChangeText={setCustomerEmail}
                      placeholder="seu@email.com"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              <Text style={styles.stepNumber}>4</Text> Confirmação
            </Text>
            <Text style={styles.stepSubtitle}>Revise e confirme seu agendamento</Text>
            
            <View style={styles.confirmationSummary}>
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>🚗 Veículo</Text>
                <Text style={styles.summaryText}>
                  {selectedVehicle?.marca} {selectedVehicle?.modelo} {getVehicleYearText()}
                </Text>
                {vehicleMileage && (
                  <Text style={styles.summaryDetail}>Quilometragem: {vehicleMileage} km</Text>
                )}
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>🏢 Oficina</Text>
                <Text style={styles.summaryText}>{selectedWorkshop?.nome}</Text>
                <Text style={styles.summaryDetail}>{selectedWorkshop?.endereco}</Text>
                <Text style={styles.summaryDetail}>
                  {selectedWorkshop?.cidade}/{selectedWorkshop?.estado}
                </Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>🛠️ Serviços</Text>
                {selectedProducts.oil && (
                  <Text style={styles.summaryText}>• {products.oil?.nome}</Text>
                )}
                {selectedProducts.filter && (
                  <Text style={styles.summaryText}>• {products.filter?.nome}</Text>
                )}
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>📅 Data e Horário</Text>
                <Text style={styles.summaryText}>{selectedDate} às {selectedTime}</Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>💰 Total</Text>
                <Text style={styles.totalPrice}>R$ {calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goToStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      
        {currentStep < 4 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => goToStep(currentStep + 1)}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? "Confirmar Agendamento" : "Continuar"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmAppointment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <Text style={styles.confirmButtonText}>Finalizar Agendamento</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <SelectionModal
        visible={showBrandsModal}
        title="Selecione a Marca"
        options={brands}
        onSelect={(brand) => {
          setSelectedVehicle({
            marca_id: brand.id,
            marca: brand.nome
          })
          setShowBrandsModal(false)
        }}
        onClose={() => setShowBrandsModal(false)}
        selectedValue={selectedVehicle?.marca_id}
      />
   
      <SelectionModal
        visible={showModelsModal}
        title="Selecione o Modelo"
        options={models}
        onSelect={(model) => {
          setSelectedVehicle(prev => ({
            ...prev,
            modelo_id: model.id,
            modelo: model.nome
          }))
          setShowModelsModal(false)
        }}
        onClose={() => setShowModelsModal(false)}
        selectedValue={selectedVehicle?.modelo_id}
      />
   
      <SelectionModal
        visible={showYearsModal}
        title="Selecione o Ano"
        options={years}
        onSelect={(year) => {
          setSelectedVehicle(prev => ({
            ...prev,
            ano: year.ano
          }))
          setShowYearsModal(false)
        }}
        onClose={() => setShowYearsModal(false)}
        selectedValue={selectedVehicle?.ano}
      />

      <Modal
        visible={showWorkshopsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={workshopsModalStyles.container}>
          <View style={workshopsModalStyles.header}>
            <Text style={workshopsModalStyles.title}>
              Todas as Oficinas ({workshopsWithDistance.length})
            </Text>
            <TouchableOpacity onPress={() => setShowWorkshopsModal(false)}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
       
          <FlatList
            data={workshopsWithDistance}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <WorkshopCard
                workshop={item}
                selected={selectedWorkshop?.id === item.id}
                onSelect={(workshop) => {
                  setSelectedWorkshop(workshop)
                  setShowWorkshopsModal(false)
                }}
                distance={item.distancia || 0}
                userLocation={userLocation}
              />
            )}
            contentContainerStyle={workshopsModalStyles.list}
          />
        </View>
      </Modal>
   
      <CalendarModal
        visible={showDateModal}
        onSelect={(date) => {
          setSelectedDate(date)
          setShowDateModal(false)
        }}
        onClose={() => setShowDateModal(false)}
        selectedDate={selectedDate}
      />
   
      <TimeSlotsModal
        visible={showTimeModal}
        onSelect={(time) => {
          setSelectedTime(time)
          setShowTimeModal(false)
        }}
        onClose={() => setShowTimeModal(false)}
        selectedTime={selectedTime}
        selectedDate={selectedDate}
        workshop={selectedWorkshop}
      />

      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Oficinas Próximas</Text>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        
          {userLocation && (
            <MapView
              style={styles.fullMap}
              region={userLocation}
              showsUserLocation={false}
            >
              <Marker
                coordinate={{
                  latitude: ensureNumber(userLocation.latitude),
                  longitude: ensureNumber(userLocation.longitude)
                }}
                title={`Seu endereço: ${searchQuery.split(',')[0]}`}
                description={searchQuery.split(',').slice(1).join(',').trim()}
                pinColor="red"
              />
              {workshopsWithDistance.map(workshop => (
                <Marker
                  key={workshop.id}
                  coordinate={{
                    latitude: ensureNumber(workshop.coordenadas.latitude),
                    longitude: ensureNumber(workshop.coordenadas.longitude)
                  }}
                  title={workshop.nome}
                  description={`${workshop.distancia?.toFixed(1)} km`}
                  pinColor="blue"
                  onPress={() => {
                    setSelectedWorkshop(workshop)
                    setShowMapModal(false)
                  }}
                />
              ))}
            </MapView>
          )}
        </View>
      </Modal>
    </View>
  )
}

// Estilos (mantendo o layout do código 2)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    backgroundColor: "#1e293b",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: "#eab308",
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "bold",
  },
  logoTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#334155",
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: "#eab308",
  },
  progressStepText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "bold",
  },
  progressStepTextActive: {
    color: "#0f172a",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#334155",
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: "#eab308",
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  progressLabel: {
    color: "#94a3b8",
    fontSize: 10,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepNumber: {
    color: "#eab308",
  },
  stepSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "500",
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectText: {
    color: "#ffffff",
    fontSize: 16,
  },
  selectPlaceholder: {
    color: "#64748b",
    fontSize: 16,
  },
  disabledSelect: {
    opacity: 0.6,
    borderColor: "#475569",
    backgroundColor: "#1e293b",
  },
  disabledText: {
    color: "#64748b",
  },
  textInput: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    fontStyle: 'italic',
  },
  locationSection: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#eab308",
    padding: 12,
    borderRadius: 8,
  },
  locationOr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },
  orText: {
    color: "#64748b",
    fontSize: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  locationButtonText: {
    color: "#eab308",
    fontSize: 16,
    fontWeight: "500",
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapFullButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  mapFullButtonText: {
    color: "#eab308",
    fontSize: 12,
    fontWeight: "500",
  },
  workshopSection: {
    marginTop: 16,
    gap: 12,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "600",
  },
  nearbyWorkshops: {
    marginTop: 16,
  },
  nearbyTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  workshopSummary: {
    marginBottom: 24,
  },
  selectedWorkshopCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  workshopName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  workshopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workshopInfoText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  recommendationContainer: {
    gap: 12,
  },
  selectionSummary: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  summaryTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryItems: {
    color: "#94a3b8",
    fontSize: 14,
  },
  summaryTotal: {
    color: "#eab308",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  schedulingForm: {
    gap: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  personalData: {
    gap: 16,
  },
  confirmationSummary: {
    gap: 16,
  },
  summarySection: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
  },
  summaryText: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 4,
  },
  summaryDetail: {
    color: "#94a3b8",
    fontSize: 14,
  },
  totalPrice: {
    color: "#eab308",
    fontSize: 20,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: "#1e293b",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "500",
  },
  nextButton: {
    flex: 2,
    backgroundColor: "#eab308",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#1e293b",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mapModalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  fullMap: {
    flex: 1,
  },
})

// Estilos para modais de seleção
const selectionModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#1e293b",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionCardSelected: {
    backgroundColor: "#eab308",
  },
  optionText: {
    color: "#ffffff",
    fontSize: 16,
  },
  optionTextSelected: {
    color: "#0f172a",
    fontWeight: "500",
  },
})

// Estilos para cards de produto
const productCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cardSelected: {
    backgroundColor: "#1e3a8a",
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#1e293b",
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  nome: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  nomeSelected: {
    color: "#0f172a",
  },
  specs: {
    gap: 2,
  },
  specText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  specTextSelected: {
    color: "#0f172a",
  },
  preco: {
    color: "#eab308",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  precoSelected: {
    color: "#0f172a",
  },
  checkboxContainer: {
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#64748b",
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: "#eab308",
    borderColor: "#eab308",
  },
})

// Estilos para cards de oficina
const workshopCardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardSelected: {
    backgroundColor: "#1e3a8a",
    borderColor: "#3b82f6",
    borderWidth: 2,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nome: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  nomeSelected: {
    color: "#e2e8f0",
  },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  infoTextSelected: {
    color: "#e2e8f0",
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectedText: {
    color: "#eab308",
    fontSize: 14,
    fontWeight: "500",
  },
})

// Estilos para calendário
const calendarStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#1e293b",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  monthButton: {
    color: "#eab308",
    fontSize: 24,
    fontWeight: "bold",
  },
  monthText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  day: {
    width: (width - 32) / 7 - 4,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 20,
  },
  otherMonthDay: {
    backgroundColor: "transparent",
  },
  disabledDay: {
    backgroundColor: "transparent",
  },
  selectedDay: {
    backgroundColor: "#eab308",
  },
  today: {
    borderWidth: 1,
    borderColor: "#eab308",
  },
  dayText: {
    color: "#ffffff",
    fontSize: 14,
  },
  otherMonthDayText: {
    color: "#64748b",
  },
  disabledDayText: {
    color: "#475569",
  },
  selectedDayText: {
    color: "#0f172a",
    fontWeight: "bold",
  },
  todayText: {
    color: "#eab308",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#eab308",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "bold",
  },
})

// Estilos para seleção de horários
const timeSlotsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#1e293b",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 16,
  },
  list: {
    gap: 8,
  },
  timeSlot: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSlotSelected: {
    backgroundColor: "#fef9c3",
    borderWidth: 1,
    borderColor: "#eab308",
  },
  timeText: {
    color: "#ffffff",
    fontSize: 16,
  },
  timeTextSelected: {
    color: "#0f172a",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 32,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: 'center',
  },
})

// Estilos para modal de oficinas
const workshopsModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#1e293b",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    padding: 16,
    gap: 16,
  },
})