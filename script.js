(function() {
    "use strict";

    // DOM
    const passwordOutput = document.getElementById('passwordOutput');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    const chkUpper = document.getElementById('chkUpper');
    const chkLower = document.getElementById('chkLower');
    const chkDigits = document.getElementById('chkDigits');
    const chkSymbols = document.getElementById('chkSymbols');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const seg1 = document.getElementById('seg1');
    const seg2 = document.getElementById('seg2');
    const seg3 = document.getElementById('seg3');
    const seg4 = document.getElementById('seg4');
    const strengthText = document.getElementById('strengthText');
    const toast = document.getElementById('toast');

    // conjuntos
    const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWER = 'abcdefghijklmnopqrstuvwxyz';
    const DIGITS = '0123456789';
    const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let currentPassword = '';

    // --- funções ---
    function getCharSet() {
        let set = '';
        if (chkUpper.checked) set += UPPER;
        if (chkLower.checked) set += LOWER;
        if (chkDigits.checked) set += DIGITS;
        if (chkSymbols.checked) set += SYMBOLS;
        return set;
    }

    // gerador seguro (crypto.getRandomValues)
    function generateSecurePassword(length) {
        const charset = getCharSet();
        if (!charset) {
            // fallback: se nada selecionado, usa lower+digits
            return generateFallback(length, LOWER + DIGITS);
        }
        let password = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }
        return password;
    }

    function generateFallback(length, charset) {
        let pass = '';
        for (let i = 0; i < length; i++) {
            const rand = Math.floor(Math.random() * charset.length);
            pass += charset[rand];
        }
        return pass;
    }

    // avalia força (0-4)
    function evaluateStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
        // ajuste fino
        if (password.length >= 16) score = Math.min(4, score + 1);
        if (password.length <= 4) score = 0;
        return Math.min(4, Math.max(0, score));
    }

    function updateStrengthMeter(password) {
        const score = evaluateStrength(password);
        const segments = [seg1, seg2, seg3, seg4];
        const classes = ['weak', 'medium', 'strong', 'very-strong'];
        const labels = ['Fraca', 'Média', 'Forte', 'Muito forte'];

        segments.forEach((seg, idx) => {
            seg.className = 'bar-segment';
            if (idx < score) {
                seg.classList.add('active', classes[idx] || 'medium');
            }
        });

        const labelIdx = Math.min(score, 3);
        strengthText.textContent = labels[labelIdx] || 'Média';
    }

    // gera e exibe senha
    function generateAndDisplay() {
        const length = parseInt(lengthSlider.value, 10);
        const charset = getCharSet();
        if (!charset) {
            // se nenhum checkbox marcado, ativa lower+digits forçado
            chkLower.checked = true;
            chkDigits.checked = true;
            // recarrega
            generateAndDisplay();
            return;
        }
        const newPass = generateSecurePassword(length);
        currentPassword = newPass;
        passwordOutput.value = newPass;
        updateStrengthMeter(newPass);
        // atualiza comprimento
        lengthValue.textContent = length;
    }

    // copiar com fallback
    function copyPassword() {
        const text = passwordOutput.value;
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('📋 Copiado!');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('📋 Copiado!');
        } catch (e) {
            showToast('❌ Erro ao copiar');
        }
        document.body.removeChild(textarea);
    }

    let toastTimer = null;
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 1800);
    }

    // --- eventos ---
    function onGenerate() {
        generateAndDisplay();
    }

    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
        // não gera automaticamente para não sobrecarregar, mas pode: 
        // onGenerate(); 
    });

    generateBtn.addEventListener('click', onGenerate);
    refreshBtn.addEventListener('click', onGenerate);
    copyBtn.addEventListener('click', copyPassword);

    // atalho: Enter no campo da senha (para copiar)
    passwordOutput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            copyPassword();
        }
    });

    // quando checkbox muda, regenera
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            // se nenhum marcado, força lower+digits
            if (!chkUpper.checked && !chkLower.checked && !chkDigits.checked && !chkSymbols.checked) {
                chkLower.checked = true;
                chkDigits.checked = true;
            }
            onGenerate();
        });
    });

    // slider gera ao soltar
    lengthSlider.addEventListener('change', onGenerate);
    // também ao mover (mas com leve delay para não travar)
    let sliderTimeout = null;
    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
        clearTimeout(sliderTimeout);
        sliderTimeout = setTimeout(() => {
            onGenerate();
        }, 200);
    });

    // inicializa
    (function init() {
        // garante que alguns checkboxes estejam marcados
        if (!chkUpper.checked && !chkLower.checked && !chkDigits.checked && !chkSymbols.checked) {
            chkLower.checked = true;
            chkDigits.checked = true;
        }
        generateAndDisplay();
    })();

})();
