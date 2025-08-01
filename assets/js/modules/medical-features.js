// SilentStacks Medical Features Module
// Handles progress step navigation, tag color system, priority indicators, and medical workflows
(() => {
  'use strict';

  // === Module State ===
  let initialized = false;
  let currentStep = 1;
  const totalSteps = 3;

  // === Progress Step Navigation ===
  function initProgressStepNavigation() {
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-fill');
    
    if (!progressSteps.length) return;
    
    // Add click handlers to progress steps
    progressSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      
      // Make steps clickable
      step.style.cursor = 'pointer';
      step.setAttribute('tabindex', '0');
      step.setAttribute('role', 'button');
      step.setAttribute('aria-label', `Go to step ${stepNumber}: ${step.querySelector('.step-label').textContent}`);
      
      // Click handler
      step.addEventListener('click', () => {
        navigateToStep(stepNumber);
      });
      
      // Keyboard handler
      step.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToStep(stepNumber);
        }
      });
      
      // Hover effects
      step.addEventListener('mouseenter', () => {
        if (stepNumber !== currentStep) {
          step.style.transform = 'translateY(-2px)';
        }
      });
      
      step.addEventListener('mouseleave', () => {
        step.style.transform = '';
      });
    });
    
    // Initialize first step
    updateProgressDisplay();
    setupAutoProgress();
  }

  function navigateToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > totalSteps) return;
    
    const targetSection = getStepSection(stepNumber);
    if (!targetSection) return;
    
    // Update current step
    currentStep = stepNumber;
    window.SilentStacks.state.currentStep = stepNumber;
    
    // Smooth scroll to target section
    targetSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    
    // Update visual progress
    updateProgressDisplay();
    
    // Focus management
    setTimeout(() => {
      const firstInput = targetSection.querySelector('input, select, textarea');
      if (firstInput && !firstInput.disabled) {
        firstInput.focus();
      }
    }, 500);
    
    // Announce to screen readers
    announceStepChange(stepNumber);
  }

  function getStepSection(stepNumber) {
    const stepMappings = {
      1: '#identifiers-section',
      2: '#details-section',
      3: '#request-section'
    };
    
    const sectionId = stepMappings[stepNumber];
    return sectionId ? document.querySelector(sectionId) : null;
  }

  function updateProgressDisplay() {
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-fill');
    const progressBar = document.querySelector('.form-progress');
    
    if (!progressSteps.length) return;
    
    // Update step states
    progressSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      const stepNumberEl = step.querySelector('.step-number');
      const stepLabelEl = step.querySelector('.step-label');
      
      // Remove all state classes
      step.classList.remove('active', 'completed');
      stepNumberEl.classList.remove('completed');
      
      if (stepNumber < currentStep) {
        // Completed step
        step.classList.add('completed');
        stepNumberEl.classList.add('completed');
        stepNumberEl.innerHTML = '✓';
        step.setAttribute('aria-label', `Completed step ${stepNumber}: ${stepLabelEl.textContent}`);
      } else if (stepNumber === currentStep) {
        // Current active step
        step.classList.add('active');
        stepNumberEl.innerHTML = stepNumber;
        step.setAttribute('aria-label', `Current step ${stepNumber}: ${stepLabelEl.textContent}`);
      } else {
        // Future step
        stepNumberEl.innerHTML = stepNumber;
        step.setAttribute('aria-label', `Step ${stepNumber}: ${stepLabelEl.textContent} (not yet reached)`);
      }
    });
    
    // Update progress bar fill
    if (progressFill) {
      const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
      progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Update progress bar ARIA attributes
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', currentStep);
      progressBar.setAttribute('aria-valuetext', `Step ${currentStep} of ${totalSteps}`);
    }
  }

  function setupAutoProgress() {
    // Monitor identifiers section
    const pmidInput = document.getElementById('pmid');
    const doiInput = document.getElementById('doi');
    const titleInput = document.getElementById('title');
    
    // Auto-advance from step 1 when PMID/DOI lookup succeeds or title is entered
    const checkStep1Completion = () => {
      if (currentStep === 1) {
        const hasIdentifier = (pmidInput && pmidInput.value.trim()) || 
                             (doiInput && doiInput.value.trim());
        const hasTitle = titleInput && titleInput.value.trim();
        
        if ((hasIdentifier || hasTitle) && titleInput && titleInput.value.trim()) {
          setTimeout(() => {
            if (currentStep === 1) { // Still on step 1
              navigateToStep(2);
            }
          }, 1000); // Small delay to allow user to see the populated data
        }
      }
    };
    
    // Auto-advance from step 2 when key details are filled
    const checkStep2Completion = () => {
      if (currentStep === 2) {
        const title = titleInput && titleInput.value.trim();
        const authors = document.getElementById('authors') && document.getElementById('authors').value.trim();
        const journal = document.getElementById('journal') && document.getElementById('journal').value.trim();
        
        if (title && (authors || journal)) {
          setTimeout(() => {
            if (currentStep === 2) { // Still on step 2
              navigateToStep(3);
            }
          }, 500);
        }
      }
    };
    
    // Add event listeners
    if (pmidInput) pmidInput.addEventListener('input', checkStep1Completion);
    if (doiInput) doiInput.addEventListener('input', checkStep1Completion);
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        checkStep1Completion();
        checkStep2Completion();
      });
    }
    
    const authorsInput = document.getElementById('authors');
    const journalInput = document.getElementById('journal');
    
    if (authorsInput) authorsInput.addEventListener('input', checkStep2Completion);
    if (journalInput) journalInput.addEventListener('input', checkStep2Completion);
  }

  function announceStepChange(stepNumber) {
    const stepLabels = {
      1: 'Identifiers',
      2: 'Publication Details',
      3: 'Request Details'
    };
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Now on step ${stepNumber}: ${stepLabels[stepNumber]}`;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  function autoAdvanceStep(fromStep) {
    if (fromStep === 1 && currentStep === 1) {
      setTimeout(() => {
        if (currentStep === 1) {
          navigateToStep(2);
        }
      }, 1500);
    }
  }

  function resetProgress() {
    currentStep = 1;
    window.SilentStacks.state.currentStep = 1;
    updateProgressDisplay();
  }

  // === Tag Color System ===
  function openTagColorPicker(tagName, element) {
    // Remove any existing color pickers
    document.querySelectorAll('.tag-color-picker').forEach(picker => picker.remove());
    
    const globalTags = window.SilentStacks.modules.DataManager.getGlobalTags();
    const currentColor = globalTags.get(tagName) || 'default';
    
    const colorPicker = document.createElement('div');
    colorPicker.className = 'tag-color-picker';
    colorPicker.setAttribute('role', 'dialog');
    colorPicker.setAttribute('aria-label', `Choose color for tag: ${tagName}`);
    
    // Enhanced color palette with 8 colors + default
    const colors = [
      { id: '1', name: 'Red', hex: '#e74c3c' },
      { id: '2', name: 'Orange', hex: '#f39c12' },
      { id: '3', name: 'Green', hex: '#27ae60' },
      { id: '4', name: 'Blue', hex: '#3498db' },
      { id: '5', name: 'Purple', hex: '#9b59b6' },
      { id: '6', name: 'Pink', hex: '#e91e63' },
      { id: '7', name: 'Cyan', hex: '#00bcd4' },
      { id: '8', name: 'Orange Red', hex: '#ff5722' },
      { id: 'default', name: 'Default', hex: 'transparent' }
    ];
    
    colorPicker.innerHTML = colors.map(color => `
      <div class="color-option color-${color.id} ${currentColor === color.id ? 'selected' : ''}" 
           onclick="setTagColor('${tagName}', '${color.id}')" 
           onkeydown="handleColorKeydown(event, '${tagName}', '${color.id}')"
           tabindex="0"
           title="${color.name}"
           aria-label="Set tag color to ${color.name}"
           data-color="${color.id}">
      </div>
    `).join('');
    
    // Position the picker
    const rect = element.getBoundingClientRect();
    const container = element.closest('.request-card') || element.parentNode;
    container.style.position = 'relative';
    container.appendChild(colorPicker);
    
    // Position picker relative to tag
    const pickerRect = colorPicker.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Adjust position to keep picker in viewport
    let top = rect.bottom - containerRect.top + 5;
    let left = rect.left - containerRect.left;
    
    // Prevent picker from going off-screen
    if (left + pickerRect.width > window.innerWidth - 20) {
      left = rect.right - containerRect.left - pickerRect.width;
    }
    
    if (top + pickerRect.height > window.innerHeight - 20) {
      top = rect.top - containerRect.top - pickerRect.height - 5;
    }
    
    colorPicker.style.top = `${top}px`;
    colorPicker.style.left = `${left}px`;
    
    // Activate with animation
    setTimeout(() => {
      colorPicker.classList.add('active');
      
      // Focus the current color or first option
      const currentOption = colorPicker.querySelector('.selected') || colorPicker.querySelector('.color-option');
      if (currentOption) {
        currentOption.focus();
      }
    }, 10);
    
    // Close picker when clicking elsewhere or pressing Escape
    setTimeout(() => {
      const closeHandler = (e) => {
        if (e.type === 'keydown' && e.key !== 'Escape') return;
        if (e.type === 'click' && colorPicker.contains(e.target)) return;
        
        colorPicker.classList.remove('active');
        setTimeout(() => {
          if (colorPicker.parentNode) {
            colorPicker.remove();
          }
        }, 200);
        
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('keydown', closeHandler);
      };
      
      document.addEventListener('click', closeHandler);
      document.addEventListener('keydown', closeHandler);
    }, 100);
  }

  function setTagColor(tagName, colorId) {
    // Validate color ID
    const validColors = ['1', '2', '3', '4', '5', '6', '7', '8', 'default'];
    if (!validColors.includes(colorId)) {
      console.warn('Invalid color ID:', colorId);
      colorId = 'default';
    }
    
    // Update global tags map
    window.SilentStacks.modules.DataManager.setTagColor(tagName, colorId);
    
    // Re-render to apply new colors immediately
    window.SilentStacks.modules.UIController.renderRequests();
    window.SilentStacks.modules.UIController.renderRecentRequests();
    
    // Show brief feedback to user
    showTagColorFeedback(tagName, colorId);
    
    // Remove the color picker with animation
    const picker = document.querySelector('.tag-color-picker');
    if (picker) {
      picker.classList.remove('active');
      setTimeout(() => {
        if (picker.parentNode) {
          picker.remove();
        }
      }, 200);
    }
    
    console.log(`✅ Tag "${tagName}" color changed to ${colorId}`);
  }

  function handleColorKeydown(event, tagName, colorId) {
    const picker = event.target.closest('.tag-color-picker');
    const options = Array.from(picker.querySelectorAll('.color-option'));
    const currentIndex = options.indexOf(event.target);
    
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (currentIndex + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = (currentIndex - 1 + options.length) % options.length;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setTagColor(tagName, colorId);
        return;
      case 'Escape':
        event.preventDefault();
        picker.classList.remove('active');
        setTimeout(() => picker.remove(), 200);
        return;
      default:
        return;
    }
    
    options[newIndex].focus();
  }

  function showTagColorFeedback(tagName, colorId) {
    const colorNames = {
      '1': 'Red', '2': 'Orange', '3': 'Green', '4': 'Blue',
      '5': 'Purple', '6': 'Pink', '7': 'Cyan', '8': 'Orange Red',
      'default': 'Default'
    };
    
    window.SilentStacks.modules.UIController.showNotification(
      `Tag "${tagName}" color changed to ${colorNames[colorId]}`,
      'success',
      2000
    );
  }

  // === Global Functions ===
  window.openTagColorPicker = openTagColorPicker;
  window.setTagColor = setTagColor;
  window.handleColorKeydown = handleColorKeydown;

  // === Module Interface ===
  const MedicalFeatures = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing MedicalFeatures...');
      
      initProgressStepNavigation();
      
      initialized = true;
      console.log('✅ MedicalFeatures initialized');
    },

    // Progress step navigation
    navigateToStep,
    updateProgressDisplay,
    autoAdvanceStep,
    resetProgress,
    getCurrentStep: () => currentStep,

    // Tag color system
    openTagColorPicker,
    setTagColor,
    showTagColorFeedback,

    // Utility
    isInitialized: () => initialized
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('MedicalFeatures', MedicalFeatures);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.MedicalFeatures = MedicalFeatures;
  }
})();
