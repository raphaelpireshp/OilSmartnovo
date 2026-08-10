function isValidDayForWorkshop(selectedDate, workshop) {
    if (!selectedDate || !workshop || !workshop.dias_funcionamento) {
        return true;
    }

    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayOfWeek = selectedDate.getDay();
    const diaSemana = dayNames[dayOfWeek];

    return workshop.dias_funcionamento.toLowerCase().includes(diaSemana);
}

module.exports = { isValidDayForWorkshop };
