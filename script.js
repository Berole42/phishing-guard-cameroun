// Phishing Guard Cameroun - Main JavaScript

// Local Storage Key
const STORAGE_KEY = 'phishing_guard_history';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeMessageAnalysis();
    initializeURLAnalysis();
    initializeHistory();
    updateDashboard();
});

// Navigation System
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.dataset.section;
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });

            // Update dashboard when navigating to it
            if (targetSection === 'dashboard') {
                updateDashboard();
            }
        });
    });
}

// Message Analysis System
function initializeMessageAnalysis() {
    const analyzeBtn = document.getElementById('analyze-message-btn');
    const messageInput = document.getElementById('message-input');
    const resultContainer = document.getElementById('message-result');

    analyzeBtn.addEventListener('click', () => {
        const message = messageInput.value.trim();
        
        if (!message) {
            showError(resultContainer, 'Veuillez entrer un message à analyser.');
            return;
        }

        const analysis = analyzeMessage(message);
        displayResult(resultContainer, analysis, 'message');
        saveAnalysis({
            type: 'message',
            level: analysis.level,
            indicators: analysis.indicators.length,
            summary: truncateText(message, 100),
            timestamp: new Date().toISOString()
        });
        messageInput.value = '';
    });
}

function analyzeMessage(message) {
    const indicators = [];
    const lowerMessage = message.toLowerCase();

    // Urgent payment requests
    if (lowerMessage.includes('urgent') || lowerMessage.includes('immédiat') || lowerMessage.includes('tout de suite')) {
        if (lowerMessage.includes('paiement') || lowerMessage.includes('payer') || lowerMessage.includes('transfert')) {
            indicators.push({
                title: 'Demande urgente de paiement',
                explanation: 'Le message crée un sentiment d\'urgence pour vous pousser à agir rapidement sans réfléchir. Les arnaques utilisent souvent cette technique.',
                risk: 'high'
            });
        }
    }

    // Password or code requests
    if (lowerMessage.includes('mot de passe') || lowerMessage.includes('code') || lowerMessage.includes('pin') || lowerMessage.includes('otp')) {
        indicators.push({
            title: 'Demande d\'informations sensibles',
            explanation: 'Aucun service légitime ne vous demandera jamais votre mot de passe, code PIN ou code de validation par message.',
            risk: 'high'
        });
    }

    // Account blocking threats
    if (lowerMessage.includes('bloqué') || lowerMessage.includes('bloquera') || lowerMessage.includes('suspendu') || lowerMessage.includes('désactivé')) {
        indicators.push({
            title: 'Menace de blocage de compte',
            explanation: 'Les arnaques menacent souvent de bloquer votre compte pour vous inciter à fournir vos informations.',
            risk: 'high'
        });
    }

    // Unexpected rewards
    if (lowerMessage.includes('gagné') || lowerMessage.includes('gain') || lowerMessage.includes('lot') || lowerMessage.includes('prix') || lowerMessage.includes('récompense')) {
        indicators.push({
            title: 'Promesse de gain inattendu',
            explanation: 'Les annonces de gains, lots ou récompenses inattendus sont souvent des pièges pour obtenir vos informations personnelles.',
            risk: 'medium'
        });
    }

    // Money transfer requests
    if (lowerMessage.includes('transfert') || lowerMessage.includes('envoyer') || lowerMessage.includes('mobile money') || lowerMessage.includes('orange money') || lowerMessage.includes('mtn momo')) {
        if (lowerMessage.includes('frais') || lowerMessage.includes('commission') || lowerMessage.includes('taxe')) {
            indicators.push({
                title: 'Demande de transfert avec frais',
                explanation: 'Les arnaques demandent souvent un petit transfert pour débloquer un gain plus important. C\'est toujours un piège.',
                risk: 'high'
            });
        } else {
            indicators.push({
                title: 'Mention de services de transfert d\'argent',
                explanation: 'Le message mentionne des services de transfert d\'argent. Vérifiez toujours l\'authenticité auprès du service officiel.',
                risk: 'low'
            });
        }
    }

    // Unusual links
    const linkPattern = /https?:\/\/[^\s]+/gi;
    const links = message.match(linkPattern);
    if (links) {
        indicators.push({
            title: 'Présence de liens',
            explanation: `Le message contient ${links.length} lien(s). Ne cliquez jamais sur un lien dans un message suspect. Vérifiez toujours l\'adresse officielle.`,
            risk: 'medium'
        });
    }

    // Confidential information requests
    if (lowerMessage.includes('confidentiel') || lowerMessage.includes('personnel') || lowerMessage.includes('identité') || lowerMessage.includes('carte')) {
        indicators.push({
            title: 'Demande d\'informations confidentielles',
            explanation: 'Le message demande des informations personnelles ou confidentielles. Soyez très prudent.',
            risk: 'high'
        });
    }

    // Refund promises
    if (lowerMessage.includes('remboursement') || lowerMessage.includes('rembourser') || lowerMessage.includes('remboursé')) {
        indicators.push({
            title: 'Promesse de remboursement',
            explanation: 'Les promesses de remboursement inattendues sont souvent utilisées pour obtenir vos informations bancaires.',
            risk: 'medium'
        });
    }

    // Fake delivery messages
    if (lowerMessage.includes('livraison') || lowerMessage.includes('colis') || lowerMessage.includes('package') || lowerMessage.includes('commande')) {
        if (lowerMessage.includes('frais') || lowerMessage.includes('payer') || lowerMessage.includes('transfert')) {
            indicators.push({
                title: 'Fausse livraison avec paiement demandé',
                explanation: 'Les faux messages de livraison demandent souvent un paiement pour recevoir un colis. Les services de livraison légitimes ne fonctionnent pas ainsi.',
                risk: 'high'
            });
        } else {
            indicators.push({
                title: 'Message de livraison',
                explanation: 'Le message concerne une livraison. Vérifiez directement sur le site officiel du service de livraison.',
                risk: 'low'
            });
        }
    }

    // Fake job offers
    if (lowerMessage.includes('emploi') || lowerMessage.includes('travail') || lowerMessage.includes('recrutement') || lowerMessage.includes('poste')) {
        if (lowerMessage.includes('frais') || lowerMessage.includes('dossier') || lowerMessage.includes('payer')) {
            indicators.push({
                title: 'Offre d\'emploi avec frais demandés',
                explanation: 'Les offres d\'emploi légitimes ne demandent jamais de frais de dossier ou de paiement avant l\'embauche.',
                risk: 'high'
            });
        } else {
            indicators.push({
                title: 'Mention d\'offre d\'emploi',
                explanation: 'Le message mentionne une offre d\'emploi. Vérifiez toujours sur le site officiel de l\'entreprise.',
                risk: 'low'
            });
        }
    }

    // Fake financial aid
    if (lowerMessage.includes('aide') || lowerMessage.includes('subvention') || lowerMessage.includes('bourse') || lowerMessage.includes('financement')) {
        indicators.push({
            title: 'Promesse d\'aide financière',
            explanation: 'Les promesses d\'aide financière non sollicitées sont souvent des arnaques. Vérifiez auprès des institutions officielles.',
            risk: 'medium'
        });
    }

    // Phone number patterns (Cameroon)
    const phonePattern = /(\+237|237)?[2368]\d{8}/g;
    const phones = message.match(phonePattern);
    if (phones) {
        indicators.push({
            title: 'Numéro de téléphone présent',
            explanation: 'Le message contient un numéro de téléphone. Vérifiez toujours qu\'il s\'agit d\'un numéro officiel (ex: 150 pour MTN, 100 pour Orange).',
            risk: 'low'
        });
    }

    // Determine vigilance level
    let level = 'low';
    const highRiskCount = indicators.filter(i => i.risk === 'high').length;
    const mediumRiskCount = indicators.filter(i => i.risk === 'medium').length;

    if (highRiskCount >= 2 || (highRiskCount >= 1 && mediumRiskCount >= 2)) {
        level = 'high';
    } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
        level = 'medium';
    }

    return {
        level,
        indicators,
        precautions: getPrecautions(level)
    };
}

