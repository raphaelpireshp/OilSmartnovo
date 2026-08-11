(function () {
    const STORAGE_KEY = 'oilsmart-workshop-tutorial-seen';
    const steps = [
        {
            icon: 'fa-gauge-high',
            eyebrow: 'Visão geral',
            title: 'Comece pelo dashboard',
            text: 'Aqui você acompanha o movimento do dia, pendências, confirmações e os principais números da oficina.'
        },
        {
            icon: 'fa-calendar-check',
            eyebrow: 'Atendimento',
            title: 'Organize os agendamentos',
            text: 'Use Agendamentos para confirmar solicitações, consultar dados do veículo e atualizar cada atendimento.'
        },
        {
            icon: 'fa-boxes-stacked',
            eyebrow: 'Operação',
            title: 'Mantenha o estoque em dia',
            text: 'Cadastre entradas e saídas e acompanhe os produtos antes que um item importante fique indisponível.'
        },
        {
            icon: 'fa-chart-line',
            eyebrow: 'Gestão',
            title: 'Use relatórios e configurações',
            text: 'Consulte resultados, ajuste horários da oficina e mantenha os dados do estabelecimento atualizados.'
        }
    ];

    let currentStep = 0;
    let dialog;
    let previousFocus;

    function createTutorial() {
        const wrapper = document.createElement('div');
        wrapper.className = 'admin-tutorial';
        wrapper.id = 'adminTutorial';
        wrapper.hidden = true;
        wrapper.innerHTML = `
            <div class="admin-tutorial-backdrop" data-tutorial-close></div>
            <section class="admin-tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="adminTutorialTitle">
                <button type="button" class="admin-tutorial-close" data-tutorial-close aria-label="Fechar tutorial">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <div class="admin-tutorial-progress" aria-label="Progresso do tutorial"></div>
                <div class="admin-tutorial-icon"><i class="fas" aria-hidden="true"></i></div>
                <span class="admin-tutorial-eyebrow"></span>
                <h2 id="adminTutorialTitle"></h2>
                <p class="admin-tutorial-text"></p>
                <div class="admin-tutorial-count" aria-live="polite"></div>
                <div class="admin-tutorial-actions">
                    <button type="button" class="admin-tutorial-secondary" data-tutorial-previous>Voltar</button>
                    <button type="button" class="admin-tutorial-primary" data-tutorial-next>Próximo</button>
                </div>
            </section>`;
        document.body.appendChild(wrapper);
        return wrapper;
    }

    function render() {
        const step = steps[currentStep];
        dialog.querySelector('.admin-tutorial-icon i').className = `fas ${step.icon}`;
        dialog.querySelector('.admin-tutorial-eyebrow').textContent = step.eyebrow;
        dialog.querySelector('#adminTutorialTitle').textContent = step.title;
        dialog.querySelector('.admin-tutorial-text').textContent = step.text;
        dialog.querySelector('.admin-tutorial-count').textContent = `${currentStep + 1} de ${steps.length}`;
        dialog.querySelector('[data-tutorial-previous]').disabled = currentStep === 0;
        dialog.querySelector('[data-tutorial-next]').textContent = currentStep === steps.length - 1 ? 'Entendi' : 'Próximo';
        dialog.querySelector('.admin-tutorial-progress').innerHTML = steps
            .map((_, index) => `<span class="${index <= currentStep ? 'is-active' : ''}"></span>`)
            .join('');
    }

    function openTutorial() {
        previousFocus = document.activeElement;
        currentStep = 0;
        render();
        dialog.hidden = false;
        document.body.classList.add('tutorial-open');
        dialog.querySelector('[data-tutorial-next]').focus();
    }

    function closeTutorial() {
        dialog.hidden = true;
        document.body.classList.remove('tutorial-open');
        localStorage.setItem(STORAGE_KEY, 'true');
        previousFocus?.focus();
    }

    document.addEventListener('DOMContentLoaded', function () {
        dialog = createTutorial();
        const openButton = document.getElementById('adminTutorialButton');

        openButton?.addEventListener('click', openTutorial);
        dialog.addEventListener('click', function (event) {
            if (event.target.closest('[data-tutorial-close]')) closeTutorial();
            if (event.target.closest('[data-tutorial-previous]') && currentStep > 0) {
                currentStep -= 1;
                render();
            }
            if (event.target.closest('[data-tutorial-next]')) {
                if (currentStep === steps.length - 1) closeTutorial();
                else {
                    currentStep += 1;
                    render();
                }
            }
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !dialog.hidden) closeTutorial();
        });

        if (localStorage.getItem(STORAGE_KEY) !== 'true') {
            window.setTimeout(openTutorial, 700);
        }
    });
})();
