(function() {
    'use strict';
  
    const MAX_POINTS = 10;
    const STAFF_CODE = 'KHATRA2024'; // Simple code for owner to remember
    let points = 0;
    let customerData = { name: '', phone: '' };
  
    // --- Load & Save ---
    function loadData() {
      const pointsData = localStorage.getItem('khatra-points');
      points = pointsData ? parseInt(pointsData, 10) : 0;

      const savedCustomer = localStorage.getItem('khatra-customer');
      if (savedCustomer) {
        customerData = JSON.parse(savedCustomer);
      }

      // Clear stamp card initialized state so it re-renders with correct data
      const stampCard = document.getElementById('stamp-card');
      if (stampCard) {
        stampCard.dataset.initialized = '';
      }
    }
  
    function savePoints() {
      localStorage.setItem('khatra-points', points.toString());
    }
    
    function saveCustomerData() {
      localStorage.setItem('khatra-customer', JSON.stringify(customerData));
    }
  
    // --- Visual Feedback ---
    function showFeedback(message, isError = false) {
      const feedback = document.createElement('div');
      feedback.className = `feedback ${isError ? 'error' : 'success'}`;
      feedback.textContent = message;
      document.body.appendChild(feedback);
      
      // Animate in
      setTimeout(() => feedback.classList.add('show'), 10);
      
      // Remove after delay
      setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => feedback.remove(), 300);
      }, 3000);
    }
  
    // --- Render UI ---
    function updateDisplay() {
      const pointsCount = document.getElementById('points-count');
      const stampCard = document.getElementById('stamp-card');
      const statusMsg = document.getElementById('status-msg');
      const rewardSection = document.getElementById('reward-section');

      // Update points number
      pointsCount.textContent = points;

      // Update stamp card
      updateStamps(stampCard, points);

      // Update status message
      if (points >= MAX_POINTS) {
        statusMsg.innerHTML = '🎉 <strong>Félicitations !</strong> Votre boisson gratuite est disponible.';
        rewardSection.style.display = 'block';
      } else {
        const remaining = MAX_POINTS - points;
        statusMsg.textContent = `Encore ${remaining} point${remaining > 1 ? 's' : ''} pour une boisson gratuite !`;
        rewardSection.style.display = 'none';
      }
    }

    function updateStamps(stampCard, currentPoints) {
      // Initialize stamps if not already created
      if (!stampCard.dataset.initialized) {
        stampCard.innerHTML = '';
        for (let i = 0; i < MAX_POINTS; i++) {
          const stamp = document.createElement('div');
          stamp.className = 'stamp-slot';
          stamp.dataset.index = i;
          stamp.innerHTML = `
            <div class="stamp-inner">
              <img src="images/logo.webp" alt="Khatra" class="stamp-logo">
            </div>
          `;
          stampCard.appendChild(stamp);
        }
        stampCard.dataset.initialized = 'true';
        stampCard.dataset.lastPoints = '0';
      }

      const stamps = stampCard.querySelectorAll('.stamp-slot');
      const lastPoints = parseInt(stampCard.dataset.lastPoints || '0', 10);

      stamps.forEach((stamp, index) => {
        const wasActive = index < lastPoints;
        const isActive = index < currentPoints;

        // Remove all state classes first
        stamp.classList.remove('active', 'stamped', 'newly-stamped');

        if (isActive) {
          stamp.classList.add('active');
          // Only animate if this is a newly added stamp
          if (!wasActive && lastPoints > 0) {
            setTimeout(() => {
              stamp.classList.add('stamped', 'newly-stamped');
            }, index * 100); // staggered animation
          }
        }
      });

      stampCard.dataset.lastPoints = currentPoints.toString();
    }
    
    function claimReward() {
      if (points >= MAX_POINTS) {
        if (confirm('🎉 Félicitations ! Vous allez réclamer votre boisson gratuite. La carte sera réinitialisée.')) {
          points = 0;
          savePoints();
          updateDisplay();
          showFeedback('Profitez de votre boisson gratuite ! ☕');
        }
      }
    }
    
    function resetCard() {
      if (confirm('Êtes-vous sûr de vouloir réinitialiser votre carte ? Cette action est irréversible.')) {
        points = 0;
        savePoints();
        updateDisplay();
        showFeedback('Carte réinitialisée avec succès !');
      }
    }
    
    function addPoint() {
      if (points < MAX_POINTS) {
        points++;
        savePoints();
        updateDisplay();
        
        if (points === MAX_POINTS) {
          showFeedback('🎉 Félicitations ! 10 points atteints !');
        } else {
          showFeedback('Point ajouté ! +1 ☕');
        }
      } else {
        showFeedback('Carte déjà complète ! Réclamez votre récompense.', true);
      }
    }
  
    // --- Staff Code Logic ---
    const staffPin = document.getElementById('staff-pin');
    const staffBtn = document.getElementById('staff-add-btn');
    
    function onPinInput(e) {
      const input = e.target.value.trim();
      
      // Simple check - enable button if code matches
      const isMatch = input === STAFF_CODE;
      staffBtn.disabled = !isMatch;
      
      // Visual feedback
      e.target.classList.toggle('error', !isMatch && input.length > 0);
    }
    
    function onStaffBtnClick() {
      const input = staffPin.value.trim();
      
      if (input === STAFF_CODE) {
        addPoint();
        staffPin.value = ''; // Clear input after success
        staffBtn.disabled = true;
      } else {
        showFeedback('Code incorrect', true);
      }
    }
    
    // --- Customer Data ---
    const infoFormView = document.getElementById('info-form-view');
    const infoProfileView = document.getElementById('info-profile-view');
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const profileNameDisplay = document.getElementById('profile-name-display');
    const profilePhoneDisplay = document.getElementById('profile-phone-display');

    function updateInfoView() {
      const hasData = customerData.name || customerData.phone;

      if (hasData) {
        // Show profile view
        infoFormView.style.display = 'none';
        infoProfileView.style.display = 'block';
        profileNameDisplay.textContent = customerData.name || 'Client';
        profilePhoneDisplay.textContent = customerData.phone || '';
      } else {
        // Show form view
        infoFormView.style.display = 'block';
        infoProfileView.style.display = 'none';
      }
    }

    function saveCustomerInfo() {
      customerData.name = nameInput.value.trim();
      customerData.phone = phoneInput.value.trim();
      saveCustomerData();

      updateInfoView();
      showFeedback('Informations sauvegardées !');
    }

    function editCustomerInfo() {
      // Populate inputs with current data
      nameInput.value = customerData.name || '';
      phoneInput.value = customerData.phone || '';

      // Switch to form view
      infoFormView.style.display = 'block';
      infoProfileView.style.display = 'none';

      // Focus on name input
      nameInput.focus();
    }
  
    // --- Initialize ---
    function init() {
      loadData();
      updateDisplay();
      updateInfoView();

      // Event listeners
      if (staffPin && staffBtn) {
        staffPin.addEventListener('input', onPinInput);
        staffBtn.addEventListener('click', onStaffBtnClick);
      }

      // Customer info save button
      const saveInfoBtn = document.getElementById('save-info-btn');
      if (saveInfoBtn) {
        saveInfoBtn.addEventListener('click', saveCustomerInfo);
      }

      // Customer info edit button
      const editInfoBtn = document.getElementById('edit-info-btn');
      if (editInfoBtn) {
        editInfoBtn.addEventListener('click', editCustomerInfo);
      }

      // Claim reward button
      const claimBtn = document.getElementById('claim-reward-btn');
      if (claimBtn) {
        claimBtn.addEventListener('click', claimReward);
      }
    }
    
    document.addEventListener('DOMContentLoaded', init);
  })();