// URL Analysis System
function initializeURLAnalysis() {
    const analyzeBtn = document.getElementById('analyze-url-btn');
    const urlInput = document.getElementById('url-input');
    const resultContainer = document.getElementById('url-result');

    analyzeBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError(resultContainer, 'Veuillez entrer une URL à analyser.');
            return;
        }

        const analysis = analyzeURL(url);
        displayResult(resultContainer, analysis, 'url');
        saveAnalysis({
            type: 'url',
            level: analysis.level,
            indicators: analysis.indicators.length,
            summary: truncateText(url, 100),
            timestamp: new Date().toISOString()
        });
        urlInput.value = '';
    });
}

function analyzeURL(urlString) {
    const indicators = [];
    
    try {
        const url = new URL(urlString);
        
        // Protocol check
        if (url.protocol === 'https:') {
            indicators.push({
                title: 'Protocole HTTPS détecté',
                explanation: 'L\'URL utilise le protocole HTTPS. Notez que cela ne garantit pas que le site est fiable. De nombreux sites de phishing utilisent également HTTPS.',
                risk: 'low'
            });
        } else if (url.protocol === 'http:') {
            indicators.push({
                title: 'Protocole HTTP non sécurisé',
                explanation: 'L\'URL utilise le protocole HTTP non chiffré. Les sites légitimes utilisent généralement HTTPS.',
                risk: 'medium'
            });
        } else {
            indicators.push({
                title: 'Protocole inhabituel',
                explanation: `L'URL utilise un protocole inhabituel: ${url.protocol}`,
                risk: 'high'
            });
        }

        // IP address as hostname
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipPattern.test(url.hostname)) {
            indicators.push({
                title: 'Adresse IP utilisée comme hôte',
                explanation: 'L\'URL utilise une adresse IP au lieu d\'un nom de domaine. Les sites légitimes utilisent rarement des adresses IP directement.',
                risk: 'high'
            });
        }

        // Deceptive domain patterns
        const suspiciousPatterns = [
            /login/i,
            /signin/i,
            /secure/i,
            /account/i,
            /verify/i,
            /confirm/i,
            /update/i,
            /bank/i,
            /mtn/i,
            /orange/i,
            /cameroon/i,
            /cameroun/i,
            /cm/i
        ];

        const hostname = url.hostname.toLowerCase();
        suspiciousPatterns.forEach(pattern => {
            if (pattern.test(hostname)) {
                indicators.push({
                    title: 'Terme suspect dans le nom de domaine',
                    explanation: `Le nom de domaine contient le terme "${pattern.source}" qui est souvent utilisé dans les sites de phishing.`,
                    risk: 'medium'
                });
            }
        });

        // Subdomain analysis
        const parts = hostname.split('.');
        if (parts.length > 3) {
            indicators.push({
                title: 'Sous-domaines multiples',
                explanation: 'L\'URL contient plusieurs sous-domaines. Les arnaques utilisent parfois des sous-domaines complexes pour imiter des sites légitimes.',
                risk: 'medium'
            });
        }

        // Character substitution (homograph attacks)
        const suspiciousChars = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ]/i;
        if (suspiciousChars.test(hostname)) {
            indicators.push({
                title: 'Caractères spéciaux dans le domaine',
                explanation: 'Le nom de domaine contient des caractères spéciaux qui peuvent être utilisés pour imiter d\'autres domaines (attaque par homographe).',
                risk: 'high'
            });
        }

        // Suspicious TLDs
        const suspiciousTLDs = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq'];
        const tld = hostname.substring(hostname.lastIndexOf('.'));
        if (suspiciousTLDs.includes(tld)) {
            indicators.push({
                title: 'Extension de domaine suspecte',
                explanation: `L'extension ${tld} est souvent utilisée par les sites de phishing en raison de son faible coût.`,
                risk: 'medium'
            });
        }

        // Very long domain names
        if (hostname.length > 50) {
            indicators.push({
                title: 'Nom de domaine très long',
                explanation: 'Les noms de domaine très longs sont souvent utilisés pour masquer la véritable identité du site.',
                risk: 'medium'
            });
        }

        // Numbers in domain
        const numberPattern = /\d{4,}/;
        if (numberPattern.test(hostname)) {
            indicators.push({
                title: 'Séquences de nombres dans le domaine',
                explanation: 'Le nom de domaine contient des séquences de nombres, ce qui est atypique pour les sites légitimes.',
                risk: 'low'
            });
        }

        // Determine vigilance level
        let level = 'low';
        const highRiskCount = indicators.filter(i => i.risk === 'high').length;
        const mediumRiskCount = indicators.filter(i => i.risk === 'medium').length;

        if (highRiskCount >= 1 || mediumRiskCount >= 3) {
            level = 'high';
        } else if (mediumRiskCount >= 1) {
            level = 'medium';
        }

        return {
            level,
            indicators,
            precautions: getPrecautions(level),
            urlInfo: {
                protocol: url.protocol,
                hostname: url.hostname,
                pathname: url.pathname
            }
        };

    } catch (error) {
        return {
            level: 'high',
            indicators: [{
                title: 'URL invalide',
                explanation: 'L\'URL fournie n\'est pas valide. Vérifiez le format et réessayez.',
                risk: 'high'
            }],
            precautions: getPrecautions('high')
        };
    }
}

// Get precautions based on vigilance level
function getPrecautions(level) {
    const basePrecautions = [
        'Ne cliquez jamais sur un lien dans un message suspect',
        'Vérifiez l\'information auprès du service officiel',
        'Ne communiquez jamais de code secret ou de validation'
    ];

    if (level === 'low') {
        return [
            ...basePrecautions,
            'Gardez une vigilance normale',
            'Vérifiez l\'expéditeur du message'
        ];
    } else if (level === 'medium') {
        return [
            ...basePrecautions,
            'Soyez particulièrement prudent',
            'Contactez le service via les canaux officiels',
            'Ne fournissez aucune information personnelle'
        ];
    } else {
        return [
            ...basePrecautions,
            'Traitez ce message comme suspect',
            'Ne répondez pas au message',
            'Signalez le message si possible',
            'Bloquez l\'expéditeur'
        ];
    }
}

// Display analysis results
function displayResult(container, analysis, type) {
    container.classList.remove('hidden');
    
    const levelText = {
        low: 'Vigilance faible',
        medium: 'Vigilance modérée',
        high: 'Vigilance élevée'
    };

    let html = `
        <div class="result-header">
            <span class="result-level ${analysis.level}">${levelText[analysis.level]}</span>
        </div>
    `;

    if (analysis.indicators.length > 0) {
        html += '<div class="result-indicators">';
        analysis.indicators.forEach(indicator => {
            html += `
                <div class="indicator-item ${indicator.risk === 'high' ? 'high-risk' : ''}">
                    <div class="indicator-title">${indicator.title}</div>
                    <div class="indicator-explanation">${indicator.explanation}</div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p>Aucun indice suspect détecté.</p>';
    }

    html += `
        <div class="result-precautions">
            <h4>Précautions recommandées :</h4>
            <ul>
                ${analysis.precautions.map(p => `<li>${p}</li>`).join('')}
            </ul>
        </div>
        <div class="result-warning">
            <strong>⚠️ Avertissement :</strong> Cette analyse est indicative. L'absence d'indice détecté ne garantit pas qu'un message ou un lien soit sûr. En cas de doute, vérifiez l'information auprès du service officiel concerné. Ne communiquez jamais un code secret ou un code de validation à une personne qui vous contacte.
        </div>
    `;

    container.innerHTML = html;
}

// Show error message
function showError(container, message) {
    container.classList.remove('hidden');
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

// History Management
function initializeHistory() {
    const searchInput = document.getElementById('history-search');
    const filterSelect = document.getElementById('history-filter');
    const clearBtn = document.getElementById('clear-history-btn');

    searchInput.addEventListener('input', () => renderHistory());
    filterSelect.addEventListener('change', () => renderHistory());
    clearBtn.addEventListener('click', clearHistory);

    renderHistory();
}

function getHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function saveAnalysis(analysis) {
    const history = getHistory();
    history.unshift(analysis);
    // Keep only last 100 entries
    if (history.length > 100) {
        history.pop();
    }
    saveHistory(history);
    updateDashboard();
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    const searchInput = document.getElementById('history-search');
    const filterSelect = document.getElementById('history-filter');
    
    let history = getHistory();
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        history = history.filter(item => 
            item.summary.toLowerCase().includes(searchTerm) ||
            item.type.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply type/vigilance filter
    const filter = filterSelect.value;
    if (filter !== 'all') {
        if (['message', 'url'].includes(filter)) {
            history = history.filter(item => item.type === filter);
        } else {
            history = history.filter(item => item.level === filter);
        }
    }

    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">Aucune analyse correspondante</p>';
        return;
    }

    const levelText = {
        low: 'Vigilance faible',
        medium: 'Vigilance modérée',
        high: 'Vigilance élevée'
    };

    const typeText = {
        message: 'Message',
        url: 'URL'
    };

    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <div class="history-item-content">
                <div class="history-item-header">
                    <span class="history-item-type">${typeText[item.type]}</span>
                    <span class="analysis-item-level ${item.level}">${levelText[item.level]}</span>
                    <span class="history-item-date">${formatDate(item.timestamp)}</span>
                </div>
                <div class="history-item-summary">${escapeHtml(item.summary)}</div>
                <div class="history-item-meta">${item.indicators} indice(s) détecté(s)</div>
            </div>
            <div class="history-item-actions">
                <button class="btn-delete" onclick="deleteHistoryItem(${index})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

function deleteHistoryItem(index) {
    const history = getHistory();
    history.splice(index, 1);
    saveHistory(history);
    renderHistory();
    updateDashboard();
}

function clearHistory() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
        updateDashboard();
    }
}

// Dashboard
function updateDashboard() {
    const history = getHistory();
    
    const total = history.length;
    const low = history.filter(item => item.level === 'low').length;
    const medium = history.filter(item => item.level === 'medium').length;
    const high = history.filter(item => item.level === 'high').length;

    document.getElementById('total-analyses').textContent = total;
    document.getElementById('low-vigilance').textContent = low;
    document.getElementById('medium-vigilance').textContent = medium;
    document.getElementById('high-vigilance').textContent = high;

    // Recent analyses (last 5)
    const recentList = document.getElementById('recent-analyses-list');
    const recent = history.slice(0, 5);

    if (recent.length === 0) {
        recentList.innerHTML = '<p class="empty-state">Aucune analyse récente</p>';
        return;
    }

    const levelText = {
        low: 'Vigilance faible',
        medium: 'Vigilance modérée',
        high: 'Vigilance élevée'
    };

    const typeText = {
        message: 'Message',
        url: 'URL'
    };

    recentList.innerHTML = recent.map(item => `
        <div class="analysis-item ${item.level}">
            <div class="analysis-item-info">
                <div class="analysis-item-type">${typeText[item.type]}</div>
                <div class="analysis-item-summary">${escapeHtml(item.summary)}</div>
                <div class="analysis-item-meta">${formatDate(item.timestamp)} • ${item.indicators} indice(s)</div>
            </div>
            <span class="analysis-item-level ${item.level}">${levelText[item.level]}</span>
        </div>
    `).join('');
}

// Utility Functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
